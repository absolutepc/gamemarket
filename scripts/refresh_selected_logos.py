#!/usr/bin/env python3
"""Force-refresh selected assortment logos with better brand artwork."""

from __future__ import annotations

import io
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend/public/assortment"
SIZE = 512
UA = "LootzAssortmentBot/1.0 (+https://lootz.ru)"

# name -> destination stem (matches assortment.js icon path)
TARGETS: list[tuple[str, str]] = [
    ("Google Play", "google-play"),
    ("Adobe", "adobe"),
    ("Windows", "windows"),
    ("Rockstar Games", "rockstar-games"),
    ("ВКонтакте", "vk"),
    ("Нейросети", "ai"),
    ("eSIM", "esim"),
    ("EA Play", "ea-play"),
    ("Likee", "likee"),
    ("Pax Historia", "pax-historia"),
    ("Razer Gold", "razer-gold"),
    ("Microsoft Store", "microsoft-store"),
    ("Netflix", "netflix"),
    ("Ubisoft", "ubisoft"),
    ("Higgsfield", "higgsfield"),
    ("z.ai", "z-ai"),
    ("Midjourney", "midjourney"),
    ("Дизайн", "design"),
    ("iMazing", "imazing"),
    ("Wallpaper Engine", "wallpaper-engine"),
    ("PICO", "pico"),
    ("Ableton", "ableton"),
    ("Recraft", "recraft"),
    ("Splice", "splice"),
    ("Manus", "manus"),
    ("Soundpad", "soundpad"),
    ("Lovable", "lovable"),
    ("OBS Studio", "obs-studio"),
    ("Envato Elements", "envato-elements"),
    ("Хостинг", "hosting"),
    ("Дзен", "dzen"),
    ("Leonardo AI", "leonardo-ai"),
    ("Magnific", "magnific"),
    ("GeForce NOW", "geforce-now"),
    ("Yappy", "yappy"),
    ("Trovo", "trovo"),
    ("Crosshair X", "crosshair-x"),
    ("Windsurf", "windsurf"),
    ("OpenArt", "openart"),
    ("Chutes AI", "chutes-ai"),
    ("Mimo", "mimo"),
    ("Tango Live", "tango-live"),
    ("n8n", "n8n"),
    ("Ahrefs", "ahrefs"),
]

SIMPLE = {
    "Google Play": ("googleplay", "#FFFFFF", "#414141"),  # dark logo on white? use colored bg
    "Adobe": ("adobe", "#FF0000", None),
    "Windows": ("windows11", "#0078D4", None),
    "ВКонтакте": ("vk", "#0077FF", None),
    "Netflix": ("netflix", "#E50914", None),
    "Ubisoft": ("ubisoft", "#000000", None),
    "Microsoft Store": ("microsoft", "#00A4EF", None),
    "Ableton": ("abletonlive", "#000000", None),
    "OBS Studio": ("obsstudio", "#302E31", None),
    "n8n": ("n8n", "#EA4B71", None),
    "Ahrefs": ("ahrefs", "#FF8C00", None),
    "Splice": ("splice", "#000000", None),
    "EA Play": ("ea", "#000000", None),
    "GeForce NOW": ("nvidia", "#76B900", None),
    "Trovo": ("trovo", "#1D1D1D", None),
    "Midjourney": ("midjourney", "#0B0B0B", None),
    "Rockstar Games": ("rockstargames", "#FCAF17", "#111111"),  # dark logo on gold? try yellow bg dark logo
}

# Prefer newer simple-icons package
SIMPLE_CDN = [
    "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/{slug}.svg",
    "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/{slug}.svg",
]

ITUNES = {
    "Google Play": "Google Play Games",
    "Likee": "Likee - Short Video Community",
    "Yappy": "Yappy",
    "Tango Live": "Tango - Live Stream, Video Chat",
    "PICO": "PICO",
    "iMazing": "iMazing",
    "EA Play": "EA App",
    "Microsoft Store": "Microsoft Store",
    "Netflix": "Netflix",
    "Дзен": "Дзен",
    "ВКонтакте": "VK: music, video, messenger",
    "Razer Gold": "Razer Gold & Silver",
    "GeForce NOW": "GeForce NOW Cloud Gaming",
    "Mimo": "Mimo: Learn Coding/Programming",
    "Wallpaper Engine": "Wallpaper Engine",
    "Soundpad": "Soundpad",
    "Crosshair X": "Crosshair X",
    "Adobe": "Adobe Express: AI Photo Editor",
    "Windows": "Microsoft 365 (Office)",
    "Ubisoft": "Ubisoft Connect",
}

