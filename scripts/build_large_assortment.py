#!/usr/bin/env python3
"""Build a 500+ Lootz assortment catalog and regenerate assortment.js.

Keeps HOME_TOP_14 order fixed. Sources:
- existing assortment.js entries
- Steam concurrent / featured charts
- curated RU-market mobile + digital services lists
"""

from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSORTMENT_JS = ROOT / "frontend/src/data/assortment.js"
UA = "LootzAssortmentBot/1.0 (+https://lootz.ru)"


def slugify(name: str) -> str:
    s = name.lower().replace("ё", "е")
    s = re.sub(r"[^a-z0-9а-я]+", "-", s, flags=re.I)
    s = re.sub(r"-+", "-", s).strip("-")
    return (s or "item")[:60]


def http_json(url: str, timeout: int = 30):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


# --- Curated extras (Playerok-style digital marketplace) -----------------

EXTRA_APPS = [
    ("Midjourney", "Midjourney", "app"),
    ("Perplexity", "Perplexity", "app"),
    ("Gemini", "Gemini", "app"),
    ("Copilot", "Copilot", "app"),
    ("Grok", "Grok", "app"),
    ("Notion", "Notion", "app"),
    ("Canva", "Canva", "app"),
    ("Figma", "Figma", "app"),
    ("CapCut", "CapCut", "app"),
    ("Photoshop", "Photoshop", "app"),
    ("Lightroom", "Lightroom", "app"),
    ("Premiere Pro", "Premiere", "app"),
    ("After Effects", "After Effects", "app"),
    ("Illustrator", "Illustrator", "app"),
    ("DaVinci Resolve", "DaVinci", "app"),
    ("Crunchyroll", "Crunchyroll", "app"),
    ("Disney+", "Disney", "app"),
    ("HBO Max", "HBO", "app"),
    ("Amazon Prime", "Prime Video", "app"),
    ("YouTube Premium", "YouTube Premium", "app"),
    ("Apple Music", "Apple Music", "app"),
    ("Apple TV+", "Apple TV", "app"),
    ("Apple Arcade", "Apple Arcade", "app"),
    ("iCloud", "iCloud", "app"),
    ("Google One", "Google One", "app"),
    ("Yandex Plus", "Яндекс Плюс", "app"),
    ("Яндекс Музыка", "Яндекс Музыка", "app"),
    ("Okko", "Okko", "app"),
    ("KinoPoisk", "Кинопоиск", "app"),
    ("IVI", "IVI", "app"),
    ("Wink", "Wink", "app"),
    ("START", "START", "app"),
    ("Premier", "Premier", "app"),
    ("Telegram Premium", "Telegram Premium", "app"),
    ("Discord Nitro", "Discord Nitro", "app"),
    ("Boosty", "Boosty", "app"),
    ("Patreon", "Patreon", "app"),
    ("OnlyFans", "OnlyFans", "app"),
    ("Chaturbate", "Chaturbate", "app"),
    ("Xbox Game Pass", "Game Pass", "app"),
    ("PlayStation Plus", "PS Plus", "app"),
    ("Nintendo Online", "Nintendo Switch Online", "app"),
    ("Origin", "Origin", "app"),
    ("Rockstar Launcher", "Rockstar", "app"),
    ("Riot Client", "Riot", "app"),
    ("Garena", "Garena", "app"),
    ("HoYoverse", "HoYoverse", "app"),
    ("miHoYo", "miHoYo", "app"),
    ("VPN", "VPN", "app"),
    ("ExpressVPN", "ExpressVPN", "app"),
    ("NordVPN", "NordVPN", "app"),
    ("Surfshark", "Surfshark", "app"),
    ("Proton VPN", "Proton VPN", "app"),
    ("ChatGPT Plus", "ChatGPT Plus", "app"),
    ("OpenAI", "OpenAI", "app"),
    ("Anthropic", "Anthropic", "app"),
    ("Grammarly", "Grammarly", "app"),
    ("Duolingo", "Duolingo", "app"),
    ("LinkedIn", "LinkedIn", "app"),
    ("Tinder", "Tinder", "app"),
    ("Badoo", "Badoo", "app"),
    ("OK.ru", "Одноклассники", "app"),
    ("Mail.ru", "Mail.ru", "app"),
    ("Yandex", "Яндекс", "app"),
    ("Kaspi.kz", "Kaspi", "app"),
    ("SberPrime", "СберПрайм", "app"),
    ("Tinkoff Pro", "Тинькофф", "app"),
    ("PSN", "PSN", "app"),
    ("Xbox Live", "Xbox Live", "app"),
    ("Nintendo eShop", "Nintendo eShop", "app"),
    ("Roblox Premium", "Roblox Premium", "app"),
    ("Minecraft Realms", "Minecraft Realms", "app"),
    ("Cursor Pro", "Cursor Pro", "app"),
    ("GitHub Copilot", "GitHub Copilot", "app"),
    ("JetBrains", "JetBrains", "app"),
    ("Adobe Creative Cloud", "Creative Cloud", "app"),
    ("Autodesk", "Autodesk", "app"),
    ("Office 365", "Office 365", "app"),
    ("Windows 11", "Windows 11", "app"),
    ("Windows 10", "Windows 10", "app"),
    ("Antivirus", "Антивирус", "app"),
    ("Kaspersky", "Kaspersky", "app"),
    ("ChatGPT Team", "ChatGPT Team", "app"),
    ("Claude Pro", "Claude Pro", "app"),
    ("Claude Team", "Claude Team", "app"),
    ("Midjourney Plan", "Midjourney Plan", "app"),
    ("Runway ML", "Runway", "app"),
    ("ElevenLabs", "ElevenLabs", "app"),
    ("Suno", "Suno", "app"),
    ("Udio", "Udio", "app"),
    ("Leonardo AI", "Leonardo", "app"),
    ("Stable Diffusion", "Stable Diffusion", "app"),
    ("Character.AI", "Character.AI", "app"),
    ("Poe", "Poe", "app"),
    ("Groq", "Groq", "app"),
    ("DeepSeek", "DeepSeek", "app"),
    ("Qwen", "Qwen", "app"),
    ("GigaChat", "GigaChat", "app"),
    ("YandexGPT", "YandexGPT", "app"),
    ("Instagram", "Instagram", "app"),
    ("Facebook", "Facebook", "app"),
    ("X Twitter", "Twitter", "app"),
    ("Reddit", "Reddit", "app"),
    ("Pinterest", "Pinterest", "app"),
    ("Threads", "Threads", "app"),
    ("BeReal", "BeReal", "app"),
    ("Clubhouse", "Clubhouse", "app"),
    ("Signal", "Signal", "app"),
    ("Viber", "Viber", "app"),
    ("WeChat", "WeChat", "app"),
    ("Line", "LINE", "app"),
    ("QQ", "QQ", "app"),
    ("Bilibili", "Bilibili", "app"),
    ("Douyin", "Douyin", "app"),
    ("Xbox Cloud", "Xbox Cloud Gaming", "app"),
    ("Amazon Luna", "Amazon Luna", "app"),
    ("Boosteroid", "Boosteroid", "app"),
    ("Shadow PC", "Shadow", "app"),
    ("Parsec", "Parsec", "app"),
    ("AnyDesk", "AnyDesk", "app"),
    ("TeamViewer", "TeamViewer", "app"),
    ("Remote Desktop", "Remote Desktop", "app"),
    ("ChatGPT API", "OpenAI API", "app"),
    ("Cloudflare", "Cloudflare", "app"),
    ("AWS", "AWS", "app"),
    ("Google Cloud", "Google Cloud", "app"),
    ("DigitalOcean", "DigitalOcean", "app"),
    ("VPS", "VPS", "app"),
    ("Domain", "Домен", "app"),
    ("SSL", "SSL", "app"),
    ("1Password", "1Password", "app"),
    ("LastPass", "LastPass", "app"),
    ("Bitwarden", "Bitwarden", "app"),
    ("Dropbox", "Dropbox", "app"),
    ("Google Drive", "Google Drive", "app"),
    ("OneDrive", "OneDrive", "app"),
    ("Mega", "MEGA", "app"),
    ("Trello", "Trello", "app"),
    ("Asana", "Asana", "app"),
    ("Slack", "Slack", "app"),
    ("Microsoft Teams", "Teams", "app"),
    ("Webex", "Webex", "app"),
    ("Chatwork", "Chatwork", "app"),
]

