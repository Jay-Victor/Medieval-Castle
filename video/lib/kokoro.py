# -*- coding: utf-8 -*-
"""Minimal Kokoro-82M ONNX runner (Chinese via misaki G2P)."""
import os, sys, json, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
LIB = os.path.join(ROOT, "video", "tts", "py")
sys.path.insert(0, LIB)

import onnxruntime as ort

MODEL = os.path.join(ROOT, "video", "tts", "model", "model.onnx")
VOICE_DIR = os.path.join(ROOT, "video", "tts", "model")
SR = 24000

class Kokoro:
    def __init__(self, model_path=MODEL):
        so = ort.SessionOptions()
        so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        so.intra_op_num_threads = 0
        self.sess = ort.InferenceSession(model_path, sess_options=so, providers=["CPUExecutionProvider"])
        self.inputs = [(i.name, i.type) for i in self.sess.get_inputs()]
        with open(os.path.join(LIB, "kokoro_onnx", "config.json"), encoding="utf-8") as f:
            cfg = json.load(f)
        self.vocab = cfg["vocab"]
        self.max_ph = cfg.get("max_dur", 510)
        self._g2p = None

    def g2p(self):
        if self._g2p is None:
            from misaki.zh import ZHG2P
            self._g2p = ZHG2P()
        return self._g2p

    def phonemize(self, text):
        ps, _ = self.g2p()(text)
        return " ".join(ps.split())

    def tokens(self, ps):
        return [self.vocab[c] for c in ps if c in self.vocab]

    def voice(self, name):
        arr = np.fromfile(os.path.join(VOICE_DIR, name + ".bin"), dtype=np.float32)
        return arr.reshape(-1, 256)

    def synth_phonemes(self, ps, voice, speed=1.0):
        ids = self.tokens(ps)
        if not ids:
            return np.zeros(0, dtype=np.float32)
        style = voice[min(len(ids), len(voice)) - 1]
        feed = {}
        for name, typ in self.inputs:
            if name == "input_ids":
                feed[name] = np.array([[0, *ids, 0]], dtype=np.int64)
            elif name == "style":
                feed[name] = style.reshape(1, -1).astype(np.float32)
            elif name == "speed":
                feed[name] = np.array([speed], dtype=np.float32)
        out = self.sess.run(None, feed)
        audio = np.asarray(out[0]).ravel().astype(np.float32)
        return audio

    def synth_text(self, text, voice_name="zf_xiaoxiao", speed=1.0):
        ps = self.phonemize(text)
        v = self.voice(voice_name)
        return self.synth_phonemes(ps, v, speed), ps

def write_wav(path, audio, sr=SR):
    pcm = np.clip(audio * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