CLEARBIT = {
    "Adobe": "adobe.com",
    "Rockstar Games": "rockstargames.com",
    "Netflix": "netflix.com",
    "Ubisoft": "ubisoft.com",
    "Higgsfield": "higgsfield.ai",
    "z.ai": "z.ai",
    "Midjourney": "midjourney.com",
    "iMazing": "imazing.com",
    "Ableton": "ableton.com",
    "Recraft": "recraft.ai",
    "Splice": "splice.com",
    "Manus": "manus.im",
    "Lovable": "lovable.dev",
    "Envato Elements": "elements.envato.com",
    "Leonardo AI": "leonardo.ai",
    "Magnific": "magnific.ai",
    "Windsurf": "windsurf.com",
    "OpenArt": "openart.ai",
    "Chutes AI": "chutes.ai",
    "n8n": "n8n.io",
    "Ahrefs": "ahrefs.com",
    "Pax Historia": "paxhistoria.co",
    "Razer Gold": "gold.razer.com",
    "PICO": "picoxr.com",
    "Google Play": "play.google.com",
    "Microsoft Store": "microsoft.com",
    "EA Play": "ea.com",
    "GeForce NOW": "nvidia.com",
    "Trovo": "trovo.live",
    "Дзен": "dzen.ru",
    "ВКонтакте": "vk.com",
    "Likee": "likee.video",
    "OBS Studio": "obsproject.com",
    "Yappy": "yappy.media",
    "Tango Live": "tango.me",
    "Mimo": "getmimo.com",
    "Crosshair X": "crosshairx.com",
    "Soundpad": "leppsoft.com",
}

# Direct high-quality image URLs (when known / stable CDNs)
DIRECT = {
    "Wallpaper Engine": [
        "https://cdn.cloudflare.steamstatic.com/steam/apps/431960/library_600x900.jpg",
        "https://cdn.cloudflare.steamstatic.com/steam/apps/431960/header.jpg",
    ],
    "Rockstar Games": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Rockstar_Games_Logo.svg/512px-Rockstar_Games_Logo.svg.png",
    ],
    "Google Play": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/512px-Google_Play_Store_badge_EN.svg.png",
    ],
}

# Custom SVG tiles for categories / brands without good auto sources
CUSTOM_SVG = {
    "Нейросети": (
        "#7C3AED",
        """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
          <g fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round">
            <circle cx="64" cy="36" r="14"/>
            <circle cx="36" cy="84" r="14"/>
            <circle cx="92" cy="84" r="14"/>
            <path d="M64 50 L36 70 M64 50 L92 70 M36 84 L92 84"/>
          </g>
        </svg>""",
    ),
    "Дизайн": (
        "#EC4899",
        """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
          <g fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round">
            <path d="M28 92 L72 28 L100 56 L56 120 Z"/>
            <circle cx="84" cy="40" r="8" fill="#fff" stroke="none"/>
          </g>
        </svg>""",
    ),
    "Хостинг": (
        "#0EA5E9",
        """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
          <g fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
            <rect x="24" y="28" width="80" height="24" rx="6"/>
            <rect x="24" y="60" width="80" height="24" rx="6"/>
            <rect x="24" y="92" width="80" height="16" rx="6"/>
            <circle cx="40" cy="40" r="4" fill="#fff" stroke="none"/>
            <circle cx="40" cy="72" r="4" fill="#fff" stroke="none"/>
          </g>
        </svg>""",
    ),
    "eSIM": (
        "#06B6D4",
        """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
          <g fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round">
            <path d="M40 24 h40 l16 16 v64 a8 8 0 0 1 -8 8 H40 a8 8 0 0 1 -8 -8 V32 a8 8 0 0 1 8 -8 z"/>
            <rect x="52" y="48" width="24" height="32" rx="4"/>
            <path d="M56 40 h16" stroke-linecap="round"/>
          </g>
        </svg>""",
    ),
}


def http_get(url: str, timeout: int = 30) -> bytes | None:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except Exception as exc:  # noqa: BLE001
        print(f"  fail {url[:90]}: {exc}")
        return None


def to_square(im: Image.Image, size: int = SIZE) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return im.crop((left, top, left + side, top + side)).resize((size, size), Image.Resampling.LANCZOS)


