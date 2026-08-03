#!/usr/bin/env python3
"""
Replace letter-tile assortment PNGs with real Steam/iTunes artwork.

Letter tiles were written by fill_missing_icons.py when fetches failed.
Many are >800 bytes so that script skips them — this one force-overwrites.
"""

from __future__ import annotations

import hashlib
import io
import json
import re
import time
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "frontend/public/assortment"
ASSORTMENT_JS = ROOT / "frontend/src/data/assortment.js"
STEAM_MAP = ROOT / "scripts/steam_appids.json"
SIZE = 256
UA = "LootzAssortmentBot/1.0 (+https://lootz.ru)"

# Curated Steam AppIDs for catalog names that currently show letter tiles
CURATED_APPIDS: dict[str, int] = {
    "FIFA 23": 1811260,
    "EA FC 24": 2195250,
    "EA FC 25": 2669320,
    "EA SPORTS FC™ 26": 3405690,
    "NBA 2K24": 2338770,
    "NBA 2K25": 2338770,  # fallback; overridden if mapped
    "NBA 2K26": 3472040,
    "Black Ops 6": 2933080,
    "Modern Warfare 3": 1985810,
    "Call of Duty®": 1938090,
    "Diablo III": 234140,
    "Grounded": 962130,
    "God of War": 1593500,
    "God of War Ragnarok": 2322010,
    "Horizon Forbidden West": 2420110,
    "The Last of Us Part I": 1888930,
    "The Last of Us Part II": 2531310,
    "Death Stranding": 1850570,
    "Death Stranding 2": 1850570,  # closest available art if DS2 not on Steam
    "Control": 870780,
    "GTA 4": 12210,
    "GTA Trilogy": 1547000,
    "Grand Theft Auto: The Trilogy": 1547000,
    "Yakuza Like a Dragon": 1235140,
    "Final Fantasy XIV": 39210,
    "FINAL FANTASY XIV Online": 39210,
    "Final Fantasy XVI": 2515020,
    "Final Fantasy VII Remake": 1462040,
    "Dragon Quest XI": 742120,
    "Throne and Liberty": 2426190,
    "Oblivion Remastered": 2623190,
    "Kerbal Space Program 2": 954850,
    "Jurassic World Evolution 2": 1244460,
    "Rocket League Sideswipe": None,  # mobile — iTunes
    "Football Manager 26": 3551340,
    "Forza Horizon 5": 1551360,
    "Forza Horizon 6": 2483190,
    "Forza Motorsport": 2440510,
    "Halo: Campaign Evolved": 2777570,
    "Assassin's Creed Black Flag": 242050,
    "Rec Room": 471710,
    "Squad": 393380,
    "Multiversus": 1818750,
    "Escape from Tarkov Arena": 3932890,
    "Cycle Frontier": 1607410,
    "Dungeonborne": 2199420,
    "Wo Long": 1443380,
    "PEAK": 3527290,
    "R.E.P.O.": 3241660,
    "Legends of Runeterra": 1276790,
    "Warhammer 40k": 1142710,
    "Total War: WARHAMMER III": 1142710,
    "Smash Bros": None,
    "Rainmeter": None,
    "FiveM": None,
    "TBH: Task Bar Hero": 3678970,
    "MECCHA CHAMELEON": 4704690,
    "Shift At Midnight": 3722330,
    "Battlefield™ 6": 2807960,
    "Ahrefs": None,
    "eSIM": None,
    "Дизайн": None,
    "Новое": None,
}