EXTRA_MOBILE = [
    ("Honkai Impact 3rd", "Honkai Impact", "mobile"),
    ("Tower of Fantasy", "Tower of Fantasy", "mobile"),
    ("Wuthering Waves", "Wuthering Waves", "mobile"),
    ("AFK Arena", "AFK Arena", "mobile"),
    ("Summoners War", "Summoners War", "mobile"),
    ("Raid Shadow Legends", "RAID Shadow Legends", "mobile"),
    ("Marvel Snap", "Marvel Snap", "mobile"),
    ("Marvel Contest", "Marvel Contest of Champions", "mobile"),
    ("Pokémon GO", "Pokemon GO", "mobile"),
    ("Pokémon Unite", "Pokemon Unite", "mobile"),
    ("Monster Hunter Now", "Monster Hunter Now", "mobile"),
    ("Diablo Immortal", "Diablo Immortal", "mobile"),
    ("Call of Duty Warzone Mobile", "Warzone Mobile", "mobile"),
    ("Apex Legends Mobile", "Apex Legends Mobile", "mobile"),
    ("Farlight 84", "Farlight 84", "mobile"),
    ("Once Human Mobile", "Once Human Mobile", "mobile"),
    ("State of Survival", "State of Survival", "mobile"),
    ("Guns of Glory", "Guns of Glory", "mobile"),
    ("Evony", "Evony", "mobile"),
    ("Lords Mobile", "Lords Mobile", "mobile"),
    ("King of Avalon", "King of Avalon", "mobile"),
    ("Rise of Empires", "Rise of Empires", "mobile"),
    ("Age of Empires Mobile", "Age of Empires Mobile", "mobile"),
    ("Infinity Kingdom", "Infinity Kingdom", "mobile"),
    ("Dragon City", "Dragon City", "mobile"),
    ("Monster Legends", "Monster Legends", "mobile"),
    ("Merge Dragons", "Merge Dragons", "mobile"),
    ("Homescapes", "Homescapes", "mobile"),
    ("Gardenscapes", "Gardenscapes", "mobile"),
    ("Fishdom", "Fishdom", "mobile"),
    ("Toy Blast", "Toy Blast", "mobile"),
    ("Toon Blast", "Toon Blast", "mobile"),
    ("Candy Crush", "Candy Crush", "mobile"),
    ("Candy Crush Soda", "Candy Crush Soda", "mobile"),
    ("Coin Master", "Coin Master", "mobile"),
    ("Monopoly GO", "Monopoly GO", "mobile"),
    ("Board Kings", "Board Kings", "mobile"),
    ("Trivia Crack", "Trivia Crack", "mobile"),
    ("8 Ball Pool", "8 Ball Pool", "mobile"),
    ("Billiards City", "Billiards", "mobile"),
    ("Dream League Soccer", "Dream League", "mobile"),
    ("FIFA Mobile", "FIFA Mobile", "mobile"),
    ("NBA 2K Mobile", "NBA 2K Mobile", "mobile"),
    ("Asphalt 9", "Asphalt 9", "mobile"),
    ("Asphalt 8", "Asphalt 8", "mobile"),
    ("Real Racing 3", "Real Racing 3", "mobile"),
    ("CSR Racing 2", "CSR 2", "mobile"),
    ("Need for Speed No Limits", "NFS No Limits", "mobile"),
    ("Subway Surfers", "Subway Surfers", "mobile"),
    ("Temple Run 2", "Temple Run", "mobile"),
    ("Geometry Dash", "Geometry Dash", "mobile"),
    ("Among Us", "Among Us", "mobile"),
    ("Fall Guys", "Fall Guys", "mobile"),
    ("Stumble Guys", "Stumble Guys", "mobile"),
    ("Party Animals", "Party Animals", "mobile"),
    ("Brawlhalla", "Brawlhalla", "mobile"),
    ("Shadow Fight 2", "Shadow Fight 2", "mobile"),
    ("Shadow Fight Arena", "Shadow Fight Arena", "mobile"),
    ("Injustice 2", "Injustice 2", "mobile"),
    ("Tekken", "Tekken", "mobile"),
    ("Street Fighter DUEL", "Street Fighter", "mobile"),
    ("Dragon Ball Legends", "Dragon Ball Legends", "mobile"),
    ("One Piece Bounty", "One Piece Bounty Rush", "mobile"),
    ("Naruto Ultimate Ninja", "Naruto", "mobile"),
    ("Bleach Brave Souls", "Bleach", "mobile"),
    ("Fate Grand Order", "Fate/Grand Order", "mobile"),
    ("Azur Lane", "Azur Lane", "mobile"),
    ("Girls Frontline", "Girls Frontline", "mobile"),
    ("Nikke", "Goddess of Victory Nikke", "mobile"),
    ("Blue Archive", "Blue Archive", "mobile"),
    ("Arknights", "Arknights", "mobile"),
    ("Punishing Gray Raven", "Punishing Gray Raven", "mobile"),
    ("Reverse 1999", "Reverse 1999", "mobile"),
    ("Limbus Company", "Limbus Company", "mobile"),
    ("Uma Musume", "Uma Musume", "mobile"),
    ("Princess Connect", "Princess Connect", "mobile"),
    ("Epic Seven", "Epic Seven", "mobile"),
    ("Idle Heroes", "Idle Heroes", "mobile"),
    ("AFK Journey", "AFK Journey", "mobile"),
    ("Watcher of Realms", "Watcher of Realms", "mobile"),
    ("Hero Wars", "Hero Wars", "mobile"),
    ("Raid Land", "Raid Land", "mobile"),
    ("Last War", "Last War Survival", "mobile"),
    ("Doomsday Last Survivors", "Doomsday", "mobile"),
    ("Puzzles and Survival", "Puzzles & Survival", "mobile"),
    ("Frost & Flame", "Frost and Flame", "mobile"),
    ("Project Makeover", "Project Makeover", "mobile"),
    ("Episode", "Episode", "mobile"),
    ("Choices", "Choices", "mobile"),
    ("Love and Deepspace", "Love and Deepspace", "mobile"),
    ("Tears of Themis", "Tears of Themis", "mobile"),
    ("MrLove", "Mr Love Queen's Choice", "mobile"),
    ("Identity V", "Identity V", "mobile"),
    ("Dead by Daylight Mobile", "DbD Mobile", "mobile"),
    ("Five Nights at Freddy's", "FNAF", "mobile"),
    ("Granny", "Granny", "mobile"),
    ("Horror Tale", "Horror", "mobile"),
    ("SimCity BuildIt", "SimCity", "mobile"),
    ("The Sims Mobile", "The Sims Mobile", "mobile"),
    ("Animal Crossing Pocket", "Animal Crossing", "mobile"),
    ("Stardew Valley Mobile", "Stardew Valley", "mobile"),
    ("Terraria Mobile", "Terraria", "mobile"),
    ("Don't Starve", "Don't Starve", "mobile"),
    ("Alto's Odyssey", "Alto", "mobile"),
    ("Monument Valley", "Monument Valley", "mobile"),
    ("Genshin Impact", "Genshin Impact", "mobile"),
    ("Zenless Zone Zero", "Zenless Zone Zero", "mobile"),
    ("Honkai Star Rail", "Honkai Star Rail", "mobile"),
    ("PUBG New State", "PUBG New State", "mobile"),
    ("Arena Breakout Infinite Mobile", "Arena Breakout", "mobile"),
    ("Delta Force Hawk Ops", "Delta Force Mobile", "mobile"),
    ("Blood Strike", "Blood Strike", "mobile"),
    ("War Thunder Mobile", "War Thunder Mobile", "mobile"),
    ("World of Tanks Blitz", "World of Tanks Blitz", "mobile"),
    ("World of Warships Blitz", "Warships Blitz", "mobile"),
    ("Standoff Critical Strike", "Critical Strike", "mobile"),
    ("Critical Ops", "Critical Ops", "mobile"),
    ("Modern Strike Online", "Modern Strike", "mobile"),
    ("Bullet Force", "Bullet Force", "mobile"),
    ("Guns of Boom", "Guns of Boom", "mobile"),
    ("Sniper 3D", "Sniper 3D", "mobile"),
    ("Deer Hunter", "Deer Hunter", "mobile"),
    ("Golf Clash", "Golf Clash", "mobile"),
    ("Tennis Clash", "Tennis Clash", "mobile"),
    ("Basketball Stars", "Basketball Stars", "mobile"),
    ("Soccer Stars", "Soccer Stars", "mobile"),
    ("Score! Hero", "Score Hero", "mobile"),
    ("Top Eleven", "Top Eleven", "mobile"),
    ("PES Club Manager", "eFootball PES", "mobile"),
    ("Madden NFL", "Madden", "mobile"),
    ("MLB Tap Sports", "MLB", "mobile"),
    ("Wrestling Empire", "Wrestling", "mobile"),
    ("Talking Tom", "Talking Tom", "mobile"),
    ("My Talking Angela", "Talking Angela", "mobile"),
    ("Toca Life", "Toca Life", "mobile"),
    ("Roblox", "Roblox", "mobile"),
    ("Minecraft PE", "Minecraft PE", "mobile"),
    ("Block Craft 3D", "Block Craft", "mobile"),
    ("The Sandbox", "The Sandbox", "mobile"),
    ("Decentraland", "Decentraland", "mobile"),
    ("Cats Gang", "Cats", "mobile"),
    ("X Empire", "X Empire", "mobile"),
    ("Major", "Major", "mobile"),
    ("City Holder", "City Holder", "mobile"),
    ("Soft Hamster", "Hamster", "mobile"),
]

