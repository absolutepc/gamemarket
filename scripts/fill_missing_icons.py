#!/usr/bin/env python3
"""Create missing assortment PNGs quickly (Steam cover → iTunes → letter tile)."""

from __future__ import annotations

import hashlib
import io
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "frontend/public/assortment"
ASSORTMENT_JS = ROOT / "frontend/src/data/assortment.js"
STEAM_MAP = ROOT / "scripts/steam_appids.json"
SIZE = 256  # lighter assets for large catalog
UA = "LootzAssortmentBot/1.0 (+https://lootz.ru)"

COLORS = [
    "#2B71F3", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
    "#06B6D4", "#EC4899", "#84CC16", "#F97316", "#6366F1",
    "#14B8A6", "#A855F7", "#22C55E", "#E11D48", "#0EA5E9",
]


def http_get(url: str, timeout: int = 20) -> bytes | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except Exception:
        return None


def http_json(url: str, timeout: int = 20):
    raw = http_get(url, timeout=timeout)
    if not raw:
        return None
    try:
        return json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError:
        return None


def parse_items() -> list[dict]:
    text = ASSORTMENT_JS.read_text(encoding="utf-8")
    items = []
    seen = set()
    for m in re.finditer(
        r"\{\s*name:\s*'((?:\\'|[^'])*)',\s*search:\s*'((?:\\'|[^'])*)',\s*icon:\s*'([^']+)',\s*kind:\s*'(\w+)'\s*\}",
        text,
    ):
        name = m.group(1).replace("\\'", "'")
        if name in seen:
            continue
        seen.add(name)
        items.append(
            {
                "name": name,
                "search": m.group(2).replace("\\'", "'"),
                "icon": m.group(3),
                "kind": m.group(4),
                "slug": Path(m.group(3)).stem,
            }
        )
    return items


def to_square(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return im.crop((left, top, left + side, top + side)).resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def save_png(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rgb = Image.new("RGB", im.size, "#111827")
    rgb.paste(im, mask=im.split()[-1] if im.mode == "RGBA" else None)
    rgb.save(path, format="PNG", optimize=True)


def letter_tile(name: str) -> Image.Image:
    digest = hashlib.md5(name.encode("utf-8")).hexdigest()
    color = COLORS[int(digest[:2], 16) % len(COLORS)]
    canvas = Image.new("RGBA", (SIZE, SIZE), color)
    draw = ImageDraw.Draw(canvas)
    letter = (name.strip()[:1] or "?").upper()
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 120)
    except OSError:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), letter, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((SIZE - tw) / 2, (SIZE - th) / 2 - 8), letter, fill="white", font=font)
    return canvas


def steam_cover(app_id: int) -> Image.Image | None:
    for path in (
        f"https://cdn.cloudflare.steamstatic.com/steam/apps/{app_id}/library_600x900.jpg",
        f"https://cdn.cloudflare.steamstatic.com/steam/apps/{app_id}/header.jpg",
        f"https://shared.steamstatic.com/store_item_assets/steam/apps/{app_id}/library_600x900.jpg",
    ):
        raw = http_get(path, timeout=15)
        if not raw:
            continue
        try:
            return to_square(Image.open(io.BytesIO(raw)))
        except Exception:
            continue
    return None


def steam_search_appid(term: str) -> int | None:
    qs = urllib.parse.urlencode({"term": term, "cc": "us", "l": "english"})
    data = http_json(f"https://store.steampowered.com/api/storesearch/?{qs}")
    if not data:
        return None
    items = data.get("items") or []
    if not items:
        return None
    return items[0].get("id")


def itunes_art(term: str) -> Image.Image | None:
    qs = urllib.parse.urlencode({"term": term, "entity": "software", "country": "us", "limit": 3})
    data = http_json(f"https://itunes.apple.com/search?{qs}")
    if not data:
        return None
    results = data.get("results") or []
    if not results:
        return None
    url = results[0].get("artworkUrl512") or results[0].get("artworkUrl100")
    if not url:
        return None
    url = url.replace("100x100bb", "512x512bb")
    raw = http_get(url)
    if not raw:
        return None
    try:
        return to_square(Image.open(io.BytesIO(raw)))
    except Exception:
        return None


def main():
    items = parse_items()
    steam_ids = {}
    if STEAM_MAP.exists():
        steam_ids = json.loads(STEAM_MAP.read_text(encoding="utf-8"))

    missing = []
    for item in items:
        path = OUT_DIR / f"{item['slug']}.png"
        if path.exists() and path.stat().st_size > 800:
            continue
        missing.append(item)

    print(f"items={len(items)} missing={len(missing)}")
    done = 0
    for item in missing:
        out = OUT_DIR / f"{item['slug']}.png"
        name = item["name"]
        kind = item["kind"]
        im = None

        # Known steam id
        appid = steam_ids.get(name) or steam_ids.get(item["search"])
        if not appid and kind == "pc":
            appid = steam_search_appid(item["search"] or name)
            if appid:
                steam_ids[name] = appid
                time.sleep(0.05)

        if appid:
            im = steam_cover(int(appid))

        if im is None and kind in {"mobile", "app"}:
            im = itunes_art(item["search"] or name)
            time.sleep(0.08)

        if im is None:
            im = letter_tile(name)
            tag = "letter"
        else:
            tag = "art"

        save_png(im, out)
        done += 1
        if done % 40 == 0 or done == len(missing):
            print(f"  {done}/{len(missing)} last={name} ({tag})")

    STEAM_MAP.write_text(json.dumps(steam_ids, ensure_ascii=False, indent=2), encoding="utf-8")
    print("done icons; steam map", len(steam_ids))


if __name__ == "__main__":
    main()
