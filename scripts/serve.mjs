import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

export function serveSite({ port = Number(process.env.PORT || 8080), host = "127.0.0.1" } = {}) {
  if (!existsSync(distDir)) {
    throw new Error("dist/ does not exist. Run npm run build first.");
  }

  const server = createServer((request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host || host}`);
    const filePath = resolvePublicPath(url.pathname);

    if (!filePath) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }

    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
  });

  server.listen(port, host, () => {
    console.log(`Site is running: http://${host}:${port}/`);
  });

  return server;
}

function resolvePublicPath(requestPath) {
  const decoded = decodeURIComponent(requestPath);
  const normalizedPath = decoded === "/" ? "/index.html" : decoded;
  const filePath = path.normalize(path.join(distDir, normalizedPath));
  return filePath.startsWith(distDir) ? filePath : null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  serveSite();
}
