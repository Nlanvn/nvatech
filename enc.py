import sys, pathlib
KEY = b"nvz-2026-key"
for p in sys.argv[1:]:
    p = pathlib.Path(p)
    d = p.read_bytes()
    p.with_suffix(".dat").write_bytes(bytes(b ^ KEY[i % len(KEY)] for i, b in enumerate(d)))