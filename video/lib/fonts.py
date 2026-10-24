"""Convert WOFF (not WOFF2) to TTF so Pillow/FreeType can load @fontsource files."""
import struct, zlib, os, sys

def woff_to_ttf(src, dst):
    data = open(src, 'rb').read()
    sig, flavor, length, numTables = struct.unpack('>4sIIH', data[:14])
    assert sig == b'wOFF', 'not a woff file'
    tables = []
    off = 44
    for i in range(numTables):
        tag, offset, compLen, origLen, checksum = struct.unpack('>4sIIII', data[off:off+20])
        off += 20
        tables.append((tag, offset, compLen, origLen, checksum))
    tables.sort(key=lambda t: t[0])
    out_tables = []
    for tag, offset, compLen, origLen, checksum in tables:
        raw = data[offset:offset+compLen]
        if compLen < origLen:
            raw = zlib.decompress(raw)
        out_tables.append((tag, raw, checksum))
    num = len(out_tables)
    # search ranges
    entrySelector = 0
    while (1 << (entrySelector + 1)) <= num:
        entrySelector += 1
    searchRange = (1 << entrySelector) * 16
    rangeShift = num * 16 - searchRange
    header = struct.pack('>IHHHH', int(flavor), num, searchRange, entrySelector, rangeShift)
    offset = 12 + num * 16
    dir_entries = b''
    body = b''
    for tag, raw, checksum in out_tables:
        pad = (-len(raw)) % 4
        dir_entries += struct.pack('>4sIII', tag, checksum, offset + len(body), len(raw))
        body += raw + b'\0' * pad
    open(dst, 'wb').write(header + dir_entries + body)
    return dst

if __name__ == '__main__':
    base = 'node_modules/@fontsource'
    jobs = [
        (f'{base}/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff', 'video/assets/fonts/Cormorant-400.ttf'),
        (f'{base}/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff', 'video/assets/fonts/Cormorant-500.ttf'),
        (f'{base}/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff', 'video/assets/fonts/Cormorant-600.ttf'),
        (f'{base}/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff', 'video/assets/fonts/Cormorant-400i.ttf'),
        (f'{base}/alegreya-sans/files/alegreya-sans-latin-500-normal.woff', 'video/assets/fonts/AlegreyaSans-500.ttf'),
        (f'{base}/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff', 'video/assets/fonts/IBMPlexMono-400.ttf'),
    ]
    os.makedirs('video/assets/fonts', exist_ok=True)
    for src, dst in jobs:
        if not os.path.exists(src):
            print('MISSING', src); continue
        try:
            woff_to_ttf(src, dst)
            print('ok', dst, os.path.getsize(dst))
        except Exception as e:
            print('fail', src, e)
