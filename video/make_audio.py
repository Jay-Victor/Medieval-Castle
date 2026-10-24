# -*- coding: utf-8 -*-
"""Sound design + mix for the Castellum Aureliae promo film.

Narration (Kokoro-82M neural TTS segments) + synthesized ambient score + UI
clicks, ducked and mastered into a 48 kHz stereo bed.
"""
import json, os, math, wave, subprocess, glob, shutil
import numpy as np

SR = 48000
OUT = "video/out"
SEG_DIR = "video/audio/segments-kokoro"
TMP = "tmp/audio48"
CUES = json.load(open("video/audio/cues.json", encoding="utf-8"))
TOTAL = float(CUES["total"])
N = int(math.ceil(TOTAL * SR)) + SR

def read_wav(path):
    with wave.open(path) as w:
        n = w.getnframes()
        data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
        if w.getnchannels() > 1:
            data = data.reshape(-1, w.getnchannels()).mean(axis=1)
        return data

def to48k(src, dst):
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-ar", str(SR), "-ac", "1", dst], check=True)

def fft_filter(x, kind="highpass", fc=80.0, slope=2.0):
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1.0 / SR)
    if kind == "highpass":
        resp = 1.0 / np.sqrt(1.0 + (fc / np.maximum(f, 1e-6)) ** (2 * slope))
    elif kind == "lowpass":
        resp = 1.0 / np.sqrt(1.0 + (np.maximum(f, 1e-6) / fc) ** (2 * slope))
    elif kind == "bandpass":
        lo, hi = fc
        resp = (1.0 / np.sqrt(1.0 + (lo / np.maximum(f, 1e-6)) ** (2 * slope))) * \
               (1.0 / np.sqrt(1.0 + (np.maximum(f, 1e-6) / hi) ** (2 * slope)))
    else:
        resp = np.ones_like(f)
    return np.fft.irfft(X * resp, n=n)

def trim_silence(x, thresh=0.004, pad=0.04):
    idx = np.where(np.abs(x) > thresh)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(pad * SR))
    b = min(len(x), idx[-1] + int(pad * SR))
    return x[a:b]

def build_narration():
    os.makedirs(TMP, exist_ok=True)
    track = np.zeros(N, dtype=np.float32)
    for sc in CUES["scenes"]:
        src = os.path.join(SEG_DIR, sc["id"] + ".wav")
        dst = os.path.join(TMP, sc["id"] + ".wav")
        to48k(src, dst)
        seg = read_wav(dst)
        seg = trim_silence(seg)
        seg = fft_filter(seg, "highpass", 70, 1.2)
        # gentle presence lift + soft knee compression for broadcast feel
        seg = seg / (np.max(np.abs(seg)) + 1e-9) * 0.92
        start = int(sc["voice"] * SR)
        end = min(N, start + len(seg))
        track[start:end] += seg[:end - start]
    return track

def make_ir(seconds=2.8, seed=3):
    rs = np.random.RandomState(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rs.normal(0, 1, n) * np.exp(-t * 2.1)
    ir = fft_filter(ir, "lowpass", 3800, 1.2)
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    return ir

def convolve(x, ir):
    n = len(x) + len(ir) - 1
    nf = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nf) * np.fft.rfft(ir, nf), n=nf)[: len(x)]
    return y

