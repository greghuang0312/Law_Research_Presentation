import http from "node:http";
import { pathToFileURL } from "node:url";
import { createRequestHandler } from "./app/api/router.mjs";
import { ensureLegalOneRuntimeReady } from "./app/integrations/legalone_r1/legalone-r1-config-service.mjs";

export function createServer({ rootDir = process.cwd() } = {}) {
  const requestHandler = createRequestHandler({ rootDir });
  return http.createServer(requestHandler);
}

export async function startServer({
  port = Number(process.env.PORT ?? 3000),
  host = process.env.HOST ?? "127.0.0.1",
  rootDir = process.cwd(),
} = {}) {
  await ensureLegalOneRuntimeReady({ rootDir });
  const server = createServer({ rootDir });

  await new Promise((resolve, reject) => {
    server.listen(port, host, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  return server;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";

if (invokedPath === import.meta.url) {
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? "127.0.0.1";
  const rootDir = process.cwd();

  startServer({ port, host, rootDir })
    .then(() => {
      // Keep output concise for script parsers.
      console.log(`server listening on http://${host}:${port}`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
