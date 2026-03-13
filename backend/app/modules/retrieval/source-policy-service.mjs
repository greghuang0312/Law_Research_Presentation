import path from "node:path";
import { readFile } from "node:fs/promises";

function normalizeHost(value) {
  return String(value ?? "").trim().toLowerCase();
}

function parseTargetUrl(targetUrl) {
  try {
    return new URL(targetUrl);
  } catch {
    return null;
  }
}

function matchesRule(host, rule) {
  if (rule.host && normalizeHost(rule.host) === host) return true;
  if (rule.hostSuffix && host.endsWith(normalizeHost(rule.hostSuffix))) return true;
  return false;
}

function getModeDecision({ mode, accessMode }) {
  if (mode === "deny") {
    return {
      allowed: false,
      status: "blocked",
      reason: "policy_deny",
    };
  }

  if (mode === "manual-only" && accessMode === "auto") {
    return {
      allowed: false,
      status: "blocked",
      reason: "policy_manual_only",
    };
  }

  return {
    allowed: true,
    status: "allowed",
    reason: mode === "manual-only" ? "manual_mode_allowed" : "policy_allow",
  };
}

export async function loadSourcePolicies({ rootDir = process.cwd() } = {}) {
  const configPath = path.join(rootDir, "backend", "config", "source-policy.json");
  const raw = await readFile(configPath, "utf8");
  const parsed = JSON.parse(raw);
  return {
    configPath,
    version: parsed.version ?? "unknown",
    defaultMode: parsed.defaultMode ?? "deny",
    rules: Array.isArray(parsed.rules) ? parsed.rules : [],
  };
}

export function evaluateSourcePolicy({
  policies,
  targetUrl,
  mode = "auto",
}) {
  const parsedUrl = parseTargetUrl(targetUrl);
  if (!parsedUrl) {
    return {
      allowed: false,
      status: "blocked",
      reason: "invalid_url",
      rule: { id: "invalid-url", mode: "deny" },
      normalizedTarget: "",
      host: "",
    };
  }

  const host = normalizeHost(parsedUrl.hostname);
  const accessMode = mode === "manual" ? "manual" : "auto";
  const exactRule = policies.rules.find((rule) => rule.host && matchesRule(host, rule));
  const suffixRule = policies.rules.find((rule) => !rule.host && rule.hostSuffix && matchesRule(host, rule));
  const matchedRule = exactRule ?? suffixRule ?? { id: "default", mode: policies.defaultMode, reason: "default_policy" };

  const decision = getModeDecision({
    mode: matchedRule.mode ?? policies.defaultMode ?? "deny",
    accessMode,
  });

  return {
    ...decision,
    host,
    normalizedTarget: parsedUrl.toString(),
    rule: {
      id: matchedRule.id ?? "unnamed-rule",
      mode: matchedRule.mode ?? policies.defaultMode ?? "deny",
      reason: matchedRule.reason ?? "unspecified",
    },
  };
}
