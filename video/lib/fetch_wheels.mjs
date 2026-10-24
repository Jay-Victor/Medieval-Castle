/**
 * Download the Python wheels the Kokoro narration needs (onnxruntime, misaki,
 * pypinyin, jieba, cn2an, ...) from a PyPI mirror.
 *
 *   node video/lib/fetch_wheels.mjs
 *
 * Set PYPI_MIRROR to pick a mirror; the default is the Aliyun mirror.
 */
import fs from "node:fs";
import path from "node:path";

const BASE = (process.env.PYPI_MIRROR || "https://mirrors.aliyun.com/pypi/simple").replace(/\/+$/, "");
const OUT = "video/tts/wheels";
const PACKAGES = ["onnxruntime", "jieba", "pypinyin", "cn2an", "proces", "ordered-set", "misaki", "kokoro-onnx"];

fs.mkdirSync(OUT, { recursive: true });

function versionOf(filename) {
  const m = filename.match(/-(\d+(?:\.\d+)+[^-]*?)-/);
  return m ? m[1].split(".").map((n) => parseInt(n, 10) || 0) : [0];
}
function compareVersion(a, b) {
  const A = versionOf(a);
  const B = versionOf(b);
  for (let i = 0; i < Math.max(A.length, B.length); i += 1) {
    const d = (A[i] || 0) - (B[i] || 0);
    if (d) return d;
  }
  return 0;
}
function rank(filename) {
  if (filename.endsWith(".whl")) {
    if (filename.includes("none-any")) return 3;
    if (filename.includes("cp312") && filename.includes("win_amd64")) return 4;
    if (filename.includes("cp312") && filename.includes("none-win")) return 3;
    if (/musllinux|manylinux|macosx|linux_x86/.test(filename)) return -1;
    return -1;
  }
  return filename.endsWith(".tar.gz") ? 1 : -1;
}

for (const name of PACKAGES) {
  try {
    const html = await (await fetch(`${BASE}/${name}/`, { signal: AbortSignal.timeout(30000) })).text();
    const links = [...html.matchAll(/href="([^"]+#sha256=[^"]+)"/g)].map((m) => m[1]);
    const files = links
      .map((href) => ({ href, filename: decodeURIComponent(href.split("#")[0].split("/").pop()) }))
      .filter((f) => rank(f.filename) > 0)
      .sort((a, b) => rank(b.filename) - rank(a.filename) || compareVersion(b.filename, a.filename));
    const best = files[0];
    if (!best) {
      console.log(name, "no suitable file");
      continue;
    }
    const dest = path.join(OUT, best.filename);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log("exists", best.filename);
      continue;
    }
    const url = new URL(best.href.split("#")[0], `${BASE}/${name}/`).toString();
    const t0 = Date.now();
    const res = await fetch(url, { signal: AbortSignal.timeout(300000) });
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log("saved", best.filename, Math.round(buf.length / 1024) + " KB", ((Date.now() - t0) / 1000).toFixed(1) + " s");
  } catch (error) {
    console.log(name, "ERR", error.message);
  }
}
