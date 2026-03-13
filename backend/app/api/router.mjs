import { getHealthPayload } from "../modules/system/health-service.mjs";
import { renderHomePage } from "../modules/system/home-page-service.mjs";
import { checkSourceAccess } from "../modules/retrieval/source-access-check-service.mjs";

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

    return writeJson(response, 404, {
      status: "not_found",
      path: url.pathname,
    });
  };
}