COLORS = [
    "#2B71F3", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
    "#06B6D4", "#EC4899", "#84CC16", "#F97316", "#6366F1",
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


def is_letter_tile(path: Path) -> bool:
    if not path.exists():
        return True
    try:
        if path.stat().st_size >= 8000:
            return False
        im = Image.open(path).convert("RGB")
        w, h = im.size
        if w > 512 or h > 512:
            return False
        px = list(im.getdata())
        sample = px[:: max(1, len(px) // 200)]
        top = Counter(sample).most_common(1)[0][1] / len(sample)
        return top > 0.82
    except Exception:
        return False


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
        f"https://cdn.cloudflare.steamstatic.com/steam/apps/{app_id}/library_capsule.jpg",
        f"https://cdn.cloudflare.steamstatic.com/steam/apps/{app_id}/header.jpg",
        f"https://shared.steamstatic.com/store_item_assets/steam/apps/{app_id}/library_600x900.jpg",
    ):
        raw = http_get(path, timeout=15)
        if not raw or len(raw) < 3000:
            continue
        try:
            return to_square(Image.open(io.BytesIO(raw)))
        except Exception:
            continue

    # Newer titles often lack classic CDN paths — use store appdetails media
    data = http_json(
        f"https://store.steampowered.com/api/appdetails?appids={app_id}&l=english",
        timeout=20,
    )
    entry = (data or {}).get(str(app_id)) or {}
    if entry.get("success"):
        info = entry.get("data") or {}
        for key in ("header_image", "capsule_image", "capsule_imagev5"):
            url = info.get(key)
            if not url:
                continue
            raw = http_get(url, timeout=15)
            if not raw or len(raw) < 3000:
                continue
            try:
                return to_square(Image.open(io.BytesIO(raw)))
            except Exception:
                continue
    return None


def normalize(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[™®©]", "", s)
    s = re.sub(r"[^a-z0-9а-яё]+", " ", s, flags=re.I)
    return re.sub(r"\s+", " ", s).strip()


def steam_search_appid(term: str) -> int | None:
    qs = urllib.parse.urlencode({"term": term, "cc": "us", "l": "english"})
    data = http_json(f"https://store.steampowered.com/api/storesearch/?{qs}")
    if not data:
        return None
    items = data.get("items") or []
    if not items:
        return None
    want = normalize(term)
    # Prefer exact / startswith match over first random hit
    for it in items:
        name = normalize(str(it.get("name") or ""))
        if name == want or name.startswith(want) or want.startswith(name):
            return it.get("id")
    # token overlap
    want_tokens = set(want.split())
    best = None
    best_score = 0
    for it in items[:8]:
        name = normalize(str(it.get("name") or ""))
        tokens = set(name.split())
        score = len(want_tokens & tokens)
        if score > best_score:
            best_score = score
            best = it.get("id")
    if best_score >= max(2, len(want_tokens) // 2):
        return best
    return items[0].get("id")


def itunes_art(term: str, entity: str = "software") -> Image.Image | None:
    qs = urllib.parse.urlencode({"term": term, "entity": entity, "country": "us", "limit": 5})
    data = http_json(f"https://itunes.apple.com/search?{qs}")
    if not data:
        return None
    results = data.get("results") or []
    want = normalize(term)
    picked = None
    for r in results:
        name = normalize(str(r.get("trackName") or r.get("collectionName") or ""))
        if want in name or name in want:
            picked = r
            break
    if not picked and results:
        picked = results[0]
    if not picked:
        return None
    url = picked.get("artworkUrl512") or picked.get("artworkUrl100")
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


def resolve_appid(item: dict, steam_ids: dict) -> int | None:
    name = item["name"]
    search = item["search"]
    for key in (name, search):
        if key in CURATED_APPIDS:
            val = CURATED_APPIDS[key]
            # Explicit None = no Steam id; fall through to search/iTunes
            if val is not None:
                return int(val)
            return None
    for key in (name, search):
        if key in steam_ids and steam_ids[key]:
            try:
                return int(steam_ids[key])
            except (TypeError, ValueError):
                continue
    return None


def main():
    items = parse_items()
    steam_ids = {}
    if STEAM_MAP.exists():
        steam_ids = json.loads(STEAM_MAP.read_text(encoding="utf-8"))

    targets = []
    for item in items:
        path = OUT_DIR / f"{item['slug']}.png"
        if is_letter_tile(path):
            targets.append(item)

    print(f"letter_tiles={len(targets)} / assortment={len(items)}")
    ok = fail = 0
    for i, item in enumerate(targets, 1):
        out = OUT_DIR / f"{item['slug']}.png"
        name = item["name"]
        kind = item["kind"]
        im = None
        tag = "letter"

        appid = resolve_appid(item, steam_ids)
        if appid is None and kind in {"pc", "mobile"}:
            appid = steam_search_appid(item["search"] or name)
            if appid:
                steam_ids[name] = appid
                time.sleep(0.12)

        if appid:
            im = steam_cover(int(appid))
            if im:
                tag = f"steam:{appid}"

        if im is None:
            # iTunes for apps/mobile and as PC fallback
            entities = ["software"] if kind != "pc" else ["software"]
            for ent in entities:
                im = itunes_art(item["search"] or name, entity=ent)
                if im:
                    tag = "itunes"
                    break
                time.sleep(0.08)

        if im is None and kind == "pc":
            # Second Steam search with shortened name
            short = re.sub(r"[:\-–].*$", "", item["search"] or name).strip()
            if short and short != (item["search"] or name):
                aid = steam_search_appid(short)
                time.sleep(0.12)
                if aid:
                    im = steam_cover(int(aid))
                    if im:
                        tag = f"steam-short:{aid}"
                        steam_ids[name] = aid

        if im is None:
            im = letter_tile(name)
            fail += 1
        else:
            ok += 1

        save_png(im, out)
        print(f"  [{i}/{len(targets)}] {name} → {tag}")

    STEAM_MAP.write_text(json.dumps(steam_ids, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"done ok={ok} still_letter={fail}")


if __name__ == "__main__":
    main()
