#!/usr/bin/env python3
"""Replace assortment apps with the curated Playerok-style apps list."""

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
JS = ROOT / "frontend/src/data/assortment.js"
OUT_DIR = ROOT / "frontend/public/assortment"
KEEP = ROOT / "scripts/_keep_games.json"
SIZE = 256
UA = "LootzAssortmentBot/1.0 (+https://lootz.ru)"

# Exact display order from product request
APPS: list[tuple[str, str]] = [
    ("Steam", "Steam"),
    ("Telegram", "Telegram"),
    ("Cursor", "Cursor"),
    ("TradingView", "TradingView"),
    ("Apple", "Apple"),
    ("PlayStation", "PlayStation"),
    ("ЧатГПТ", "ChatGPT"),
    ("Claude", "Claude"),
    ("TikTok", "TikTok"),
    ("Discord", "Discord"),
    ("Spotify", "Spotify"),
    ("YouTube", "YouTube"),
    ("Google Play", "Google Play"),
    ("Xbox", "Xbox"),
    ("Gemini (Nano Banana)", "Gemini"),
    ("Faceit", "FACEIT"),
    ("Adobe", "Adobe"),
    ("Battle.net", "Battle.net"),
    ("Grok", "Grok"),
    ("Nintendo", "Nintendo"),
    ("Suno", "Suno"),
    ("CapCut", "CapCut"),
    ("Windows", "Windows"),
    ("Rockstar Games", "Rockstar"),
    ("Другие приложения", "Другие приложения"),
    ("Kimi", "Kimi"),
    ("ВКонтакте", "ВКонтакте"),
    ("Perplexity", "Perplexity"),
    ("Нейросети", "Нейросети"),
    ("eSIM", "eSIM"),
    ("Soundcloud", "SoundCloud"),
    ("EA Play", "EA Play"),
    ("Likee", "Likee"),
    ("ExitLag", "ExitLag"),
    ("ZEPETO", "ZEPETO"),
    ("Pax Historia", "Pax Historia"),
    ("Razer Gold", "Razer Gold"),
    ("Runway", "Runway"),
    ("FL Studio", "FL Studio"),
    ("Twitch", "Twitch"),
    ("Microsoft Store", "Microsoft Store"),
    ("PolyBuzz", "PolyBuzz"),
    ("Oculus Quest", "Oculus Quest"),
    ("Voicemod", "Voicemod"),
    ("Kling", "Kling AI"),
    ("Duolingo", "Duolingo"),
    ("Figma", "Figma"),
    ("Netflix", "Netflix"),
    ("Новое", "Новое"),
    ("Chai", "Chai AI"),
    ("Ubisoft", "Ubisoft"),
    ("Autodesk", "Autodesk"),
    ("Higgsfield", "Higgsfield"),
    ("Zoom", "Zoom"),
    ("z.ai", "z.ai"),
    ("ElevenLabs", "ElevenLabs"),
    ("DeepSeek", "DeepSeek"),
    ("GearUP", "GearUP Booster"),
    ("HeyGen", "HeyGen"),
    ("Busuu", "Busuu"),
    ("Midjourney", "Midjourney"),
    ("Дизайн", "Дизайн"),
    ("OpenRouter", "OpenRouter"),
    ("Character ai", "Character.AI"),
    ("Replit", "Replit"),
    ("Emochi", "Emochi"),
    ("Gamma", "Gamma AI"),
    ("iMazing", "iMazing"),
    ("Copilot", "Copilot"),
    ("GeoGuessr", "GeoGuessr"),
    ("JetBrains", "JetBrains"),
    ("Quizlet", "Quizlet"),
    ("Meshy", "Meshy"),
    ("Tripo", "Tripo AI"),
    ("Wallpaper Engine", "Wallpaper Engine"),
    ("Epic Games", "Epic Games"),
    ("Canva", "Canva"),
    ("Picsart", "Picsart"),
    ("PICO", "PICO"),
    ("TeamSpeak", "TeamSpeak"),
    ("Snapchat", "Snapchat"),
    ("Coursera", "Coursera"),
    ("Ableton", "Ableton"),
    ("Recraft", "Recraft"),
    ("LagoFast", "LagoFast"),
    ("Splice", "Splice"),
    ("Manus", "Manus AI"),
    ("Notion", "Notion"),
    ("Bandicam", "Bandicam"),
    ("Dropbox", "Dropbox"),
    ("Bigo Live", "Bigo Live"),
    ("Soundpad", "Soundpad"),
    ("Lovable", "Lovable"),
    ("OBS Studio", "OBS Studio"),
    ("Krea", "Krea"),
    ("Clip Studio Paint", "Clip Studio Paint"),
    ("Envato Elements", "Envato"),
    ("Хостинг", "Хостинг"),
    ("Prime Video", "Prime Video"),
    ("Дзен", "Дзен"),
    ("Photoroom", "Photoroom"),
    ("Leonardo AI", "Leonardo"),
    ("Kick", "Kick"),
    ("Element", "Element"),
    ("Magnific", "Magnific AI"),
    ("Tidal", "Tidal"),
    ("Deezer", "Deezer"),
    ("Miro", "Miro"),
    ("PixVerse", "PixVerse"),
    ("GeForce NOW", "GeForce NOW"),
    ("КранчРолл", "Crunchyroll"),
    ("Udio", "Udio"),
    ("Yappy", "Yappy"),
    ("Trovo", "Trovo"),
    ("Crosshair X", "Crosshair X"),
    ("Аудиоредакторы", "Аудиоредакторы"),
    ("Slack", "Slack"),
    ("Hailuo", "Hailuo"),
    ("Luma", "Luma AI"),
    ("Windsurf", "Windsurf"),
    ("YoloMouse - Cursor Changer", "YoloMouse"),
    ("Quillbot", "Quillbot"),
    ("ArtList", "Artlist"),
    ("OpenArt", "OpenArt"),
    ("Chutes AI", "Chutes"),
    ("Mimo", "Mimo"),
    ("Tango Live", "Tango Live"),
    ("Ideogram", "Ideogram"),
    ("Qobuz", "Qobuz"),
    ("n8n", "n8n"),
    ("Ahrefs", "Ahrefs"),
    ("Hugging Face", "Hugging Face"),
    ("GOG", "GOG"),
    ("NoPing", "NoPing"),
]

