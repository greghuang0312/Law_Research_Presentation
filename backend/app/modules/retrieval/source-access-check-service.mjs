import { loadSourcePolicies, evaluateSourcePolicy } from "./source-policy-service.mjs";
import { createRateLimiter } from "./rate-limit-service.mjs";
import { withRetry } from "./retry-service.mjs";
import { appendSourceAccessLog } from "../../infrastructure/logging/source-access-log.mjs";

const stateByRoot = new Map();

function getState({ rootDir }) {
  const key = String(rootDir);
  const existing = stateByRoot.get(key);
  if (existing) return existing;

  const limit = Number(process.env.SOURCE_RATE_LIMIT_PER_MINUTE ?? 30);
  const limiter = createRateLimiter({
    limit: Number.isFinite(limit) && limit > 0 ? limit : 30,
    windowMs: 60_000,
  });

  const next = {
    limiter,
    policiesPromise: null,
  };
  stateByRoot.set(key, next);
  return next;
}

async function getPolicies({ rootDir }) {
  const state = getState({ rootDir });
  if (!state.policiesPromise) {
    state.policiesPromise = loadSourcePolicies({ rootDir });
  }
  return state.policiesPromise;
}

export async function checkSourceAccess({
  rootDir,
  targetUrl,
  mode = "auto",
}) {
  const policies = await withRetry(
    () => getPolicies({ rootDir }),
    { retries: 2, delayMs: 10 },
  );

  const decision = evaluateSourcePolicy({
    policies,
    targetUrl,
    mode,
  });

  const state = getState({ rootDir });
  const limiterResult = state.limiter.tryConsume(decision.host || "unknown");

  let finalDecision = decision;
  if (!limiterResult.allowed) {
    finalDecision = {
      ...decision,
      allowed: false,
      status: "blocked",
      reason: "rate_limit_exceeded",
    };
  }

  const logPath = await appendSourceAccessLog({
    rootDir,
    entry: {
      target_url: targetUrl,
      mode,
      host: finalDecision.host,
      allowed: finalDecision.allowed,
      status: finalDecision.status,
      reason: finalDecision.reason,
      rule: finalDecision.rule,
      rate_limit: {
        limit: limiterResult.limit,
        remaining: limiterResult.remaining,
        retry_after_ms: limiterResult.retryAfterMs,
      },
      policy_version: policies.version,
    },
  });

  return {
    ...finalDecision,
    rateLimit: limiterResult,
    policyVersion: policies.version,
    logPath,
  };
}