# Extra well-known PC titles beyond Steam chart (accounts / keys / currency markets)
EXTRA_PC = [
    ("Counter-Strike 2", "CS2", "pc"),
    ("Valorant", "Valorant", "pc"),
    ("League of Legends", "League of Legends", "pc"),
    ("Teamfight Tactics", "TFT", "pc"),
    ("Legends of Runeterra", "Runeterra", "pc"),
    ("Fortnite", "Fortnite", "pc"),
    ("Warzone", "Warzone", "pc"),
    ("Black Ops 6", "Black Ops 6", "pc"),
    ("Modern Warfare 3", "MW3", "pc"),
    ("FIFA 23", "FIFA 23", "pc"),
    ("EA FC 24", "EA FC 24", "pc"),
    ("EA FC 25", "EA FC 25", "pc"),
    ("NBA 2K24", "NBA 2K24", "pc"),
    ("NBA 2K25", "NBA 2K25", "pc"),
    ("Madden 25", "Madden 25", "pc"),
    ("Forza Horizon 5", "Forza Horizon 5", "pc"),
    ("Forza Motorsport", "Forza Motorsport", "pc"),
    ("Gran Turismo 7", "Gran Turismo", "pc"),
    ("Assetto Corsa", "Assetto Corsa", "pc"),
    ("iRacing", "iRacing", "pc"),
    ("BeamNG.drive", "BeamNG", "pc"),
    ("Euro Truck Simulator 2", "ETS2", "pc"),
    ("American Truck Simulator", "ATS", "pc"),
    ("Farming Simulator 25", "Farming Simulator", "pc"),
    ("Microsoft Flight Simulator", "Flight Simulator", "pc"),
    ("Cities Skylines 2", "Cities Skylines", "pc"),
    ("The Sims 4", "The Sims 4", "pc"),
    ("SimCity", "SimCity", "pc"),
    ("Civilization VI", "Civilization", "pc"),
    ("Civilization VII", "Civ 7", "pc"),
    ("Total War Warhammer 3", "Warhammer 3", "pc"),
    ("Age of Empires IV", "Age of Empires", "pc"),
    ("Company of Heroes 3", "Company of Heroes", "pc"),
    ("Hearts of Iron IV", "HOI4", "pc"),
    ("Europa Universalis IV", "EU4", "pc"),
    ("Crusader Kings III", "CK3", "pc"),
    ("Stellaris", "Stellaris", "pc"),
    ("Victoria 3", "Victoria 3", "pc"),
    ("Baldur's Gate 3", "Baldur's Gate 3", "pc"),
    ("Divinity Original Sin 2", "Divinity", "pc"),
    ("Pathfinder Wrath", "Pathfinder", "pc"),
    ("Diablo IV", "Diablo 4", "pc"),
    ("Diablo III", "Diablo 3", "pc"),
    ("Path of Exile 2", "PoE 2", "pc"),
    ("Last Epoch", "Last Epoch", "pc"),
    ("Torchlight Infinite", "Torchlight", "pc"),
    ("Wolcen", "Wolcen", "pc"),
    ("Grim Dawn", "Grim Dawn", "pc"),
    ("Hades", "Hades", "pc"),
    ("Hades II", "Hades 2", "pc"),
    ("Dead Cells", "Dead Cells", "pc"),
    ("Hollow Knight", "Hollow Knight", "pc"),
    ("Silksong", "Silksong", "pc"),
    ("Celeste", "Celeste", "pc"),
    ("Stardew Valley", "Stardew Valley", "pc"),
    ("Terraria", "Terraria", "pc"),
    ("Valheim", "Valheim", "pc"),
    ("Grounded", "Grounded", "pc"),
    ("Enshrouded", "Enshrouded", "pc"),
    ("V Rising", "V Rising", "pc"),
    ("Sons of the Forest", "Sons of the Forest", "pc"),
    ("The Forest", "The Forest", "pc"),
    ("Green Hell", "Green Hell", "pc"),
    ("Subnautica", "Subnautica", "pc"),
    ("Subnautica Below Zero", "Below Zero", "pc"),
    ("No Man's Sky", "No Man's Sky", "pc"),
    ("Astroneer", "Astroneer", "pc"),
    ("Satisfactory", "Satisfactory", "pc"),
    ("Factorio", "Factorio", "pc"),
    ("Dyson Sphere Program", "Dyson Sphere", "pc"),
    ("RimWorld", "RimWorld", "pc"),
    ("Oxygen Not Included", "ONI", "pc"),
    ("Don't Starve Together", "DST", "pc"),
    ("Project Zomboid", "Project Zomboid", "pc"),
    ("7 Days to Die", "7 Days to Die", "pc"),
    ("DayZ", "DayZ", "pc"),
    ("SCUM", "SCUM", "pc"),
    ("Unturned", "Unturned", "pc"),
    ("Left 4 Dead 2", "L4D2", "pc"),
    ("Back 4 Blood", "Back 4 Blood", "pc"),
    ("Deep Rock Galactic", "Deep Rock", "pc"),
    ("Vermintide 2", "Vermintide", "pc"),
    ("Darktide", "Darktide", "pc"),
    ("Helldivers", "Helldivers", "pc"),
    ("Space Marine 2", "Space Marine 2", "pc"),
    ("Warhammer 40K", "Warhammer 40K", "pc"),
    ("Phasmophobia", "Phasmophobia", "pc"),
    ("Lethal Company", "Lethal Company", "pc"),
    ("Content Warning", "Content Warning", "pc"),
    ("PEAK", "PEAK", "pc"),
    ("R.E.P.O.", "REPO", "pc"),
    ("Schedule I", "Schedule I", "pc"),
    ("Escape the Backrooms", "Backrooms", "pc"),
    ("Among Us", "Among Us", "pc"),
    ("Fall Guys", "Fall Guys", "pc"),
    ("Gang Beasts", "Gang Beasts", "pc"),
    ("Human Fall Flat", "Human Fall Flat", "pc"),
    ("It Takes Two", "It Takes Two", "pc"),
    ("Split Fiction", "Split Fiction", "pc"),
    ("Overcooked 2", "Overcooked", "pc"),
    ("Moving Out", "Moving Out", "pc"),
    ("PlateUp", "PlateUp", "pc"),
    ("Party Animals", "Party Animals", "pc"),
    ("Multiversus", "Multiversus", "pc"),
    ("Smash Bros", "Smash Bros", "pc"),
    ("Tekken 8", "Tekken 8", "pc"),
    ("Street Fighter 6", "Street Fighter 6", "pc"),
    ("Mortal Kombat 1", "MK1", "pc"),
    ("Guilty Gear Strive", "Guilty Gear", "pc"),
    ("Brawlhalla", "Brawlhalla", "pc"),
    ("Nickelodeon All-Star Brawl", "Nick Brawl", "pc"),
    ("osu!", "osu", "pc"),
    ("Beat Saber", "Beat Saber", "pc"),
    ("VRChat", "VRChat", "pc"),
    ("Rec Room", "Rec Room", "pc"),
    ("ChilloutVR", "ChilloutVR", "pc"),
    ("Neos VR", "Neos", "pc"),
    ("Desktop Mate", "Desktop Mate", "pc"),
    ("Wallpaper Engine", "Wallpaper Engine", "pc"),
    ("Lively Wallpaper", "Lively", "pc"),
    ("Rainmeter", "Rainmeter", "pc"),
    ("Faceit", "Faceit", "pc"),
    ("ESEA", "ESEA", "pc"),
    ("GamersClub", "GamersClub", "pc"),
    ("War Thunder", "War Thunder", "pc"),
    ("World of Warships", "World of Warships", "pc"),
    ("World of Warplanes", "World of Warplanes", "pc"),
    ("Crossout", "Crossout", "pc"),
    ("Armored Warfare", "Armored Warfare", "pc"),
    ("Enlisted", "Enlisted", "pc"),
    ("Hell Let Loose", "Hell Let Loose", "pc"),
    ("Squad", "Squad", "pc"),
    ("Arma 3", "Arma 3", "pc"),
    ("Arma Reforger", "Arma Reforger", "pc"),
    ("Ready or Not", "Ready or Not", "pc"),
    ("Door Kickers", "Door Kickers", "pc"),
    ("Insurgency Sandstorm", "Insurgency", "pc"),
    ("Ground Branch", "Ground Branch", "pc"),
    ("Escape from Tarkov Arena", "Tarkov Arena", "pc"),
    ("Gray Zone Warfare", "Gray Zone", "pc"),
    ("Marauders", "Marauders", "pc"),
    ("Cycle Frontier", "Cycle Frontier", "pc"),
    ("Hunt Showdown 1896", "Hunt Showdown", "pc"),
    ("Dark and Darker", "Dark and Darker", "pc"),
    ("Dungeonborne", "Dungeonborne", "pc"),
    ("Wo Long", "Wo Long", "pc"),
    ("Nioh 2", "Nioh 2", "pc"),
    ("Lies of P", "Lies of P", "pc"),
    ("Sekiro", "Sekiro", "pc"),
    ("Bloodborne", "Bloodborne", "pc"),
    ("Demon's Souls", "Demons Souls", "pc"),
    ("Dark Souls 3", "Dark Souls 3", "pc"),
    ("Dark Souls Remastered", "Dark Souls", "pc"),
    ("Elden Ring Nightreign", "Nightreign", "pc"),
    ("Black Myth Wukong", "Black Myth Wukong", "pc"),
    ("Ghost of Tsushima", "Ghost of Tsushima", "pc"),
    ("Horizon Forbidden West", "Horizon", "pc"),
    ("God of War", "God of War", "pc"),
    ("God of War Ragnarok", "Ragnarok", "pc"),
    ("Spider-Man Remastered", "Spider-Man", "pc"),
    ("Spider-Man 2", "Spider-Man 2", "pc"),
    ("The Last of Us Part I", "The Last of Us", "pc"),
    ("The Last of Us Part II", "TLOU2", "pc"),
    ("Uncharted Legacy", "Uncharted", "pc"),
    ("Death Stranding", "Death Stranding", "pc"),
    ("Death Stranding 2", "Death Stranding 2", "pc"),
    ("Metal Gear Solid", "Metal Gear", "pc"),
    ("Resident Evil 4", "RE4", "pc"),
    ("Resident Evil Village", "RE Village", "pc"),
    ("Resident Evil 2", "RE2", "pc"),
    ("Silent Hill 2", "Silent Hill 2", "pc"),
    ("Alan Wake 2", "Alan Wake 2", "pc"),
    ("Control", "Control", "pc"),
    ("Quantum Break", "Quantum Break", "pc"),
    ("Max Payne 3", "Max Payne", "pc"),
    ("Red Dead Online", "RDO", "pc"),
    ("GTA Trilogy", "GTA Trilogy", "pc"),
    ("GTA 4", "GTA IV", "pc"),
    ("Saints Row", "Saints Row", "pc"),
    ("Watch Dogs 2", "Watch Dogs", "pc"),
    ("Sleeping Dogs", "Sleeping Dogs", "pc"),
    ("Mafia Definitive", "Mafia", "pc"),
    ("Mafia 3", "Mafia III", "pc"),
    ("Yakuza Like a Dragon", "Yakuza", "pc"),
    ("Like a Dragon Infinite Wealth", "Infinite Wealth", "pc"),
    ("Persona 5 Royal", "Persona 5", "pc"),
    ("Persona 3 Reload", "Persona 3", "pc"),
    ("Final Fantasy XIV", "FFXIV", "pc"),
    ("Final Fantasy XVI", "FFXVI", "pc"),
    ("Final Fantasy VII Remake", "FF7 Remake", "pc"),
    ("Dragon Quest XI", "Dragon Quest", "pc"),
    ("Monster Hunter World", "MHW", "pc"),
    ("Monster Hunter Wilds", "MH Wilds", "pc"),
    ("Monster Hunter Rise", "MH Rise", "pc"),
    ("Dark and Darker", "Dark and Darker", "pc"),
    ("New World Aeternum", "New World", "pc"),
    ("Throne and Liberty", "Throne and Liberty", "pc"),
    ("Black Desert Online", "BDO", "pc"),
    ("Lost Ark", "Lost Ark", "pc"),
    ("Guild Wars 2", "Guild Wars 2", "pc"),
    ("The Elder Scrolls Online", "ESO", "pc"),
    ("Fallout 76", "Fallout 76", "pc"),
    ("Fallout 4", "Fallout 4", "pc"),
    ("Skyrim", "Skyrim", "pc"),
    ("Oblivion Remastered", "Oblivion", "pc"),
    ("Starfield", "Starfield", "pc"),
    ("No Man's Sky", "No Man's Sky", "pc"),
    ("Elite Dangerous", "Elite Dangerous", "pc"),
    ("EVE Online", "EVE Online", "pc"),
    ("Star Citizen", "Star Citizen", "pc"),
    ("X4 Foundations", "X4", "pc"),
    ("Kerbal Space Program 2", "KSP2", "pc"),
    ("Kerbal Space Program", "KSP", "pc"),
    ("Planet Zoo", "Planet Zoo", "pc"),
    ("Planet Coaster", "Planet Coaster", "pc"),
    ("Jurassic World Evolution 2", "Jurassic World", "pc"),
    ("Two Point Museum", "Two Point", "pc"),
    ("Prison Architect", "Prison Architect", "pc"),
    ("Go-Karting", "Karting", "pc"),
    ("Trackmania", "Trackmania", "pc"),
    ("Rocket League Sideswipe", "Sideswipe", "pc"),
]


