# Demo film — production pipeline

Every script behind the *Castellum Aureliae* demo film.

The finished film is **2:04 · 1920×1080 · 30 fps · H.264 + AAC**, about 190 MB. It exceeds GitHub's
per-file limit, so it is **not committed**; it ships as a release asset. Everything below regenerates
it locally (the first run downloads about 350 MB of speech model).

[中文](README.md) · [English](README.en.md)

## Storyboard

| Time | Chapter | Picture | On-screen action |
| --- | --- | --- | --- |
| 0:00 | Prologue | title card → pull back to the overview | — |
| 0:11 | 01 Orbit | daylight overview, slow push-in | cursor drags the scene |
| 0:23 | 02 Storeys | overview → library section | click “Floor section · Library” |
| 0:35 | 03 Nine rooms | room atlas → the library dossier | click ROOM III in the atlas |
| 0:47 | 04 Exploded | overview → exploded axonometric | click “Whole”, then “Exploded” |
| 0:59 | 05 Parterre | morning balcony detail, full bleed | — |
| 1:11 | 06 Survey | craftsmanship audit dialog | click “Craftsmanship verified” |
| 1:22 | 07 A day in light | day 10:23 → night 21:42 | drag the bottom timeline |
| 1:36 | 08 Archive | GLB export + data card | click “Export GLB model” |
| 1:52 | Coda | end card | — |

Narration text: [narration.en.md](narration.en.md) (English) · [narration.md](narration.md) (中文).
Sentence-level subtitles: [subtitles.srt](subtitles.srt). Source copy: [script.json](script.json).

## Layout

```
script.json          ten narration blocks (title, Latin subtitle, Chinese + English body)
scenes.py            builds the timeline from the measured narration lengths
build_video.py       frame compositing and encoding
make_tts_kokoro.py   narration synthesis (Kokoro-82M)
make_audio.py        score, sound effects, mix
make_srt.py          sentence-level subtitles
lib/design.py        tracking, hairlines, easings, the drawn crest
lib/cards.py         title, chapter, callout, data and end cards
lib/kokoro.py        ~100-line ONNX wrapper around Kokoro
lib/fonts.py         woff → ttf conversion for the @fontsource faces Pillow needs
lib/fetch_model.mjs  pull the model and voices from hf-mirror
lib/fetch_wheels.mjs pull the Python wheels from a PyPI mirror
lib/install_tts.py   unpack the wheels and the jieba sdist
lib/make_poster.py   build the clickable poster used at the top of the READMEs
```

## Setup

```bash
node video/lib/fetch_model.mjs     # model + voices  → video/tts/model (~320 MB)
node video/lib/fetch_wheels.mjs    # wheels          → video/tts/wheels
python video/lib/install_tts.py    # unpack          → video/tts/py
python video/lib/fonts.py          # woff → ttf      → video/assets/fonts
```

Override the mirrors with `HF_MIRROR` and `PYPI_MIRROR`. All of these directories are git-ignored.

## Build

```bash
# 1 · narration
python video/make_tts_kokoro.py        # → video/audio/segments-kokoro/*.wav
python video/lib/mk_durations.py       # → video/audio/durations.json

# 2 · picture (~16 minutes, 3734 frames)
python video/build_video.py --all      # → video/out/video-final.mp4

# 3 · sound
python video/make_audio.py             # → video/out/mix.wav

# 4 · mux
ffmpeg -y -i video/out/video-final.mp4 -i video/out/mix.wav \
  -c:v copy -c:a aac -b:a 192k -movflags +faststart "金鸢尾堡-演示宣传片.mp4"

# 5 · subtitles and documents
python video/make_srt.py
python video/lib/mk_doc.py
```

To redo only the coda or a single passage:
`python video/build_video.py --from-frame 3400 --to-frame 3734`, then run step 4 again.

## How the picture is made

- The project's own renders (`../previews/`) are the stage: the app window is sharpened in the
  foreground over a blurred, darkened copy of itself, leaving tonal margins around the frame.
- `scenes.py` lays out every scene from the **measured narration length**, so camera moves, click
  instants and voice-over stay locked together.
- Each frame is composited with a grade LUT, vignette, film grain, the cursor and click ripples and
  leader-line callouts, then encoded with `hqdn3d` and x264 at CRF 22.

> Note: the film is not a screen recording. It is composed from the project's real renders with
> programmatic camera moves and cursor choreography — close to a screen capture, but the "orbit"
> in the picture is a push-in rather than a live rotation.

## How the sound is made

- **Narration** — Kokoro-82M Chinese neural voice `zf_xiaoxiao`, 24 kHz, speed 0.88. The script is
  split on punctuation (comma 0.20 s, semicolon 0.34 s, full stop 0.52 s), synthesised clause by
  clause and joined, with 6 ms fades at every seam.
- **Score** — a D-minor drone, an airy pad and sparse harp figures, FFT convolution reverb, slow
  fades at both ends.
- **Effects** — UI clicks (with a 0.9 s room), chapter-transition air.
- **Mix** — narration forward, score ducked by the narration envelope, soft-clipped to −0.5 dBFS.

Voice and speed are environment variables:

```bash
$env:KOKORO_VOICE="zm_yunjian"   # male narrator
$env:KOKORO_SPEED="0.92"
python video/make_tts_kokoro.py
```

Changing them means re-running steps 1 → 4, because the timeline depends on the measured lengths.

## Requirements

| | |
| --- | --- |
| Python | 3.10+, `Pillow`, `numpy`, `onnxruntime` (see setup) |
| Node.js | 18+ (the download scripts use the built-in fetch) |
| ffmpeg | built with libx264 |
