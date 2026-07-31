#!/usr/bin/env python3
"""Download original 512×512 logos for assortment items (iTunes → Steam → Simple Icons)."""

from __future__ import annotations

import io
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image
import cairosvg

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "frontend/public/assortment"
ASSORTMENT_JS = ROOT / "frontend/src/data/assortment.js"
SIZE = 512

UA = "LootzAssortmentBot/1.0 (+https://lootz.ru)"

# Explicit overrides when auto-search is ambiguous / missing
ITUNES_TERM = {
    "Steam": "Steam Mobile",
    "PlayStation": "PS App",
    "App Store": "Apple Store",
    "ChatGPT": "ChatGPT",
    "Xbox": "Xbox",
    "ВКонтакте": "VK: music, video, messenger",
    "Claude": "Claude by Anthropic",
    "Cursor": "Cursor AI",
    "Windows": "Microsoft 365 (Office)",
    "Battle.net": "Battle.net",
    "Nintendo": "Nintendo Switch Online",
    "Faceit": "FACEIT",
    "Google Play": "Google Play Games",
    "YouTube": "YouTube",
    "Adobe": "Adobe Express",
    "FL Studio": "FL Studio Mobile",
    "Likee": "Likee - Short Video Community",
    "EA Play": "EA Sports FC Mobile Soccer",
    "ExitLag": "ExitLag",
    "Epic Games": "Epic Games",
    "Netflix": "Netflix",
    "Ubisoft": "Ubisoft Connect",
    "iTunes": "Apple Music",
    "Wallpaper Engine": "Wallpaper Engine",
    "Дзен": "Дзен",
    "GeForce NOW": "GeForce NOW Cloud Gaming",
    "TeamSpeak": "TeamSpeak 3",
    "Skype": "Skype",
    "Yappy": "Yappy",
    "SoundCloud": "SoundCloud",
    "Trovo": "Trovo",
    "Kick": "Kick Streaming",
    "Snapchat": "Snapchat",
    "Zoom": "ZOOM Cloud Meetings",
    "WhatsApp": "WhatsApp Messenger",
    "Twitch": "Twitch",
    "Microsoft Store": "Microsoft Store",
    "PUBG Mobile": "PUBG MOBILE",
    "Brawl Stars": "Brawl Stars",
    "Clash of Clans": "Clash of Clans",
    "Standoff 2": "Standoff 2",
    "Clash Royale": "Clash Royale",
    "FC Mobile": "EA Sports FC Mobile Soccer",
    "Black Russia": "Black Russia",
    "Mobile Legends": "Mobile Legends: Bang Bang",
    "Free Fire": "Free Fire",
    "CoD Mobile": "Call of Duty: Mobile",
    "Mortal Kombat": "Mortal Kombat",
    "Drag Racing": "Drag Racing",
    "Blockman GO": "Blockman GO",
    "Last Island": "Last Island of Survival",
    "eFootball": "eFootball",
    "Diablo Immortal": "Diablo Immortal",
    "Матрешка RP": "Матрешка RP",
    "Forge of Empires": "Forge of Empires",
    "Oxide": "Oxide",
    "Grand Mobile": "Grand Mobile",
    "Avakin Life": "Avakin Life",
    "RAID": "RAID: Shadow Legends",
    "Bullet Echo": "Bullet Echo",
    "Car Parking": "Car Parking Multiplayer",
    "Car Parking 2": "Car Parking Multiplayer 2",
    "WoT Blitz": "World of Tanks Blitz",
    "My Singing Monsters": "My Singing Monsters",
    "Super Sus": "Super Sus",
    "Rush Royale": "Rush Royale",
    "Rise of Kingdoms": "Rise of Kingdoms",
    "Cookie Run": "Cookie Run: Kingdom",
    "Whiteout Survival": "Whiteout Survival",
    "Township": "Township",
    "MadOut 2": "MadOut2",
    "Last Day on Earth": "Last Day on Earth: Survival",
    "Beatstar": "Beatstar",
    "CarX Street": "CarX Street",
    "Wild Rift": "League of Legends: Wild Rift",
    "ZEPETO": "ZEPETO",
    "Дурак Онлайн": "Дурак Онлайн",
    "The Spike": "The Spike",
    "WildCraft": "WildCraft",
    "Zooba": "Zooba",
    "Crossout Mobile": "Crossout Mobile",
    "Viking Rise": "Viking Rise",
    "Soul Knight": "Soul Knight",
    "Block Strike": "Block Strike",
    "Nulls Brawl": "Null's Brawl",
    "Hay Day": "Hay Day",
    "CATS": "CATS: Crash Arena Turbo Stars",
    "CarX Drift": "CarX Drift Racing 2",
    "Counter Attack": "Counter Attack",
    "Shadow Fight 3": "Shadow Fight 3",
    "Highrise": "Highrise",
    "Pixel Gun 3D": "Pixel Gun 3D",
    "Gacha Club": "Gacha Club",
    "Hill Climb 2": "Hill Climb Racing 2",
    "Royal Match": "Royal Match",
    "PUBG New State": "PUBG: NEW STATE",
    "Roblox": "Roblox",
    "Arena Breakout": "Arena Breakout",
    "Genshin": "Genshin Impact",
    "Honkai Star Rail": "Honkai: Star Rail",
    "Zenless Zone Zero": "Zenless Zone Zero",
    "Identity V": "Identity V",
    "Blood Strike": "Blood Strike",
    "Delta Force": "Delta Force",
    "Valorant": "VALORANT",
    "Fortnite": "Fortnite",
    "Minecraft": "Minecraft",
    "TikTok": "TikTok",
    "Telegram": "Telegram",
    "Discord": "Discord",
    "Spotify": "Spotify",
}