def parse_existing() -> tuple[list[dict], list[dict]]:
    text = ASSORTMENT_JS.read_text(encoding="utf-8")
    # HOME_TOP_14 block
    home = []
    m = re.search(r"export const HOME_TOP_14 = \[(.*?)\];", text, re.S)
    if m:
        for it in re.finditer(
            r"\{\s*name:\s*'((?:\\'|[^'])*)',\s*search:\s*'((?:\\'|[^'])*)',\s*icon:\s*'([^']+)',\s*kind:\s*'(\w+)'\s*\}",
            m.group(1),
        ):
            home.append(
                {
                    "name": it.group(1).replace("\\'", "'"),
                    "search": it.group(2).replace("\\'", "'"),
                    "icon": it.group(3),
                    "kind": it.group(4),
                }
            )
    all_items = []
    for it in re.finditer(
        r"\{\s*name:\s*'((?:\\'|[^'])*)',\s*search:\s*'((?:\\'|[^'])*)',\s*icon:\s*'([^']+)',\s*kind:\s*'(\w+)'\s*\}",
        text,
    ):
        all_items.append(
            {
                "name": it.group(1).replace("\\'", "'"),
                "search": it.group(2).replace("\\'", "'"),
                "icon": it.group(3),
                "kind": it.group(4),
            }
        )
    # Prefer unique by name (HOME appears twice in HOME+ASSORTMENT)
    seen = set()
    uniq = []
    for item in all_items:
        key = item["name"].lower()
        if key in seen:
            continue
        seen.add(key)
        uniq.append(item)
    return home, uniq


