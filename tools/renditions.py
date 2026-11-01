#!/usr/bin/env python3
"""Make lower-quality renditions (1080p/720p/480p/360p...) for the site's uploaded / Drive videos and register them.
Usage (from the app dir, with Cloudflare credentials in env):  python3 tools/renditions.py [p9 | 34 | all]
- reads each product / portfolio video through the public /v/<id> stream (original stays the top quality, untouched)
- encodes every standard height below the original (h264 + aac, faststart), stores them in MEDIA_KV (25 MB max each)
- writes products.video_q / portfolio.video_q = {"src": <video value>, "h": <orig height>, "r": {"720": "/u/<key>", ...}}
YouTube videos are skipped (YouTube serves its own qualities)."""
import json, os, subprocess, sys, tempfile, secrets, time, urllib.request
SITE = os.environ.get('JC_SITE', 'https://jangidcuts.dpdns.org')
KV_ID = '1ec46e439b2a4b1d8d9ddb69ade7eed6'
STD = [2160, 1440, 1080, 720, 480, 360]
BITRATE = {2160: 12000, 1440: 6000, 1080: 3000, 720: 1500, 480: 700, 360: 400}  # kbit/s ceilings
WR = os.environ.get('WRANGLER', 'npx wrangler').split()

def sh(args, **kw):
    r = subprocess.run(args, capture_output=True, text=True, timeout=kw.get('timeout', 300))
    if r.returncode: raise RuntimeError((r.stdout + r.stderr)[-1500:])
    return r.stdout

def d1(sql):
    out = sh(WR + ['d1', 'execute', 'jangidcuts-db', '--remote', '--json', '--command', sql], timeout=120)
    return json.loads(out[out.index('['):])[0]['results']

def q(s): return "'" + str(s).replace("'", "''") + "'"

def probe(path):
    o = json.loads(sh(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,bit_rate', '-show_entries', 'format=bit_rate', '-of', 'json', path]))
    st = o['streams'][0]; br = int(st.get('bit_rate') or o.get('format', {}).get('bit_rate') or 0)
    return int(st['width']), int(st['height']), br

def one(kind, row):
    vid = row['video'] or row.get('url') or ''
    if not vid or 'youtu' in vid: print(kind, row['id'], 'skip (no file / YouTube)'); return
    sid = ('p' if kind == 'products' else '') + str(row['id'])
    tmp = tempfile.mkdtemp(); src = os.path.join(tmp, 'orig.mp4')
    req = urllib.request.Request(f'{SITE}/v/{sid}', headers={'User-Agent': 'Mozilla/5.0 (JC renditions tool)'})
    with urllib.request.urlopen(req, timeout=600) as r, open(src, 'wb') as f:
        while True:
            b = r.read(1 << 20)
            if not b: break
            f.write(b)
    w, h, br = probe(src); short = min(w, h); vert = h > w
    orig = min(STD + [4320], key=lambda s: abs(s - short))
    rend = {}
    for t in [s for s in STD if s < orig - 20]:
        kb = BITRATE[t]
        if br: kb = min(kb, max(150, int(br / 1000 * (t / short) ** 2 * 1.15)))
        out = os.path.join(tmp, f'{t}.mp4')
        scale = f'scale={t}:-2' if vert else f'scale=-2:{t}'
        sh(['ffmpeg', '-y', '-v', 'error', '-i', src, '-vf', scale, '-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
            '-b:v', f'{kb}k', '-maxrate', f'{kb}k', '-bufsize', f'{kb*2}k', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', out], timeout=1800)
        size = os.path.getsize(out)
        if size > 25 * 1024 * 1024: print(' ', t, 'too big for KV, skipped'); continue
        folder = 'products' if kind == 'products' else 'portfolio'
        d = time.gmtime(); key = f'{folder}/{d.tm_year}{d.tm_mon:02d}/{secrets.token_hex(6)}-{sid}-{t}p.mp4'
        sh(WR + ['kv', 'key', 'put', key, '--path', out, '--namespace-id', KV_ID, '--remote', '--metadata', json.dumps({'type': 'video/mp4', 'size': size})], timeout=600)
        d1(f"INSERT INTO media (key, name, type, size, store, folder, created) VALUES ({q(key)}, {q(sid + '-' + str(t) + 'p.mp4')}, 'video/mp4', {size}, 'kv', {q(folder)}, {int(time.time()*1000)})")
        rend[str(t)] = '/u/' + key; print(' ', sid, f'{t}p', size, 'bytes')
    vq = json.dumps({'src': vid, 'h': orig, 'r': rend})
    d1(f"UPDATE {kind} SET video_q = {q(vq)} WHERE id = {int(row['id'])}")
    print(kind, row['id'], 'original', f'{orig}p', '->', sorted(map(int, rend), reverse=True))

if __name__ == '__main__':
    arg = (sys.argv[1:] or ['all'])[0]
    if arg in ('all',) or arg.startswith('p'):
        for r in d1("SELECT id, video FROM products WHERE length(video) > 0" + (f" AND id = {int(arg[1:])}" if arg.startswith('p') else '')): one('products', r)
    if arg == 'all' or arg.isdigit():
        for r in d1("SELECT id, video, url FROM portfolio WHERE kind = 'video' AND (length(video) > 0 OR length(url) > 0)" + (f" AND id = {int(arg)}" if arg.isdigit() else '')): one('portfolio', r)