STEAM_APP_ID = {
    "CS2": 730,
    "Dota 2": 570,
    "GTA 5": 271590,
    "Warface": 291480,
    "Wallpaper Engine": 431960,
    "PUBG Mobile": 578080,  # fallback cover style if itunes fails; real PUBG
}

# Brand-colored Simple Icons tiles (when iTunes is wrong/missing)
SIMPLE_ICON = {
    "Steam": ("steam", "#171a21"),
    "Telegram": ("telegram", "#26A5E4"),
    "Discord": ("discord", "#5865F2"),
    "Xbox": ("xbox", "#107C10"),
    "Spotify": ("spotify", "#1DB954"),
    "ВКонтакте": ("vk", "#0077FF"),
    "YouTube": ("youtube", "#FF0000"),
    "Adobe": ("adobe", "#FF0000"),
    "Netflix": ("netflix", "#E50914"),
    "Twitch": ("twitch", "#9146FF"),
    "WhatsApp": ("whatsapp", "#25D366"),
    "Snapchat": ("snapchat", "#FFFC00"),
    "Zoom": ("zoom", "#0B5CFF"),
    "Skype": ("skype", "#00AFF0"),
    "SoundCloud": ("soundcloud", "#FF3300"),
    "Epic Games": ("epicgames", "#121212"),
    "Nintendo": ("nintendo", "#E60012"),
    "Battle.net": ("battledotnet", "#148EFF"),
    "Windows": ("windows", "#0078D4"),
    "Google Play": ("googleplay", "#414141"),
    "Apple": ("apple", "#000000"),
    "App Store": ("appstore", "#0D96F6"),
    "PlayStation": ("playstation", "#003791"),
    "TikTok": ("tiktok", "#000000"),
    "Kick": ("kick", "#53FC18"),
    "Ubisoft": ("ubisoft", "#000000"),
    "EA Play": ("ea", "#000000"),
    "Faceit": ("faceit", "#FF5500"),
    "GeForce NOW": ("nvidia", "#76B900"),
    "Microsoft Store": ("microsoft", "#5E5E5E"),
    "iTunes": ("itunes", "#FB5BC5"),
    "Trovo": ("trovo", "#19D66B"),
    "CS2": ("counterstrike", "#DE9B35"),
    "Dota 2": ("dota2", "#BF2E1A"),
}