# Reuse existing PNGs when names changed
ICON_ALIAS = {
    "Cursor": "cursor",
    "Claude": "claude",
    "ЧатГПТ": "chatgpt",
    "Apple": "app-store",  # fallback; prefer apple if exists
    "Gemini (Nano Banana)": "gemini",
    "Rockstar Games": "rockstar-launcher",
    "Другие приложения": "other-apps",
    "Нейросети": "ai",
    "Soundcloud": "soundcloud",
    "Runway": "runway-ml",
    "Character ai": "character-ai",
    "Дизайн": "design",
    "Хостинг": "hosting",
    "Prime Video": "amazon-prime",
    "КранчРолл": "crunchyroll",
    "Новое": "other-apps",
    "Аудиоредакторы": "fl-studio",
    "eSIM": "other-apps",
}

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
    "Snapchat": ("snapchat", "#FFFC00"),
    "Zoom": ("zoom", "#0B5CFF"),
    "Soundcloud": ("soundcloud", "#FF3300"),
    "Epic Games": ("epicgames", "#121212"),
    "Nintendo": ("nintendo", "#E60012"),
    "Battle.net": ("battledotnet", "#148EFF"),
    "Windows": ("windows", "#0078D4"),
    "Google Play": ("googleplay", "#414141"),
    "Apple": ("apple", "#000000"),
    "PlayStation": ("playstation", "#003791"),
    "TikTok": ("tiktok", "#000000"),
    "Kick": ("kick", "#53FC18"),
    "Ubisoft": ("ubisoft", "#000000"),
    "EA Play": ("ea", "#000000"),
    "Faceit": ("faceit", "#FF5500"),
    "GeForce NOW": ("nvidia", "#76B900"),
    "Microsoft Store": ("microsoft", "#5E5E5E"),
    "Dropbox": ("dropbox", "#0061FF"),
    "Slack": ("slack", "#4A154B"),
    "Notion": ("notion", "#000000"),
    "Figma": ("figma", "#F24E1E"),
    "Canva": ("canva", "#00C4CC"),
    "Duolingo": ("duolingo", "#58CC02"),
    "Deezer": ("deezer", "#A238FF"),
    "Tidal": ("tidal", "#000000"),
    "Miro": ("miro", "#FFD02F"),
    "Coursera": ("coursera", "#0056D2"),
    "Autodesk": ("autodesk", "#000000"),
    "JetBrains": ("jetbrains", "#000000"),
    "Hugging Face": ("huggingface", "#FFD21E"),
    "GOG": ("gogdotcom", "#86328A"),
    "n8n": ("n8n", "#EA4B71"),
    "Ahrefs": ("ahrefs", "#FF8C00"),
    "Replit": ("replit", "#F26207"),
    "OBS Studio": ("obsstudio", "#302E31"),
    "Element": ("element", "#0DBD8B"),
    "Ableton": ("abletonlive", "#000000"),
    "Quizlet": ("quizlet", "#4255FF"),
    "TradingView": ("tradingview", "#2962FF"),
    "Copilot": ("githubcopilot", "#000000"),
    "Midjourney": ("midjourney", "#000000"),
    "OpenAI": ("openai", "#412991"),
    "ЧатГПТ": ("openai", "#10A37F"),
    "Claude": ("anthropic", "#D4A27F"),
    "Perplexity": ("perplexity", "#20808D"),
}

