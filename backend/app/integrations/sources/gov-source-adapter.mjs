import { randomUUID } from "node:crypto";
import { withRetry } from "../../modules/retrieval/retry-service.mjs";
import { checkSourceAccess } from "../../modules/retrieval/source-access-check-service.mjs";

function toError({ classification, targetUrl, message }) {
  return {
    id: randomUUID(),
    classification,
    target_url: targetUrl,
    message,
    created_at: new Date().toISOString(),
  };
}

function parseHtmlSources(html, targetUrl) {
  const matches = [...String(html).matchAll(/href="(https:\/\/www\.gov\.cn\/[^"]+)"[^>]*>([^<]+)</gi)];
  return matches.slice(0, 5).map((match) => ({
    title: String(match[2] ?? "").trim(),
    url: String(match[1] ?? "").trim(),
    published_at: new Date().toISOString().slice(0, 10),
    source_type: "official_gov",
    target_url: targetUrl,
  }));
}

function parseJsonSources(payload, targetUrl) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  return items.map((item) => ({
    title: String(item.title ?? "").trim(),
    url: String(item.url ?? "").trim(),
    published_at: String(item.published_at ?? "").trim(),
    source_type: String(item.source_type ?? "official_gov").trim(),
    target_url: targetUrl,
  }));
}

export async function retrieveGovSources({
  rootDir = process.cwd(),
  topic,
  searchUrl,
  fetchImpl = fetch,
}) {
  const targetUrl =
    searchUrl ??
    `https://www.gov.cn/sousuo/search.htm?searchWord=${encodeURIComponent(String(topic ?? "").trim())}`;

  const access = await checkSourceAccess({
    rootDir,
    targetUrl,
    mode: "auto",
  });

  if (!access.allowed) {
    return {
      items: [],
      errors: [
        toError({
          classification: "policy_blocked",
          targetUrl,
          message: `source policy blocked access: ${access.reason}`,
        }),
      ],
    };
  }

  try {
    const response = await withRetry(
      () => fetchImpl(targetUrl, { headers: { accept: "application/json, text/html;q=0.9" } }),
      { retries: 2, delayMs: 50 },
    );

    if (!response.ok) {
      return {
        items: [],
        errors: [
          toError({
            classification: "network_failure",
            targetUrl,
            message: `request failed with status ${response.status}`,
          }),
        ],
      };
    }

    const contentType = String(response.headers.get("content-type") ?? "").toLowerCase();
    let items = [];

    if (contentType.includes("application/json")) {
      items = parseJsonSources(await response.json(), targetUrl);
    } else {
      items = parseHtmlSources(await response.text(), targetUrl);
    }

    if (items.length === 0) {
      return {
        items: [],
        errors: [
          toError({
            classification: "parse_failure",
            targetUrl,
            message: "no usable gov.cn sources were extracted from the response",
          }),
        ],
      };
    }

    return {
      items,
      errors: [],
    };
  } catch (error) {
    return {
      items: [],
      errors: [
        toError({
          classification: "network_failure",
          targetUrl,
          message: error instanceof Error ? error.message : "unknown network failure",
        }),
      ],
    };
  }
}
