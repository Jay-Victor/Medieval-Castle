import json, shutil, os
src = "video/audio/durations-kokoro.json"
dst = "video/audio/durations.json"
if os.path.exists(dst):
    shutil.copy(dst, "video/audio/durations-baidu.json")
rows = json.load(open(src))
json.dump(rows, open(dst, "w"), indent=1)
print("segments", len(rows), "total", round(sum(r["duration"] for r in rows), 2))