CATEGORY_COLORS = {
    "Нейросети": "#8B5CF6",
    "Дизайн": "#EC4899",
    "Хостинг": "#0EA5E9",
    "Другие приложения": "#64748B",
    "Cursor": "#F97316",
}


def http_get(url: str, timeout: int = 25) -> bytes | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except Exception as exc:  # noqa: BLE001
        print(f"  GET fail {url}: {exc}")
        return None


def parse_assortment() -> list[dict]:
    text = ASSORTMENT_JS.read_text(encoding="utf-8")
    items = []
    for m in re.finditer(
        r"\{\s*name:\s*'((?:\\'|[^'])*)',\s*search:\s*'((?:\\'|[^'])*)',\s*icon:\s*'([^']+)'\s*\}",
        text,
    ):
        name = m.group(1).replace("\\'", "'")
        search = m.group(2).replace("\\'", "'")
        icon = m.group(3)
        slug = Path(icon).stem
        items.append({"name": name, "search": search, "icon": icon, "slug": slug})
    return items


def itunes_artwork(term: str, country: str = "ru") -> str | None:
    qs = urllib.parse.urlencode(
        {"term": term, "entity": "software", "country": country, "limit": 5}
    )
    raw = http_get(f"https://itunes.apple.com/search?{qs}")
    if not raw:
        return None
    try:
        data = json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError:
        return None
    results = data.get("results") or []
    if not results:
        # fallback US store
        if country != "us":
            return itunes_artwork(term, "us")
        return None
    term_l = term.lower()
    # Prefer closest name match
    best = results[0]
    for r in results:
        name = (r.get("trackName") or "").lower()
        if term_l in name or name in term_l:
            best = r
            break
    url = best.get("artworkUrl512") or best.get("artworkUrl100")
    if url:
        return url.replace("100x100bb", "512x512bb")
    return None


def download_image(url: str) -> Image.Image | None:
    raw = http_get(url)
    if not raw:
        return None
    try:
        im = Image.open(io.BytesIO(raw)).convert("RGBA")
        return im
    except Exception as exc:  # noqa: BLE001
        print(f"  decode fail: {exc}")
        return None


def to_square_png(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    im = im.crop((left, top, left + side, top + side))
    return im.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def steam_cover(app_id: int) -> Image.Image | None:
    for path in (
        f"https://shared.steamstatic.com/store_item_assets/steam/apps/{app_id}/library_600x900.jpg",
        f"https://cdn.cloudflare.steamstatic.com/steam/apps/{app_id}/library_600x900.jpg",
        f"https://cdn.cloudflare.steamstatic.com/steam/apps/{app_id}/header.jpg",
    ):
        im = download_image(path)
        if im:
            return to_square_png(im)
    return None


def simple_icon_tile(slug: str, bg: str) -> Image.Image | None:
    svg = http_get(f"https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/{slug}.svg")
    if not svg:
        return None
    # Recolor path to white for dark/colored tiles (except very light bg)
    svg_text = svg.decode("utf-8")
    fill = "#111111" if bg.upper() in {"#FFFC00", "#FFFFFF", "#EEE", "#EEEEEE"} else "#FFFFFF"
    if "fill=" not in svg_text:
        svg_text = svg_text.replace("<svg", f'<svg fill="{fill}"', 1)
    else:
        svg_text = re.sub(r'fill="[^"]*"', f'fill="{fill}"', svg_text, count=1)
    try:
        png = cairosvg.svg2png(bytestring=svg_text.encode("utf-8"), output_width=320, output_height=320)
        logo = Image.open(io.BytesIO(png)).convert("RGBA")
    except Exception as exc:  # noqa: BLE001
        print(f"  simple-icons raster fail {slug}: {exc}")
        return None
    canvas = Image.new("RGBA", (SIZE, SIZE), bg)
    # center logo
    lx, ly = logo.size
    canvas.paste(logo, ((SIZE - lx) // 2, (SIZE - ly) // 2), logo)
    return canvas


def letter_tile(name: str, color: str) -> Image.Image:
    from PIL import ImageDraw, ImageFont

    canvas = Image.new("RGBA", (SIZE, SIZE), color)
    draw = ImageDraw.Draw(canvas)
    letter = (name.strip()[:1] or "?").upper()
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 220)
    except OSError:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), letter, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((SIZE - tw) / 2, (SIZE - th) / 2 - 20), letter, fill="white", font=font)
    return canvas


