# 宣传片制作流水线

《金鸢尾堡 / Castellum Aureliae》演示宣传片的全部脚本。

成片 **2 分 04 秒 · 1920×1080 · 30 fps · H.264 + AAC**，约 190 MB，超过 GitHub 单文件上限，**未纳入仓库**。
按本文步骤可在本机完整重新生成（首次需要下载约 350 MB 的语音模型）。

## 分镜

| 时间 | 章节 | 画面 | 片中操作 |
| --- | --- | --- | --- |
| 0:00 | 序章 | 标题卡 → 由近及远露出全览 | — |
| 0:11 | 01 环绕 | 白昼总览缓慢推近 | 光标拖拽画面 |
| 0:23 | 02 剖面 | 全览 → 藏书层剖面 | 点击「楼层剖面 · 藏书层」 |
| 0:35 | 03 九室 | 九室图录 → 藏书阁房间档案 | 点击图录中的 ROOM III |
| 0:47 | 04 展开 | 全览 → 分层展开 | 先点「全览」，再点「分层展开」 |
| 0:59 | 05 庭园 | 晨露露台细部（满幅） | — |
| 1:11 | 06 审校 | 工艺审校弹窗 | 点击「工艺审校通过」 |
| 1:22 | 07 一日之光 | 白昼 10:23 → 夜晚 21:42 | 拖动底部时间轴 |
| 1:36 | 08 带走 | 导出 GLB + 数据卡 | 点击「导出 GLB 模型」 |
| 1:52 | 尾声 | 结尾卡 | — |

旁白文案见 [解说文案.md](解说文案.md)，逐句字幕见 [subtitles.srt](subtitles.srt)，
原始文案数据在 [script.json](script.json)。

## 目录

```
script.json          十段旁白文案（标题、拉丁副题、正文）
scenes.py            由实测配音时长排出每一场的时间轴
build_video.py       逐帧合成 + 编码
make_tts_kokoro.py   旁白合成（Kokoro-82M）
make_audio.py        配乐、音效、混音
make_srt.py          逐句字幕
lib/design.py        字距、金色细线、缓动、纹章等排版工具
lib/cards.py         标题卡、章节卡、标注卡、数据卡、结尾卡
lib/kokoro.py        Kokoro ONNX 推理封装（约 100 行）
lib/fonts.py         @fontsource 的 woff → ttf 转换（Pillow 需要 ttf）
lib/fetch_model.mjs  从 hf-mirror 下载模型与音色
lib/fetch_wheels.mjs 从 PyPI 镜像下载依赖 wheel
lib/install_tts.py   解包 wheel 与 jieba sdist
```

## 环境准备

```bash
node video/lib/fetch_model.mjs     # 模型 + 音色  → video/tts/model（约 320 MB）
node video/lib/fetch_wheels.mjs    # 依赖 wheel   → video/tts/wheels
python video/lib/install_tts.py    # 解包         → video/tts/py
python video/lib/fonts.py          # 字体 woff→ttf → video/assets/fonts
```

镜像可用 `HF_MIRROR`、`PYPI_MIRROR` 环境变量替换。以上目录均已加入 `.gitignore`。

## 生成

```bash
# 1 · 旁白
python video/make_tts_kokoro.py        # → video/audio/segments-kokoro/*.wav
python video/lib/mk_durations.py       # → video/audio/durations.json

# 2 · 画面（约 16 分钟，3734 帧）
python video/build_video.py --all      # → video/out/video-final.mp4

# 3 · 声音
python video/make_audio.py             # → video/out/mix.wav

# 4 · 合成
ffmpeg -y -i video/out/video-final.mp4 -i video/out/mix.wav \
  -c:v copy -c:a aac -b:a 192k -movflags +faststart “金鸢尾堡-演示宣传片.mp4”

# 5 · 字幕与文案
python video/make_srt.py
python video/lib/mk_doc.py
```

只重做片尾 / 某一段：`python video/build_video.py --from-frame 3400 --to-frame 3734`，
再跑第 4 步即可。

## 画面做法

- 以项目自带的真实渲染截图（`../previews/`）为「舞台画面」：前景是锐化后的应用窗口，
  背景是同一张图的高斯模糊与压暗版本，四周留出影调留白。
- 每一场由 `scenes.py` 根据**实测配音时长**自动排布，镜头动作、点击时刻与旁白严格对齐。
- 逐帧合成：调色 LUT、暗角、胶片颗粒、光标与点击涟漪、引线标注，
  再经 `hqdn3d` 轻降噪与 x264 CRF 22 编码。

> 说明：受运行环境限制，本片不是屏幕录制，而是由真实渲染截图 + 程序化运镜与光标编排合成，
> 观感接近录屏，但画面中的“旋转”是推镜而非真实转动视角。

## 声音做法

- **旁白**：Kokoro-82M 中文神经语音 `zf_xiaoxiao`，24 kHz，语速 0.88；
  按标点切句（逗号 0.20 s / 分号 0.34 s / 句号 0.52 s）逐句合成后拼接，句首句尾 6 ms 淡入淡出。
- **配乐**：D 小调持续低音 + 气声铺底 + 稀疏竖琴音型，FFT 卷积混响，首尾淡入淡出。
- **音效**：界面点击（带 0.9 s 短混响）、章节转场气声。
- **混音**：旁白为主，配乐按旁白包络自动闪避，软限幅后峰值 −0.5 dBFS。

音色与语速可通过环境变量替换：

```bash
$env:KOKORO_VOICE="zm_yunjian"   # 男声
$env:KOKORO_SPEED="0.92"
python video/make_tts_kokoro.py
```

替换后需重新执行 1→4 步（时间轴依赖实测时长）。

## 依赖

| | |
| --- | --- |
| Python | 3.10+，`Pillow`、`numpy`、`onnxruntime`（见环境准备） |
| Node.js | 18+（下载脚本使用内置 fetch） |
| ffmpeg | 需要 libx264 |
