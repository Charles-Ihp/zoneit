import { createServer } from "http";
import { readFile, stat } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join, extname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, "dist");
const PORT = process.env.PORT || 3000;

const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

createServer(async (req, res) => {
  let filePath = join(distPath, req.url === "/" ? "index.html" : req.url);

  try {
    await stat(filePath);
  } catch {
    // SPA fallback
    filePath = join(distPath, "index.html");
  }

  try {
    const data = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