def steam_concurrent_names(limit: int = 250) -> list[tuple[str, str, str]]:
    out: list[tuple[str, str, str]] = []
    try:
        data = http_json(
            "https://api.steampowered.com/ISteamChartsService/GetGamesByConcurrentPlayers/v1/"
        )
        ranks = (data.get("response") or {}).get("ranks") or []
    except Exception as exc:  # noqa: BLE001
        print("steam concurrent fail:", exc)
        return out

    for row in ranks[:limit]:
        appid = row.get("appid")
        if not appid:
            continue
        try:
            details = http_json(
                f"https://store.steampowered.com/api/appdetails?appids={appid}&l=english"
            )
            payload = (details.get(str(appid)) or {})
            if not payload.get("success"):
                continue
            name = ((payload.get("data") or {}).get("name") or "").strip()
            if not name:
                continue
            # Short display name for marketplace tiles
            display = name
            if len(display) > 28:
                display = display[:27].rstrip() + "…"
            out.append((display, name, "pc"))
            time.sleep(0.12)
        except Exception as exc:  # noqa: BLE001
            print(f"  steam details {appid}: {exc}")
            continue
        if len(out) % 25 == 0:
            print(f"  steam resolved {len(out)}")
    return out


def steam_featured_names() -> list[tuple[str, str, str]]:
    out = []
    try:
        data = http_json("https://store.steampowered.com/api/featuredcategories/?cc=us&l=english")
    except Exception as exc:  # noqa: BLE001
        print("steam featured fail:", exc)
        return out
    for key in ("top_sellers", "new_releases", "specials", "coming_soon"):
        items = (data.get(key) or {}).get("items") or []
        for it in items:
            name = (it.get("name") or "").strip()
            if not name or name.lower().startswith("steam"):
                continue
            display = name if len(name) <= 28 else name[:27].rstrip() + "…"
            out.append((display, name, "pc"))
    return out


