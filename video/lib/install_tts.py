# -*- coding: utf-8 -*-
"""Unpack the wheels fetched by fetch_wheels.mjs into video/tts/py.

    python video/lib/install_tts.py

jieba ships as an sdist, so its package directory is copied file by file
(the sandbox on some machines refuses tarfile's directory creation).
"""
import glob
import os
import tarfile
import zipfile

WHEELS = "video/tts/wheels"
TARGET = "video/tts/py"


def main():
    os.makedirs(TARGET, exist_ok=True)
    for wheel in sorted(glob.glob(os.path.join(WHEELS, "*.whl"))):
        with zipfile.ZipFile(wheel) as zf:
            zf.extractall(TARGET)
        print("wheel", os.path.basename(wheel))

    for sdist in sorted(glob.glob(os.path.join(WHEELS, "jieba-*.tar.gz"))):
        with tarfile.open(sdist) as tf:
            count = 0
            for member in tf.getmembers():
                parts = member.name.split("/")
                if len(parts) > 2 and parts[1] == "jieba" and member.isfile():
                    dest = os.path.join(TARGET, "jieba", *parts[2:])
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    with tf.extractfile(member) as src, open(dest, "wb") as out:
                        out.write(src.read())
                    count += 1
        print("jieba files", count)
    print("done ->", TARGET)


if __name__ == "__main__":
    main()