def save_png(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rgb = Image.new("RGB", im.size, "#111827")
    rgb.paste(im, mask=im.split()[-1] if im.mode == "RGBA" else None)
    rgb.save(path, format="PNG", optimize=True)


def is_placeholder_svg(path: Path) -> bool:
    if not path.exists():
        return True
    if path.suffix.lower() == ".svg":
        text = path.read_text(encoding="utf-8", errors="ignore")
        return "linearGradient" in text and "<text" in text
    try:
        im = Image.open(path)
        return min(im.size) < 64
    except Exception:
        return True


def fetch_one(item: dict) -> Path:
    name = item["name"]
    slug = item["slug"]
    out = OUT_DIR / f"{slug}.png"

    # Keep existing high-quality raster icons
    existing_candidates = [OUT_DIR / f"{slug}.png", Path(str(OUT_DIR / item["icon"].lstrip("/").replace("assortment/", "assortment/")))]
    for cand in existing_candidates:
        # normalize
        pass
    existing = OUT_DIR / Path(item["icon"]).name
    if existing.exists() and existing.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}:
        try:
            im = Image.open(existing)
            if min(im.size) >= 256 and existing.suffix.lower() != ".svg":
                # Re-save as proper PNG square
                save_png(to_square_png(im.convert("RGBA")), out)
                print(f"✓ keep {name} → {out.name}")
                return out
        except Exception:
            pass

    # Category tiles
    if name in CATEGORY_COLORS:
        save_png(letter_tile(name, CATEGORY_COLORS[name]), out)
        print(f"✓ category {name}")
        return out

    # 1) iTunes artwork
    term = ITUNES_TERM.get(name, name)
    art = itunes_artwork(term)
    if art:
        im = download_image(art)
        if im:
            save_png(to_square_png(im), out)
            print(f"✓ itunes {name}")
            time.sleep(0.15)
            return out

    # 2) Steam
    if name in STEAM_APP_ID:
        im = steam_cover(STEAM_APP_ID[name])
        if im:
            save_png(im, out)
            print(f"✓ steam {name}")
            return out

    # 3) Simple Icons brand tile
    if name in SIMPLE_ICON:
        si_slug, bg = SIMPLE_ICON[name]
        im = simple_icon_tile(si_slug, bg)
        if im:
            save_png(im, out)
            print(f"✓ simple-icons {name}")
            return out

    # 4) Letter fallback
    save_png(letter_tile(name, "#1F2937"), out)
    print(f"⚠ fallback letter {name}")
    return out


def rewrite_assortment_icons(items: list[dict]) -> None:
    text = ASSORTMENT_JS.read_text(encoding="utf-8")

    def repl(m: re.Match) -> str:
        name = m.group(1).replace("\\'", "'")
        search = m.group(2)
        icon = m.group(3)
        slug = Path(icon).stem
        new_icon = f"/assortment/{slug}.png"
        return f"{{ name: '{m.group(1)}', search: '{search}', icon: '{new_icon}' }}"

    new_text = re.sub(
        r"\{\s*name:\s*'((?:\\'|[^'])*)',\s*search:\s*'((?:\\'|[^'])*)',\s*icon:\s*'([^']+)'\s*\}",
        repl,
        text,
    )
    ASSORTMENT_JS.write_text(new_text, encoding="utf-8")
    print(f"Updated {ASSORTMENT_JS}")


def main() -> None:
    items = parse_assortment()
    print(f"Found {len(items)} assortment items")
    for item in items:
        fetch_one(item)
    rewrite_assortment_icons(items)


if __name__ == "__main__":
    main()
