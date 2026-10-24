import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { stat, readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const PORT = Number(process.env.PORT || 4173);
const OPEN_BROWSER = process.env.OPEN_BROWSER === "1";

function openBrowser(url) {
  const options = { stdio: "ignore", detached: true, windowsHide: true };
  const winCmd = process.env.ComSpec || "cmd.exe";
  const command = process.platform === "win32"
    ? [winCmd, ["/c", "start", "", url]]
    : process.platform === "darwin"
      ? ["open", [url]]
      : ["xdg-open", [url]];
  try {
    const child = spawn(command[0], command[1], options);
    child.on("error", () => {});
    child.unref();
  } catch (error) {
    console.warn("Could not open the browser automatically:", error.message);
  }
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json"
};

function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const target = normalize(join(ROOT, clean));
  return target.startsWith(ROOT) ? target : null;
}

const server = createServer(async (req, res) => {
  try {
    let filePath = safePath(req.url === "/" ? "/index.html" : req.url);
    if (!filePath) {
      res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }
    let info;
    try {
      info = await stat(filePath);
    } catch {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found: " + req.url);
      return;
    }
    if (info.isDirectory()) filePath = join(filePath, "index.html");
    const data = await readFile(filePath);
    const type = MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "content-type": type,
      "cache-control": "no-store",
      "access-control-allow-origin": "*"
    });
    res.end(data);
  } catch (error) {
    console.error("Serve error", error);
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("Internal server error");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  const url = "http://127.0.0.1:" + PORT + "/";
  console.log("Castellum Aureliae is open at " + url);
  if (OPEN_BROWSER) {
    console.log("Opening the default browser...");
    openBrowser(url);
  }
});