def normalize_key(name: str) -> str:
    return re.sub(r"[^a-z0-9а-я]+", "", name.lower().replace("ё", "е"))


def main():
    home, existing = parse_existing()
    print(f"existing unique={len(existing)} home={len(home)}")

    candidates: list[tuple[str, str, str]] = []
    candidates.extend((i["name"], i["search"], i["kind"]) for i in existing)
    candidates.extend(EXTRA_APPS)
    candidates.extend(EXTRA_MOBILE)
    candidates.extend(EXTRA_PC)
    print("fetching steam concurrent…")
    candidates.extend(steam_concurrent_names(280))
    print("fetching steam featured…")
    candidates.extend(steam_featured_names())

    # Deduplicate; keep first occurrence (preserves HOME / existing order)
    merged: list[dict] = []
    seen = set()
    for name, search, kind in candidates:
        if kind not in {"app", "mobile", "pc"}:
            continue
        key = normalize_key(name)
        if len(key) < 2 or key in seen:
            continue
        # also skip near-dup search collisions lightly
        seen.add(key)
        icon = f"/assortment/{slugify(name)}.png"
        # Prefer existing icon path if same name existed
        for old in existing:
            if normalize_key(old["name"]) == key:
                icon = old["icon"]
                name = old["name"]
                search = old["search"]
                kind = old["kind"]
                break
        merged.append({"name": name, "search": search, "icon": icon, "kind": kind})

    # Ensure HOME_TOP_14 are first in ASSORTMENT
    home_keys = {normalize_key(h["name"]) for h in home}
    rest = [i for i in merged if normalize_key(i["name"]) not in home_keys]
    # Stable kind grouping after home: apps, mobile, pc (Playerok-ish browsing)
    apps = [i for i in rest if i["kind"] == "app"]
    mobile = [i for i in rest if i["kind"] == "mobile"]
    pc = [i for i in rest if i["kind"] == "pc"]
    ordered = home + apps + mobile + pc

    print(
        f"total={len(ordered)} apps={len(home)+len(apps)} "
        f"(home apps in home) mobile={sum(1 for i in ordered if i['kind']=='mobile')} "
        f"pc={sum(1 for i in ordered if i['kind']=='pc')} app={sum(1 for i in ordered if i['kind']=='app')}"
    )

    def fmt_item(i: dict) -> str:
        return (
            "  { "
            f"name: '{esc(i['name'])}', "
            f"search: '{esc(i['search'])}', "
            f"icon: '{i['icon']}', "
            f"kind: '{i['kind']}' "
            "},"
        )

    home_block = "\n".join(fmt_item(i) for i in home)
    # Remaining without duplicating home
    rem = [i for i in ordered if normalize_key(i["name"]) not in home_keys]
    rem_block = "\n".join(fmt_item(i) for i in rem)

    content = f"""/** Fixed home carousel order (first 14) — do not reorder without product request */
export const HOME_TOP_14 = [
{home_block}
];

/** Playerok-style assortment: home top-14 first, then apps → mobile → PC */
export const ASSORTMENT = [
  ...HOME_TOP_14,
  // Expanded catalog ({len(rem)}+ items beyond home preview)
{rem_block}
];

export const ASSORTMENT_PREVIEW_COUNT = HOME_TOP_14.length;

export const ASSORTMENT_TABS = [
  {{ id: 'games', label: 'Игры' }},
  {{ id: 'mobile', label: 'Мобильные игры' }},
  {{ id: 'apps', label: 'Приложения' }},
];

/** All games = mobile + PC (not apps/services) */
export function assortmentByTab(tabId) {{
  if (tabId === 'apps') return ASSORTMENT.filter((i) => i.kind === 'app');
  if (tabId === 'mobile') return ASSORTMENT.filter((i) => i.kind === 'mobile');
  // games: absolutely all games
  return ASSORTMENT.filter((i) => i.kind === 'mobile' || i.kind === 'pc');
}}
"""
    ASSORTMENT_JS.write_text(content, encoding="utf-8")
    print("wrote", ASSORTMENT_JS, "items", len(ordered))


if __name__ == "__main__":
    main()