def save(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rgb = Image.new("RGB", im.size, "#111827")
    if im.mode == "RGBA":
        rgb.paste(im, mask=im.split()[-1])
    else:
        rgb.paste(im.convert("RGB"))
    # also write 256 display size for lighter pages
    if rgb.size[0] != 256:
        rgb = rgb.resize((256, 256), Image.Resampling.LANCZOS)
    rgb.save(path, format="PNG", optimize=True)


def simple_tile(slug: str, bg: str, logo_fill: str | None = None) -> Image.Image | None:
    svg = None
    for tmpl in SIMPLE_CDN:
        svg = http_get(tmpl.format(slug=slug))
        if svg:
            break
    if not svg:
        return None
    text = svg.decode("utf-8")
    light_bgs = {"#FFFFFF", "#FFFC00", "#FCAF17", "#FFD02F", "#FFD21E"}
    fill = logo_fill or ("#111111" if bg.upper() in light_bgs else "#FFFFFF")
    if "fill=" not in text:
        text = text.replace("<svg", f'<svg fill="{fill}"', 1)
    else:
        text = re.sub(r'fill="[^"]*"', f'fill="{fill}"', text, count=1)
    try:
        png = cairosvg.svg2png(bytestring=text.encode("utf-8"), output_width=280, output_height=280)
        logo = Image.open(io.BytesIO(png)).convert("RGBA")
    except Exception as exc:  # noqa: BLE001
        print(f"  cairosvg {slug}: {exc}")
        return None
    canvas = Image.new("RGBA", (SIZE, SIZE), bg)
    lw, lh = logo.size
    canvas.paste(logo, ((SIZE - lw) // 2, (SIZE - lh) // 2), logo)
    return canvas


def custom_tile(name: str) -> Image.Image | None:
    if name not in CUSTOM_SVG:
        return None
    bg, svg = CUSTOM_SVG[name]
    try:
        png = cairosvg.svg2png(bytestring=svg.encode("utf-8"), output_width=SIZE, output_height=SIZE)
        icon = Image.open(io.BytesIO(png)).convert("RGBA")
    except Exception as exc:  # noqa: BLE001
        print(f"  custom svg {name}: {exc}")
        return None
    canvas = Image.new("RGBA", (SIZE, SIZE), bg)
    # icon already full size with transparency
    canvas.alpha_composite(icon)
    return canvas


def itunes(term: str, country: str = "ru") -> Image.Image | None:
    qs = urllib.parse.urlencode({"term": term, "entity": "software", "country": country, "limit": 8})
    raw = http_get(f"https://itunes.apple.com/search?{qs}")
    if not raw:
        return itunes(term, "us") if country != "us" else None
    try:
        data = json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError:
        return None
    results = data.get("results") or []
    if not results:
        return itunes(term, "us") if country != "us" else None
    term_l = term.lower()
    best = results[0]
    for r in results:
        name = (r.get("trackName") or "").lower()
        if term_l.split()[0] in name:
            best = r
            break
    url = best.get("artworkUrl512") or best.get("artworkUrl100")
    if not url:
        return None
    url = url.replace("100x100bb", "512x512bb")
    blob = http_get(url)
    if not blob:
        return None
    try:
        return to_square(Image.open(io.BytesIO(blob)))
    except Exception:
        return None


def from_url(url: str) -> Image.Image | None:
    blob = http_get(url)
    if not blob:
        return None
    # svg?
    if url.endswith(".svg") or blob[:200].lstrip().startswith(b"<svg") or b"<svg" in blob[:500]:
        try:
            png = cairosvg.svg2png(bytestring=blob, output_width=SIZE, output_height=SIZE)
            return to_square(Image.open(io.BytesIO(png)))
        except Exception:
            return None
    try:
        return to_square(Image.open(io.BytesIO(blob)))
    except Exception:
        return None


def clearbit(domain: str) -> Image.Image | None:
    im = from_url(f"https://logo.clearbit.com/{domain}?size=512")
    if im:
        # put on brand-ish dark square with padding
        canvas = Image.new("RGBA", (SIZE, SIZE), "#111827")
        logo = im.resize((360, 360), Image.Resampling.LANCZOS)
        canvas.paste(logo, ((SIZE - 360) // 2, (SIZE - 360) // 2), logo if logo.mode == "RGBA" else None)
        return canvas
    return None


def duckduckgo_icon(domain: str) -> Image.Image | None:
    return from_url(f"https://icons.duckduckgo.com/ip3/{domain}.ico")


def google_favicon(domain: str) -> Image.Image | None:
    return from_url(f"https://www.google.com/s2/favicons?domain={domain}&sz=128")


def fetch_one(name: str, stem: str) -> bool:
    print(f"== {name}")
    im = None

    # 1) custom category art
    im = custom_tile(name)

    # 2) simple icons brand tile
    if im is None and name in SIMPLE:
        slug, bg, fill = SIMPLE[name]
        im = simple_tile(slug, bg, fill)
        if im is None and slug == "windows11":
            im = simple_tile("windows", bg, fill)

    # 3) direct URLs
    if im is None and name in DIRECT:
        for url in DIRECT[name]:
            im = from_url(url)
            if im:
                break

    # 4) iTunes artwork (best for consumer apps)
    if im is None and name in ITUNES:
        im = itunes(ITUNES[name])
        time.sleep(0.15)

    # 5) Clearbit
    if im is None and name in CLEARBIT:
        im = clearbit(CLEARBIT[name])
        time.sleep(0.1)

    # 6) favicon fallbacks
    if im is None and name in CLEARBIT:
        im = duckduckgo_icon(CLEARBIT[name]) or google_favicon(CLEARBIT[name])
        if im and min(im.size) < 64:
            im = None

    if im is None:
        print("  FAILED")
        return False

    dest = OUT / f"{stem}.png"
    save(im, dest)
    print(f"  saved {dest.name} ({dest.stat().st_size} bytes)")
    return True


def main() -> None:
    ok = fail = 0
    for name, stem in TARGETS:
        if fetch_one(name, stem):
            ok += 1
        else:
            fail += 1
    print(f"done ok={ok} fail={fail}")


if __name__ == "__main__":
    main()