ITUNES_TERM = {
    "Telegram": "Telegram",
    "TikTok": "TikTok",
    "Discord": "Discord",
    "Spotify": "Spotify",
    "YouTube": "YouTube",
    "CapCut": "CapCut",
    "Likee": "Likee",
    "ZEPETO": "ZEPETO",
    "Duolingo": "Duolingo",
    "Netflix": "Netflix",
    "Zoom": "ZOOM Cloud Meetings",
    "Busuu": "Busuu",
    "Picsart": "Picsart",
    "Snapchat": "Snapchat",
    "Bigo Live": "BIGO LIVE",
    "Photoroom": "Photoroom",
    "Yappy": "Yappy",
    "Tango Live": "Tango Live",
    "TradingView": "TradingView",
    "ExitLag": "ExitLag",
    "Voicemod": "Voicemod",
    "GeoGuessr": "GeoGuessr",
    "Quizlet": "Quizlet",
    "iMazing": "iMazing",
    "FL Studio": "FL Studio Mobile",
    "TeamSpeak": "TeamSpeak",
    "Oculus Quest": "Meta Quest",
    "PICO": "PICO",
    "Razer Gold": "Razer Gold",
    "GearUP": "GearUP Booster",
    "LagoFast": "LagoFast",
    "NoPing": "NoPing",
    "PolyBuzz": "PolyBuzz",
    "Chai": "Chai - Chat AI Friends",
    "Emochi": "Emochi",
}

CATEGORY_COLORS = {
    "Нейросети": "#8B5CF6",
    "Дизайн": "#EC4899",
    "Хостинг": "#0EA5E9",
    "Другие приложения": "#64748B",
    "Новое": "#2B71F3",
    "Аудиоредакторы": "#F59E0B",
    "eSIM": "#06B6D4",
    "Cursor": "#F97316",
    "Claude": "#D4A27F",
    "ЧатГПТ": "#10A37F",
    "Grok": "#111111",
    "Suno": "#000000",
    "Midjourney": "#111111",
    "Kimi": "#1A6AFF",
    "DeepSeek": "#4D6BFE",
    "Perplexity": "#20808D",
    "OpenRouter": "#6566F1",
    "n8n": "#EA4B71",
    "Windsurf": "#0EA5E9",
    "Lovable": "#FF6B6B",
    "Manus": "#7C3AED",
    "z.ai": "#111827",
}

COLORS = [
    "#2B71F3", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
    "#06B6D4", "#EC4899", "#84CC16", "#F97316", "#6366F1",
]


def slugify(name: str) -> str:
    s = name.lower().replace("ё", "е")
    s = re.sub(r"[^a-z0-9а-я]+", "-", s, flags=re.I)
    s = re.sub(r"-+", "-", s).strip("-")
    return (s or "item")[:60]


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def http_get(url: str, timeout: int = 25) -> bytes | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except Exception:
        return None


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


