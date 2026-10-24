/**
 * Download the Kokoro-82M ONNX model and Chinese voice styles from the
 * HuggingFace mirror (hf-mirror.com works well from mainland China).
 *
 *   node video/lib/fetch_model.mjs
 *
 * Files land in video/tts/model/ (~320 MB, git-ignored).
 */
import fs from "node:fs";
import path from "node:path";

const REPO = "onnx-community/Kokoro-82M-v1.0-ONNX";
const MIRROR = process.env.HF_MIRROR || "https://hf-mirror.com";
const OUT = "video/tts/model";

const FILES = [
  ["config.json", "config.json"],
  ["tokenizer.json", "tokenizer.json"],
  ["onnx/model.onnx", "model.onnx"],
  ["voices/zf_xiaoxiao.bin", "zf_xiaoxiao.bin"],
  ["voices/zf_xiaoyi.bin", "zf_xiaoyi.bin"],
  ["voices/zf_xiaobei.bin", "zf_xiaobei.bin"],
  ["voices/zm_yunxi.bin", "zm_yunxi.bin"],
  ["voices/zm_yunjian.bin", "zm_yunjian.bin"],
];

fs.mkdirSync(OUT, { recursive: true });

for (const [remote, local] of FILES) {
  const dest = path.join(OUT, local);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log("exists", local);
    continue;
  }
  const url = `${MIRROR}/${REPO}/resolve/main/${remote}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(600000) });
    if (!res.ok) {
      console.log(remote, "HTTP", res.status);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log("saved", dest, Math.round(buf.length / 1024) + " KB", ((Date.now() - t0) / 1000).toFixed(1) + " s");
  } catch (error) {
    console.log(remote, "ERR", error.message);
  }
}