def harp(freq, dur, amp=1.0, bright=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = np.exp(-t * 1.5) * (1 - np.exp(-t * 260))
    sig = np.sin(2 * math.pi * freq * t)
    sig += bright * 0.55 * np.sin(2 * math.pi * freq * 2.004 * t) * np.exp(-t * 2.2)
    sig += bright * 0.28 * np.sin(2 * math.pi * freq * 3.01 * t) * np.exp(-t * 3.4)
    sig += bright * 0.12 * np.sin(2 * math.pi * freq * 4.02 * t) * np.exp(-t * 5.0)
    return (amp * env * sig).astype(np.float32)

def build_score():
    rs = np.random.RandomState(21)
    dur = N / SR
    t = np.arange(N) / SR
    bed = np.zeros(N, dtype=np.float32)

    for freq, amp, det in ((73.42, 0.30, 0.18), (110.0, 0.20, 0.11), (146.83, 0.13, 0.07), (220.0, 0.055, 0.05)):
        lfo = 0.72 + 0.28 * np.sin(2 * math.pi * (0.031 + det * 0.05) * t + freq)
        bed += (amp * lfo * np.sin(2 * math.pi * freq * t + 0.4)).astype(np.float32)
        bed += (amp * 0.22 * lfo * np.sin(2 * math.pi * (freq + det) * t)).astype(np.float32)

    noise = rs.normal(0, 1, N).astype(np.float32)
    noise = fft_filter(noise, "bandpass", (320, 2400), 1.4)
    pad_lfo = 0.5 + 0.5 * np.sin(2 * math.pi * 0.021 * t)
    bed += 0.035 * noise * pad_lfo

    scale = [293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 698.46]
    at = 6.0
    while at < dur - 6:
        steps = [rs.randint(0, 4), rs.randint(1, 5), rs.randint(2, 6)][: rs.randint(2, 4)]
        for i, s in enumerate(steps):
            t0 = at + i * 0.62 + rs.uniform(-0.04, 0.04)
            if t0 >= dur - 4:
                continue
            tone = harp(scale[s], 4.2, 0.105 * (0.72 ** i), bright=0.4)
            i0 = int(t0 * SR)
            i1 = min(N, i0 + len(tone))
            bed[i0:i1] += tone[: i1 - i0]
        at += rs.uniform(10.0, 13.5)

    for k in range(4, int(dur), 12):
        i0 = int(k * SR)
        n = int(1.6 * SR)
        tt = np.arange(n) / SR
        thump = (0.05 * np.exp(-tt * 2.4) * np.sin(2 * math.pi * 55 * tt)).astype(np.float32)
        i1 = min(N, i0 + n)
        bed[i0:i1] += thump[: i1 - i0]

    ir = make_ir(2.8)
    wet = convolve(bed, ir)
    mix = 0.62 * bed + 0.85 * wet
    mix = fft_filter(mix, "lowpass", 7200, 1.1)
    mix = fft_filter(mix, "highpass", 42, 1.1)
    env = np.ones(N, dtype=np.float32)
    head = int(4.5 * SR)
    env[:head] = np.linspace(0, 1, head) ** 1.5
    tail = int(5.5 * SR)
    env[-tail:] = np.linspace(1, 0, tail) ** 1.2
    mix *= env
    mix /= (np.max(np.abs(mix)) + 1e-9)
    return mix.astype(np.float32)

def click_sound():
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    rs = np.random.RandomState(5)
    noise = rs.normal(0, 1, n) * np.exp(-t * 120)
    noise = fft_filter(noise, "bandpass", (900, 5200), 1.0)
    tick = np.sin(2 * math.pi * 1450 * t) * np.exp(-t * 150) * 0.5
    body = np.sin(2 * math.pi * 320 * t) * np.exp(-t * 55) * 0.35
    s = (noise * 0.5 + tick + body).astype(np.float32)
    s = np.concatenate([s, np.zeros(int(0.14 * SR), dtype=np.float32)])
    ir = make_ir(0.9, seed=9)
    s = 0.75 * s + 0.5 * convolve(s, ir)
    return (s / (np.max(np.abs(s)) + 1e-9)).astype(np.float32)

def whoosh():
    n = int(1.5 * SR)
    t = np.arange(n) / SR
    rs = np.random.RandomState(12)
    noise = rs.normal(0, 1, n)
    shapes = np.exp(-((t - 0.55) ** 2) / 0.10)
    s = fft_filter(noise, "bandpass", (180, 2200), 1.0) * shapes
    return (s / (np.max(np.abs(s)) + 1e-9)).astype(np.float32)

def build_sfx():
    track = np.zeros(N, dtype=np.float32)
    click = click_sound()
    for ct in CUES["clicks"]:
        i0 = int(ct * SR)
        i1 = min(N, i0 + len(click))
        track[i0:i1] += 0.55 * click[: i1 - i0]
    w = whoosh()
    for sc in CUES["scenes"][1:]:
        at = sc["start"] - 0.55
        if at < 0:
            continue
        i0 = int(at * SR)
        i1 = min(N, i0 + len(w))
        track[i0:i1] += 0.16 * w[: i1 - i0]
    return track

def duck_envelope(voice):
    block = int(SR / 100)
    n = len(voice) // block
    frames = voice[: n * block].reshape(n, block)
    rms = np.sqrt((frames ** 2).mean(axis=1))
    k = np.hanning(9); k /= k.sum()
    rms = np.convolve(rms, k, mode="same")
    ref = np.percentile(rms, 96) + 1e-9
    norm = np.clip(rms / ref, 0, 1) ** 0.6
    gain = 1.0 - 0.5 * norm
    k2 = np.hanning(45); k2 /= k2.sum()
    gain = np.convolve(gain, k2, mode="same")
    out = np.interp(np.arange(N) / block, np.arange(n), gain).astype(np.float32)
    return np.clip(out, 0.45, 1.0)

def write_stereo(path, left, right):
    pcm = np.clip(np.stack([left, right], 1) * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

def main():
    os.makedirs(OUT, exist_ok=True)
    voice = build_narration()
    score = build_score()
    sfx = build_sfx()

    vpeak = float(np.max(np.abs(voice))) + 1e-9
    voice = voice / vpeak * 0.90
    score = score * 0.30

    duck = duck_envelope(voice)
    mix = voice + score * duck + sfx
    mix = mix[: int(math.ceil(TOTAL * SR))]
    mix = np.tanh(mix * 1.05) * 0.98
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.94
    right = 0.5 * (mix + np.roll(mix, int(0.004 * SR)))
    write_stereo(os.path.join(OUT, "mix.wav"), mix, right)
    print("mix written", round(len(mix) / SR, 2), "s")

    for name, sig in (("voice", voice), ("score", score * duck), ("sfx", sfx)):
        s = sig[: len(mix)]
        write_stereo(os.path.join(OUT, "stem-%s.wav" % name), s, s)

if __name__ == "__main__":
    main()