def letter_tile(name: str, color: str | None = None) -> Image.Image:
    if not color:
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


def simple_icon_tile(slug: str, bg: str) -> Image.Image | None:
    try:
        import cairosvg
    except ImportError:
        return None
    raw = http_get(f"https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/{slug}.svg")
    if not raw:
        return None
    svg_text = raw.decode("utf-8")
    fill = "#111111" if bg.upper() in {"#FFFC00", "#FFFFFF", "#FFD02F", "#FFD21E"} else "#FFFFFF"
    if "fill=" not in svg_text:
        svg_text = svg_text.replace("<svg", f'<svg fill="{fill}"', 1)
    else:
        svg_text = re.sub(r'fill="[^"]*"', f'fill="{fill}"', svg_text, count=1)
    try:
        png = cairosvg.svg2png(bytestring=svg_text.encode("utf-8"), output_width=180, output_height=180)
        logo = Image.open(io.BytesIO(png)).convert("RGBA")
    except Exception:
        return None
    canvas = Image.new("RGBA", (SIZE, SIZE), bg)
    lw, lh = logo.size
    canvas.paste(logo, ((SIZE - lw) // 2, (SIZE - lh) // 2), logo)
    return canvas


def itunes_artwork(term: str, country: str = "ru") -> Image.Image | None:
    qs = urllib.parse.urlencode({"term": term, "entity": "software", "country": country, "limit": 5})
    raw = http_get(f"https://itunes.apple.com/search?{qs}")
    if not raw:
        if country != "us":
            return itunes_artwork(term, "us")
        return None
    try:
        data = json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError:
        return None
    results = data.get("results") or []
    if not results:
        if country != "us":
            return itunes_artwork(term, "us")
        return None
    term_l = term.lower()
    best = results[0]
    for r in results:
        name = (r.get("trackName") or "").lower()
        if term_l in name or name in term_l:
            best = r
            break
    url = best.get("artworkUrl512") or best.get("artworkUrl100")
    if not url:
        return None
    url = url.replace("100x100bb", "512x512bb")
    img_raw = http_get(url)
    if not img_raw:
        return None
    try:
        return to_square(Image.open(io.BytesIO(img_raw)))
    except Exception:
        return None


def clearbit_logo(domain: str) -> Image.Image | None:
    raw = http_get(f"https://logo.clearbit.com/{domain}")
    if not raw:
        return None
    try:
        return to_square(Image.open(io.BytesIO(raw)))
    except Exception:
        return None


CLEARBIT_DOMAIN = {
    "TradingView": "tradingview.com",
    "Cursor": "cursor.com",
    "Claude": "anthropic.com",
    "ЧатГПТ": "openai.com",
    "Grok": "x.ai",
    "Suno": "suno.com",
    "Perplexity": "perplexity.ai",
    "Kimi": "kimi.ai",
    "DeepSeek": "deepseek.com",
    "Midjourney": "midjourney.com",
    "ElevenLabs": "elevenlabs.io",
    "Runway": "runwayml.com",
    "HeyGen": "heygen.com",
    "OpenRouter": "openrouter.ai",
    "Character ai": "character.ai",
    "Replit": "replit.com",
    "Gamma": "gamma.app",
    "Meshy": "meshy.ai",
    "Tripo": "tripo3d.ai",
    "Recraft": "recraft.ai",
    "Krea": "krea.ai",
    "Lovable": "lovable.dev",
    "Leonardo AI": "leonardo.ai",
    "Magnific": "magnific.ai",
    "PixVerse": "pixverse.ai",
    "Hailuo": "hailuoai.com",
    "Luma": "lumalabs.ai",
    "Windsurf": "codeium.com",
    "Ideogram": "ideogram.ai",
    "ArtList": "artlist.io",
    "OpenArt": "openart.ai",
    "Quillbot": "quillbot.com",
    "Ahrefs": "ahrefs.com",
    "Hugging Face": "huggingface.co",
    "n8n": "n8n.io",
    "GOG": "gog.com",
    "Qobuz": "qobuz.com",
    "Splice": "splice.com",
    "Envato Elements": "envato.com",
    "Clip Studio Paint": "clipstudio.net",
    "Bandicam": "bandicam.com",
    "Soundpad": "leppsoft.com",
    "Crosshair X": "crosshairx.com",
    "Voicemod": "voicemod.net",
    "Higgsfield": "higgsfield.ai",
    "z.ai": "z.ai",
    "Manus": "manus.im",
    "Chutes AI": "chutes.ai",
    "Pax Historia": "paxhistoria.com",
    "Kling": "klingai.com",
    "PolyBuzz": "polybuzz.ai",
    "NoPing": "noping.com",
    "GearUP": "gearupbooster.com",
    "LagoFast": "lagofast.com",
    "iMazing": "imazing.com",
    "GeoGuessr": "geoguessr.com",
    "YoloMouse - Cursor Changer": "yololabs.io",
    "Mimo": "getmimo.com",
    "Emochi": "emochi.com",
    "Chai": "chai-research.com",
    "eSIM": "esim.com",
    "Rockstar Games": "rockstargames.com",
    "Oculus Quest": "meta.com",
    "PICO": "picoxr.com",
    "Razer Gold": "razer.com",
    "Prime Video": "primevideo.com",
    "Gemini (Nano Banana)": "google.com",
    "Copilot": "microsoft.com",
    "Wallpaper Engine": "wallpaperengine.io",
    "Photoroom": "photoroom.com",
}


def resolve_existing(name: str, slug: str) -> Path | None:
    candidates = []
    if name in ICON_ALIAS:
        candidates.append(OUT_DIR / f"{ICON_ALIAS[name]}.png")
    candidates.append(OUT_DIR / f"{slug}.png")
    # Common renames
    aliases = {
        "chatgpt": ["chatgpt"],
        "claude": ["claude", "claude-ai"],
        "cursor": ["cursor", "cursor-ai"],
        "apple": ["apple", "app-store"],
        "gemini-nano-banana": ["gemini"],
        "rockstar-games": ["rockstar-launcher", "rockstar"],
        "soundcloud": ["soundcloud"],
        "character-ai": ["character-ai"],
        "krančroll": ["crunchyroll"],
        "кранчролл": ["crunchyroll"],
        "prime-video": ["amazon-prime"],
        "runway": ["runway-ml", "runway"],
        "leonardo-ai": ["leonardo-ai"],
        "obs-studio": ["obs-studio"],
        "fl-studio": ["fl-studio"],
        "вконтакте": ["vk"],
        "нейросети": ["ai"],
        "дизайн": ["design"],
        "хостинг": ["hosting"],
        "другие-приложения": ["other-apps"],
    }
    for a in aliases.get(slug, []):
        candidates.append(OUT_DIR / f"{a}.png")
    for p in candidates:
        if p.exists() and p.stat().st_size > 500:
            return p
    return None


def ensure_icon(name: str, search: str) -> str:
    slug = slugify(name)
    dest = OUT_DIR / f"{slug}.png"
    existing = resolve_existing(name, slug)
    if existing and existing.resolve() != dest.resolve():
        # copy alias into canonical slug path
        dest.write_bytes(existing.read_bytes())
        return f"/assortment/{slug}.png"
    if dest.exists() and dest.stat().st_size > 500:
        return f"/assortment/{slug}.png"

    print(f"icon: {name}")
    im = None

    if name in SIMPLE_ICON:
        si_slug, bg = SIMPLE_ICON[name]
        im = simple_icon_tile(si_slug, bg)

    if im is None and name in CLEARBIT_DOMAIN:
        im = clearbit_logo(CLEARBIT_DOMAIN[name])
        time.sleep(0.15)

    if im is None:
        term = ITUNES_TERM.get(name) or search or name
        im = itunes_artwork(term)
        time.sleep(0.2)

    if im is None and name in CATEGORY_COLORS:
        im = letter_tile(name, CATEGORY_COLORS[name])
    if im is None:
        im = letter_tile(name, CATEGORY_COLORS.get(name))

    save_png(im, dest)
    return f"/assortment/{slug}.png"


def fmt_item(name: str, search: str, icon: str, kind: str) -> str:
    return (
        f"  {{ name: '{esc(name)}', search: '{esc(search)}', "
        f"icon: '{icon}', kind: '{kind}' }},"
    )


def main() -> None:
    keep = json.loads(KEEP.read_text(encoding="utf-8"))
    mobile = keep["mobile"]
    pc = keep["pc"]

    app_rows = []
    for name, search in APPS:
        icon = ensure_icon(name, search)
        app_rows.append({"name": name, "search": search, "icon": icon, "kind": "app"})

    # HOME_TOP_14: keep popular mix, use new app names
    home = [
        {"name": "Claude", "search": "Claude", "icon": next(a["icon"] for a in app_rows if a["name"] == "Claude"), "kind": "app"},
        {"name": "Cursor", "search": "Cursor", "icon": next(a["icon"] for a in app_rows if a["name"] == "Cursor"), "kind": "app"},
        next(i for i in mobile if i["name"] == "Arena Breakout"),
        next(i for i in pc if i["name"] == "PUBG"),
        next(i for i in mobile if i["name"] == "PUBG Mobile"),
        {"name": "Telegram", "search": "Telegram", "icon": next(a["icon"] for a in app_rows if a["name"] == "Telegram"), "kind": "app"},
        {"name": "ЧатГПТ", "search": "ChatGPT", "icon": next(a["icon"] for a in app_rows if a["name"] == "ЧатГПТ"), "kind": "app"},
        {"name": "Apple", "search": "Apple", "icon": next(a["icon"] for a in app_rows if a["name"] == "Apple"), "kind": "app"},
        {"name": "PlayStation", "search": "PlayStation", "icon": next(a["icon"] for a in app_rows if a["name"] == "PlayStation"), "kind": "app"},
        {"name": "Discord", "search": "Discord", "icon": next(a["icon"] for a in app_rows if a["name"] == "Discord"), "kind": "app"},
        {"name": "Steam", "search": "Steam", "icon": next(a["icon"] for a in app_rows if a["name"] == "Steam"), "kind": "app"},
        next(i for i in pc if i["name"] == "Valorant"),
        next(i for i in pc if i["name"] == "Escape From Tarkov"),
        next(i for i in pc if i["name"] == "CS2"),
    ]

    home_names = {h["name"] for h in home}
    # ASSORTMENT order: apps in user order (including those also in HOME), then mobile, then pc.
    # Avoid duplicating HOME items when spreading: structure as user apps first then games.
    # Home carousel uses HOME_TOP_14 separately; desktop uses ASSORTMENT.slice — starting with apps list is intended.

    lines = [
        "/** Fixed home carousel order (first 14) — do not reorder without product request */",
        "export const HOME_TOP_14 = [",
        *[fmt_item(h["name"], h["search"], h["icon"], h["kind"]) for h in home],
        "];",
        "",
        "/** Playerok-style assortment: curated apps → mobile → PC */",
        "export const ASSORTMENT = [",
        "  // Apps (curated order)",
        *[fmt_item(a["name"], a["search"], a["icon"], a["kind"]) for a in app_rows],
        "  // Mobile games",
        *[fmt_item(i["name"], i["search"], i["icon"], i["kind"]) for i in mobile],
        "  // PC games",
        *[fmt_item(i["name"], i["search"], i["icon"], i["kind"]) for i in pc],
        "];",
        "",
        "export const ASSORTMENT_PREVIEW_COUNT = HOME_TOP_14.length;",
        "",
        "export const ASSORTMENT_TABS = [",
        "  { id: 'games', label: 'Игры' },",
        "  { id: 'mobile', label: 'Мобильные игры' },",
        "  { id: 'apps', label: 'Приложения' },",
        "];",
        "",
        "/** All games = mobile + PC (not apps/services) */",
        "export function assortmentByTab(tabId) {",
        "  if (tabId === 'apps') return ASSORTMENT.filter((i) => i.kind === 'app');",
        "  if (tabId === 'mobile') return ASSORTMENT.filter((i) => i.kind === 'mobile');",
        "  // games: absolutely all games",
        "  return ASSORTMENT.filter((i) => i.kind === 'mobile' || i.kind === 'pc');",
        "}",
        "",
    ]

    JS.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {JS}")
    print(f"apps={len(app_rows)} mobile={len(mobile)} pc={len(pc)} home={len(home)}")
    # home_names unused warning silence
    _ = home_names


if __name__ == "__main__":
    main()
