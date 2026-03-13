import { getHealthPayload } from "../modules/system/health-service.mjs";
import { renderHomePage } from "../modules/system/home-page-service.mjs";

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

    return writeJson(response, 404, {
      status: "not_found",
      path: url.pathname,
    });
  };
}
