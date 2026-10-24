import wave, numpy as np, json
CUES = json.load(open("video/audio/cues.json", encoding="utf-8"))
def read(p):
    with wave.open(p) as w:
        sr = w.getframerate(); n = w.getnframes()
        d = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32)/32768
    return d.reshape(-1, 2).mean(axis=1), sr
mix, sr = read("video/out/mix.wav")
voice, _ = read("video/out/stem-voice.wav")
score, _ = read("video/out/stem-score.wav")
print("mix dur", round(len(mix)/sr, 2), "peak", round(float(np.abs(mix).max()), 3), "rms", round(float(np.sqrt((mix**2).mean())), 4))
print("voice rms", round(float(np.sqrt((voice**2).mean())), 4), "score rms", round(float(np.sqrt((score**2).mean())), 4))
for sc in CUES["scenes"]:
    a = int(sc["voice"]*sr); b = int(min(len(voice), a + sc["voice_dur"]*sr))
    seg = voice[a:b]
    print("%-10s rms %.4f peak %.3f" % (sc["id"], float(np.sqrt((seg**2).mean())), float(np.abs(seg).max())))
