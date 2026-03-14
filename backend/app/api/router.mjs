import { getHealthPayload } from "../modules/system/health-service.mjs";
import { renderHomePage } from "../modules/system/home-page-service.mjs";
import { checkSourceAccess } from "../modules/retrieval/source-access-check-service.mjs";
import { runRetrieval } from "../modules/retrieval/retrieval-orchestrator.mjs";
import { generateLessonDraft } from "../modules/generation/legalone-generation-service.mjs";

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function writeHtml(response, statusCode, html) {
  response.writeHead(statusCode, {
    "content-type": "text/html; charset=utf-8",
  });
  response.end(html);
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw);
}

export function createRequestHandler({ rootDir }) {
  return async (request, response) => {
    const method = request.method ?? "GET";
    const host = request.headers.host ?? "127.0.0.1";
    const url = new URL(request.url ?? "/", `http://${host}`);

    if (method === "GET" && url.pathname === "/health") {
      return writeJson(response, 200, getHealthPayload());
    }

    if (method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      try {
        const html = await renderHomePage({ rootDir });
        return writeHtml(response, 200, html);
      } catch {
        return writeJson(response, 500, {
          status: "error",
          message: "frontend index.html not found",
        });
      }
    }

    if (method === "GET" && url.pathname === "/api/source-access-check") {
      const targetUrl = String(url.searchParams.get("url") ?? "").trim();
      const mode = String(url.searchParams.get("mode") ?? "auto").trim().toLowerCase();
      if (!targetUrl) {
        return writeJson(response, 400, {
          status: "error",
          message: "query parameter `url` is required",
        });
      }

      const result = await checkSourceAccess({
        rootDir,
        targetUrl,
        mode: mode === "manual" ? "manual" : "auto",
      });

      const httpStatus = result.allowed ? 200 : result.reason === "rate_limit_exceeded" ? 429 : 403;
      return writeJson(response, httpStatus, {
        status: result.status,
        allowed: result.allowed,
        reason: result.reason,
        rule: result.rule,
        host: result.host,
        policy_version: result.policyVersion,
        rate_limit: result.rateLimit,
        log_path: result.logPath,
      });
    }

    if (method === "POST" && url.pathname === "/api/legalone-r1/generate") {
      let payload;
      try {
        payload = await readJsonBody(request);
      } catch {
        return writeJson(response, 400, {
          status: "error",
          reason: "invalid_json",
          message: "request body must be valid JSON",
        });
      }

      try {
        const result = await generateLessonDraft({
          rootDir,
          sourceTag: payload.sourceTag,
          text: payload.text,
          promptOptions: payload.promptOptions,
        });

        return writeJson(response, 200, {
          status: "ok",
          result,
        });
      } catch (error) {
        if (error?.code === "invalid_source_tag") {
          return writeJson(response, 400, {
            status: "error",
            reason: error.code,
            message: error.message,
            allowed_tags: error.allowedTags,
          });
        }

        if (error?.code === "license_review_pending" || error?.code === "license_review_mismatch") {
          return writeJson(response, 403, {
            status: "error",
            reason: error.code,
            message: error.message,
            review_status: error.review?.review_status ?? "pending",
          });
        }

        if (error?.code === "missing_generation_text") {
          return writeJson(response, 400, {
            status: "error",
            reason: error.code,
            message: error.message,
          });
        }

        if (error?.code === "legalone_config_invalid") {
          return writeJson(response, 503, {
            status: "error",
            reason: error.code,
            message: error.message,
          });
        }

        return writeJson(response, 500, {
          status: "error",
          reason: "generation_failed",
          message: error instanceof Error ? error.message : "unknown generation error",
        });
      }
    }

    if (method === "POST" && url.pathname === "/api/retrieval/search") {
      let payload;
      try {
        payload = await readJsonBody(request);
      } catch {
        return writeJson(response, 400, {
          status: "error",
          reason: "invalid_json",
          message: "request body must be valid JSON",
        });
      }

      try {
        const result = await runRetrieval({
          rootDir,
          topic: String(payload.topic ?? "").trim(),
          mode: payload.mode,
          allowOnlineSources: Boolean(payload.allowOnlineSources),
        });

        return writeJson(response, 200, {
          status: "ok",
          ...result,
        });
      } catch (error) {
        if (error?.code === "invalid_retrieval_mode") {
          return writeJson(response, 400, {
            status: "error",
            reason: error.code,
            message: error.message,
          });
        }

        return writeJson(response, 500, {
          status: "error",
          reason: "retrieval_failed",
          message: error instanceof Error ? error.message : "unknown retrieval error",
        });
      }
    }

    return writeJson(response, 404, {
      status: "not_found",
      path: url.pathname,
    });
  };
}
