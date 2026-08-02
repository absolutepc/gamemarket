import { LISTING_TYPE_OPTIONS } from './listingTypes';
import { resolveAssortmentItem } from './assortmentIcons';

/**
 * Allowed listing types by assortment kind.
 * Apps must not offer game-only sections like skins/currency.
 */
const TYPES_BY_KIND = {
  app: [
    'subscription',
    'account',
    'topup',
    'keys',
    'services',
    'media',
    'rental',
    'design',
    'training',
    'other',
  ],
  mobile: [
    'donate',
    'subscription',
    'account',
    'item',
    'topup',
    'currency',
    'skins',
    'boosting',
    'services',
    'game_account',
    'rental',
    'other',
  ],
  pc: [
    'donate',
    'account',
    'item',
    'topup',
    'keys',
    'currency',
    'game_account',
    'boosting',
    'services',
    'skins',
    'games',
    'rental',
    'mods',
    'other',
  ],
};

/** Game store / launcher platforms that are kind:app but sell game goods */
const GAME_PLATFORM_TYPES = [
  'donate',
  'subscription',
  'account',
  'item',
  'topup',
  'keys',
  'currency',
  'game_account',
  'boosting',
  'services',
  'skins',
  'games',
  'rental',
  'mods',
  'other',
];

const GAME_PLATFORM_NAMES = new Set([
  'nintendo',
  'origin',
  'gog',
  'riot',
  'valorant',
]);

/** Social / content apps — no game currency/skins */
const SOCIAL_APP_TYPES = [
  'subscription',
  'account',
  'topup',
  'services',
  'media',
  'rental',
  'other',
];

const SOCIAL_APP_NAMES = new Set([
  'discord',
]);

/** AI tools / нейросети — только 4 основных типа */
const AI_SERVICE_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

/** DeepSeek: вместо подписки — пополнение баланса */
const DEEPSEEK_TYPES = [
  'topup',
  'account',
  'services',
  'other',
];

/** Kling: базовые 4 типа ИИ + пополнение баланса */
const KLING_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
  'topup',
];

/** Suno */
const SUNO_TYPES = [
  'subscription',
  'topup',
  'account',
  'services',
  'other',
];

const SUNO_LABELS = {
  subscription: 'Подписки',
  topup: 'Пополнение баланса',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** Нейросети (общий каталог) */
const NEIROSETI_TYPES = [
  'subscription',
  'other',
  'account',
  'services',
  'topup',
];

const NEIROSETI_LABELS = {
  subscription: 'Подписка',
  other: 'Другое',
  account: 'Аккаунты',
  services: 'Услуги',
  topup: 'Пополнение баланса',
};

/** EA Play */
const EAPLAY_TYPES = [
  'subscription',
  'giftcard',
  'account',
  'other',
  'games',
  'services',
];

const EAPLAY_LABELS = {
  subscription: 'Подписка',
  giftcard: 'Подарочные карты',
  account: 'Аккаунты',
  other: 'Другое',
  games: 'Игры',
  services: 'Услуги',
};

/** Oculus Quest */
const OCULUS_QUEST_TYPES = [
  'services',
  'games',
  'topup',
  'account',
  'other',
];

const OCULUS_QUEST_LABELS = {
  services: 'Услуги',
  games: 'Игры',
  topup: 'Пополнение баланса',
  account: 'Аккаунты',
  other: 'Другое',
};

/** Microsoft Store */
const MICROSOFT_STORE_TYPES = [
  'license',
  'account',
  'other',
  'services',
  'games',
  'ubisoft_plus',
  'game_pass',
];

const MICROSOFT_STORE_LABELS = {
  license: 'Лицензии',
  account: 'Аккаунты',
  other: 'Другое',
  services: 'Услуги',
  games: 'Игры',
  ubisoft_plus: 'Ubisoft+',
  game_pass: 'Game Pass',
};

/** Likee */
const LIKEE_TYPES = [
  'diamonds',
  'services',
  'account',
  'superlikes',
  'advertising',
  'other',
  'beans',
];

const LIKEE_LABELS = {
  diamonds: 'Алмазы',
  services: 'Услуги',
  account: 'Аккаунты',
  superlikes: 'Суперлайки',
  advertising: 'Реклама',
  other: 'Другое',
  beans: 'Бобы',
};

/** FL Studio */
const FL_STUDIO_TYPES = [
  'other',
  'subscription',
  'services',
  'account',
  'donate',
];

const FL_STUDIO_LABELS = {
  other: 'Другое',
  subscription: 'Подписка',
  services: 'Услуги',
  account: 'Аккаунты',
  donate: 'Донат',
};

/** ElevenLabs */
const ELEVENLABS_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

const ELEVENLABS_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** GearUP */
const GEARUP_TYPES = [
  'subscription',
  'promocodes',
  'account',
  'services',
  'other',
];

const GEARUP_LABELS = {
  subscription: 'Подписка',
  promocodes: 'Промокоды',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** PolyBuzz */
const POLYBUZZ_TYPES = [
  'subscription',
  'coins',
  'account',
  'services',
  'other',
];

const POLYBUZZ_LABELS = {
  subscription: 'Подписки',
  coins: 'Монеты',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** Autodesk */
const AUTODESK_TYPES = [
  'other',
  'subscription',
  'plugins',
  'services',
];

const AUTODESK_LABELS = {
  other: 'Другое',
  subscription: 'Подписки',
  plugins: 'Плагины',
  services: 'Услуги',
};

/** Netflix */
const NETFLIX_TYPES = [
  'account',
  'subscription',
  'services',
  'giftcard',
  'other',
];

const NETFLIX_LABELS = {
  account: 'Аккаунты',
  subscription: 'Подписка',
  services: 'Услуги',
  giftcard: 'Подарочные карты',
  other: 'Другое',
};

/** Chai */
const CHAI_TYPES = [
  'subscription',
  'topup',
  'account',
  'services',
  'other',
];

const CHAI_LABELS = {
  subscription: 'Подписки',
  topup: 'Пополнение баланса',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** Zoom */
const ZOOM_TYPES = [
  'subscription',
  'account',
  'guides',
  'services',
  'other',
];

const ZOOM_LABELS = {
  subscription: 'Подписка',
  account: 'Аккаунты',
  guides: 'Руководства',
  services: 'Услуги',
  other: 'Другое',
};

/** ZEPETO */
const ZEPETO_TYPES = [
  'zems',
  'account',
  'packs',
  'services',
  'other',
  'coins',
  'rental',
];

const ZEPETO_LABELS = {
  zems: 'Земы',
  account: 'Аккаунты',
  packs: 'Наборы',
  services: 'Услуги',
  other: 'Другое',
  coins: 'Монеты',
  rental: 'Аренда',
};

/** Replit */
const REPLIT_TYPES = [
  'subscription',
  'services',
  'account',
  'other',
];

const REPLIT_LABELS = {
  subscription: 'Подписки',
  services: 'Услуги',
  account: 'Аккаунты',
  other: 'Другое',
};

/** Дизайн */
const DESIGN_CATALOG_TYPES = [
  'product_design',
  'images',
  'montage',
  'design_packs',
  'software',
  'other',
];

const DESIGN_CATALOG_LABELS = {
  product_design: 'Оформление товара',
  images: 'Изображения',
  montage: 'Видеомонтаж',
  design_packs: 'Паки для дизайна',
  software: 'Программы',
  other: 'Другое',
};

/** Voicemod */
const VOICEMOD_TYPES = [
  'keys',
  'account',
  'other',
  'services',
  'rental',
];

const VOICEMOD_LABELS = {
  keys: 'Ключи',
  account: 'Аккаунты',
  other: 'Другое',
  services: 'Услуги',
  rental: 'Аренда',
};

/** HeyGen */
const HEYGEN_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

const HEYGEN_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** Duolingo */
const DUOLINGO_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
  'promocodes',
];

const DUOLINGO_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
  promocodes: 'Промокод',
};

/** Razer Gold */
const RAZER_GOLD_TYPES = [
  'giftcard',
  'services',
  'other',
];

const RAZER_GOLD_LABELS = {
  giftcard: 'Подарочные карты',
  services: 'Услуги',
  other: 'Другое',
};

/** Splice */
const SPLICE_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

const SPLICE_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** GeoGuessr */
const GEOGUESSR_TYPES = [
  'subscription',
  'account',
  'coins',
  'services',
  'other',
];

const GEOGUESSR_LABELS = {
  subscription: 'Подписка',
  account: 'Аккаунты',
  coins: 'Монеты',
  services: 'Услуги',
  other: 'Другое',
};

/** Meshy */
const MESHY_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

const MESHY_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** Emochi */
const EMOCHI_TYPES = [
  'subscription',
  'mochi',
  'account',
  'services',
  'other',
];

const EMOCHI_LABELS = {
  subscription: 'Подписки',
  mochi: 'Mochi',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** Snapchat */
const SNAPCHAT_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
  'advertising',
];

const SNAPCHAT_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
  advertising: 'Реклама',
};

/** Figma */
const FIGMA_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

const FIGMA_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** TradingView */
const TRADINGVIEW_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

const TRADINGVIEW_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** JetBrains */
const JETBRAINS_TYPES = [
  'subscription',
  'topup',
  'account',
  'services',
  'other',
];

const JETBRAINS_LABELS = {
  subscription: 'Подписки',
  topup: 'Пополнение баланса',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** Higgsfield */
const HIGGSFIELD_TYPES = [
  'subscription',
  'topup',
  'account',
  'services',
  'other',
];

const HIGGSFIELD_LABELS = {
  subscription: 'Подписки',
  topup: 'Пополнение баланса',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** OpenRouter */
const OPENROUTER_TYPES = [
  'topup',
  'other',
  'services',
];

const OPENROUTER_LABELS = {
  topup: 'Пополнение баланса',
  other: 'Другое',
  services: 'Услуги',
};

/** Canva */
const CANVA_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

const CANVA_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** Ubisoft */
const UBISOFT_TYPES = [
  'clean_account',
  'game_account',
  'games',
  'services',
  'other',
  'ubisoft_plus',
  'rental',
];

const UBISOFT_LABELS = {
  clean_account: 'Чистые аккаунты',
  game_account: 'Аккаунты с играми',
  games: 'Игры',
  services: 'Услуги',
  other: 'Другое',
  ubisoft_plus: 'Ubisoft+',
  rental: 'Аренда',
};

/** Windsurf */
const WINDSURF_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

const WINDSURF_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** LagoFast */
const LAGOFAST_TYPES = [
  'subscription',
  'services',
  'other',
  'account',
];

const LAGOFAST_LABELS = {
  subscription: 'Подписки',
  services: 'Услуги',
  other: 'Другое',
  account: 'Аккаунты',
};

/** Lovable */
const LOVABLE_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

const LOVABLE_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** Epic Games */
const EPIC_GAMES_TYPES = [
  'game_account',
  'region_change',
  'clean_account',
  'topup',
  'games',
  'services',
  'other',
];

const EPIC_GAMES_LABELS = {
  game_account: 'Аккаунты с играми',
  region_change: 'Смена региона',
  clean_account: 'Чистые аккаунты',
  topup: 'Пополнение баланса',
  games: 'Игры',
  services: 'Услуги',
  other: 'Другое',
};

/** Notion */
const NOTION_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

const NOTION_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** Photoroom */
const PHOTOROOM_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

const PHOTOROOM_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** Picsart */
const PICSART_TYPES = [
  'subscription',
  'account',
  'topup',
  'services',
  'design',
  'other',
];

const PICSART_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  topup: 'Пополнение баланса',
  services: 'Услуги',
  design: 'Дизайн',
  other: 'Другое',
};

/** n8n */
const N8N_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

const N8N_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** Coursera */
const COURSERA_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

const COURSERA_LABELS = {
  subscription: 'Подписка',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** Tripo */
const TRIPO_TYPES = [
  'subscription',
  'topup',
  'account',
  'services',
  'other',
];

const TRIPO_LABELS = {
  subscription: 'Подписки',
  topup: 'Пополнение баланса',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** PixVerse */
const PIXVERSE_TYPES = [
  'subscription',
  'topup',
  'account',
  'services',
  'other',
];

const PIXVERSE_LABELS = {
  subscription: 'Подписки',
  topup: 'Пополнение баланса',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** Wallpaper Engine */
const WALLPAPER_ENGINE_TYPES = [
  'other',
  'account',
  'services',
  'keys',
];

const WALLPAPER_ENGINE_LABELS = {
  other: 'Другое',
  account: 'Аккаунты',
  services: 'Услуги',
  keys: 'Ключи',
};

/** TeamSpeak */
const TEAMSPEAK_TYPES = [
  'servers',
  'other',
  'account',
  'guides',
  'services',
];

const TEAMSPEAK_LABELS = {
  servers: 'Сервера',
  other: 'Другое',
  account: 'Аккаунты',
  guides: 'Руководства',
  services: 'Услуги',
};

/** Soundpad */
const SOUNDPAD_TYPES = [
  'other',
  'keys',
  'account',
  'services',
];

const SOUNDPAD_LABELS = {
  other: 'Другое',
  keys: 'Ключи',
  account: 'Аккаунты',
  services: 'Услуги',
};

/** Дзен */
const DZEN_TYPES = [
  'services',
  'channels',
  'other',
];

const DZEN_LABELS = {
  services: 'Услуги',
  channels: 'Каналы',
  other: 'Другое',
};

/** Ableton */
const ABLETON_TYPES = [
  'license',
  'plugins',
  'montage',
  'services',
  'other',
];

const ABLETON_LABELS = {
  license: 'Лицензия',
  plugins: 'Плагины',
  montage: 'Монтаж',
  services: 'Услуги',
  other: 'Другое',
};

/** OBS Studio */
const OBS_STUDIO_TYPES = [
  'other',
  'guides',
  'services',
  'account',
];

const OBS_STUDIO_LABELS = {
  other: 'Другое',
  guides: 'Руководства',
  services: 'Услуги',
  account: 'Аккаунты',
};

/** Clip Studio Paint */
const CLIP_STUDIO_PAINT_TYPES = [
  'other',
  'keys',
  'subscription',
  'gold',
  'services',
];

const CLIP_STUDIO_PAINT_LABELS = {
  other: 'Другое',
  keys: 'Ключи',
  subscription: 'Подписки',
  gold: 'GOLD',
  services: 'Услуги',
};

/** КранчРолл / Crunchyroll */
const CRUNCHYROLL_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

const CRUNCHYROLL_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** Tango Live */
const TANGO_LIVE_TYPES = [
  'coins',
  'services',
  'other',
];

const TANGO_LIVE_LABELS = {
  coins: 'Монеты',
  services: 'Услуги',
  other: 'Другое',
};

/**
 * Apple — разделы как на Playerok.
 * Порядок важен: так показываем в визарде.
 */
const APPLE_TYPES = [
  'giftcard',
  'game_account',
  'subscription',
  'clean_account',
  'other',
  'services',
  'region_change',
  'rental',
];

const APPLE_LABELS = {
  giftcard: 'Подарочные карты',
  game_account: 'Аккаунты с играми',
  subscription: 'Подписки',
  clean_account: 'Чистые аккаунты',
  other: 'Другое',
  services: 'Услуги',
  region_change: 'Смена региона',
  rental: 'Аренда',
};

/** Soundcloud */
const SOUNDCLOUD_TYPES = [
  'subscription',
  'other',
  'services',
  'account',
];

const SOUNDCLOUD_LABELS = {
  subscription: 'Подписки',
  other: 'Другое',
  services: 'Услуги',
  account: 'Аккаунты',
};

/** Spotify */
const SPOTIFY_TYPES = [
  'subscription',
  'mods',
  'account',
  'region_change',
  'other',
  'services',
];

const SPOTIFY_LABELS = {
  subscription: 'Подписка',
  mods: 'Моды',
  account: 'Аккаунты',
  region_change: 'Смена региона',
  other: 'Другое',
  services: 'Услуги',
};

/** Steam */
const STEAM_TYPES = [
  'topup',
  'games',
  'region_change',
  'game_account',
  'clean_account',
  'item',
  'services',
  'other',
  'steam_rewards',
  'rental',
];

const STEAM_LABELS = {
  topup: 'Пополнение баланса',
  games: 'Игры',
  region_change: 'Смена региона',
  game_account: 'Аккаунты с играми',
  clean_account: 'Чистые аккаунты',
  item: 'Предметы',
  services: 'Услуги',
  other: 'Другое',
  steam_rewards: 'Награды Steam',
  rental: 'Аренда',
};

/** Telegram */
const TELEGRAM_TYPES = [
  'stars',
  'premium',
  'nft_gifts',
  'services',
  'channels',
  'usernames',
  'other',
  'advertising',
  'rental',
  'bots',
  'mods',
  'groups',
  'boosting',
  'stickers',
  'design',
  'clickers',
];

const TELEGRAM_LABELS = {
  stars: 'Звезды',
  premium: 'Премиум',
  nft_gifts: 'Подарки (NFT)',
  services: 'Услуги',
  channels: 'Каналы',
  usernames: 'Юзернеймы',
  other: 'Другое',
  advertising: 'Реклама',
  rental: 'Аренда',
  bots: 'Боты',
  mods: 'Моды',
  groups: 'Группы',
  boosting: 'Бусты',
  stickers: 'Стикеры',
  design: 'Дизайн',
  clickers: 'Кликеры',
};

/** TikTok */
const TIKTOK_TYPES = [
  'coins',
  'account',
  'services',
  'promotion',
  'mods',
  'montage',
  'other',
  'advertising',
  'design',
  'subscription',
];

const TIKTOK_LABELS = {
  coins: 'Монеты',
  account: 'Аккаунты',
  services: 'Услуги',
  promotion: 'Продвижение',
  mods: 'Моды',
  montage: 'Монтаж',
  other: 'Другое',
  advertising: 'Реклама',
  design: 'Дизайн',
  subscription: 'Подписки',
};

/** PlayStation */
const PLAYSTATION_TYPES = [
  'topup',
  'ps_plus',
  'game_account',
  'games',
  'clean_account',
  'rental',
  'ea_play',
  'services',
  'other',
];

const PLAYSTATION_LABELS = {
  topup: 'Пополнение бумажника',
  ps_plus: 'PS Plus',
  game_account: 'Аккаунты с играми',
  games: 'Игры',
  clean_account: 'Чистые аккаунты',
  rental: 'Аренда',
  ea_play: 'EA Play',
  services: 'Услуги',
  other: 'Другое',
};

/** Xbox */
const XBOX_TYPES = [
  'game_pass',
  'topup',
  'games',
  'account',
  'clean_account',
  'services',
  'region_change',
  'other',
  'ubisoft_plus',
];

const XBOX_LABELS = {
  game_pass: 'Game Pass',
  topup: 'Пополнение баланса',
  games: 'Игры',
  account: 'Аккаунты',
  clean_account: 'Чистые аккаунты',
  services: 'Услуги',
  region_change: 'Смена региона',
  other: 'Другое',
  ubisoft_plus: 'Ubisoft+',
};

/** Google Play */
const GOOGLE_PLAY_TYPES = [
  'clean_account',
  'subscription',
  'giftcard',
  'games',
  'region_change',
  'game_account',
  'other',
  'services',
];

const GOOGLE_PLAY_LABELS = {
  clean_account: 'Чистые аккаунты',
  subscription: 'Подписки',
  giftcard: 'Подарочные карты',
  games: 'Игры',
  region_change: 'Смена региона',
  game_account: 'Аккаунты с играми',
  other: 'Другое',
  services: 'Услуги',
};

/** Battle.net */
const BATTLENET_TYPES = [
  'topup',
  'games',
  'region_change',
  'game_account',
  'services',
  'other',
];

const BATTLENET_LABELS = {
  topup: 'Пополнение баланса',
  games: 'Игры',
  region_change: 'Смена региона',
  game_account: 'Аккаунты с играми',
  services: 'Услуги',
  other: 'Другое',
};

/** Adobe */
const ADOBE_TYPES = [
  'other',
  'subscription',
  'license',
  'account',
  'services',
  'design',
];

const ADOBE_LABELS = {
  other: 'Другое',
  subscription: 'Подписка',
  license: 'Лицензия',
  account: 'Аккаунты',
  services: 'Услуги',
  design: 'Дизайн',
};

/** Faceit */
const FACEIT_TYPES = [
  'subscription',
  'services',
  'account',
  'rental',
  'boosting',
  'other',
];

const FACEIT_LABELS = {
  subscription: 'Подписка',
  services: 'Услуги',
  account: 'Аккаунты',
  rental: 'Аренда',
  boosting: 'Буст',
  other: 'Другое',
};

/** Rockstar Games */
const ROCKSTAR_TYPES = [
  'clean_account',
  'keys',
  'game_account',
  'services',
  'other',
  'rental',
  'boosting',
];

const ROCKSTAR_LABELS = {
  clean_account: 'Чистые аккаунты',
  keys: 'Ключи',
  game_account: 'Аккаунты с играми',
  services: 'Услуги',
  other: 'Другое',
  rental: 'Аренда',
  boosting: 'Буст',
};

/** Windows */
const WINDOWS_TYPES = [
  'license',
  'software',
  'other',
  'services',
];

const WINDOWS_LABELS = {
  license: 'Лицензия',
  software: 'Программное обеспечение',
  other: 'Другое',
  services: 'Услуги',
};

/** CapCut */
const CAPCUT_TYPES = [
  'subscription',
  'account',
  'other',
  'montage',
  'services',
  'rental',
];

const CAPCUT_LABELS = {
  subscription: 'Подписка',
  account: 'Аккаунты',
  other: 'Другое',
  montage: 'Монтаж',
  services: 'Услуги',
  rental: 'Аренда',
};

/** ВКонтакте */
const VKONTAKTE_TYPES = [
  'voices',
  'vk_music',
  'services',
  'vk_play',
  'advertising',
  'other',
  'gifts',
  'mods',
  'groups',
  'games',
  'bots',
];

const VKONTAKTE_LABELS = {
  voices: 'Голоса',
  vk_music: 'VK Music',
  services: 'Услуги',
  vk_play: 'VK Play',
  advertising: 'Реклама',
  other: 'Другое',
  gifts: 'Подарки',
  mods: 'Моды',
  groups: 'Группы',
  games: 'Игры',
  bots: 'Боты',
};

/** Twitch */
const TWITCH_TYPES = [
  'design',
  'subscription',
  'services',
  'advertising',
  'account',
  'other',
  'twitch_drops',
  'bits',
];

const TWITCH_LABELS = {
  design: 'Дизайн',
  subscription: 'Подписки',
  services: 'Услуги',
  advertising: 'Реклама',
  account: 'Аккаунты',
  other: 'Другое',
  twitch_drops: 'Twitch Drops',
  bits: 'Bits',
};

/** eSIM */
const ESIM_TYPES = [
  'tariff',
  'services',
  'topup',
  'other',
];

const ESIM_LABELS = {
  tariff: 'Тариф',
  services: 'Услуги',
  topup: 'Пополнение баланса',
  other: 'Другое',
};

/** ExitLag */
const EXITLAG_TYPES = [
  'subscription',
  'account',
  'services',
  'rental',
  'other',
];

const EXITLAG_LABELS = {
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  rental: 'Аренда',
  other: 'Другое',
};

/** Pax Historia */
const PAX_HISTORIA_TYPES = [
  'tokens',
  'subscription',
  'account',
  'services',
  'other',
];

const PAX_HISTORIA_LABELS = {
  tokens: 'Токены',
  subscription: 'Подписки',
  account: 'Аккаунты',
  services: 'Услуги',
  other: 'Другое',
};

/** YouTube */
const YOUTUBE_TYPES = [
  'premium',
  'channels',
  'mods',
  'services',
  'youtube_music',
  'advertising',
  'montage',
  'design',
  'other',
  'youtube_tv',
];

const YOUTUBE_LABELS = {
  premium: 'Премиум',
  channels: 'Каналы',
  mods: 'Моды',
  services: 'Услуги',
  youtube_music: 'YouTube Music',
  advertising: 'Реклама',
  montage: 'Монтаж',
  design: 'Дизайн',
  other: 'Другое',
  youtube_tv: 'YouTube TV',
};

const AI_SERVICE_NAMES = new Set([
  'cursor',
  'claude',
  'чатгпт',
  'chatgpt',
  'grok',
  'gemini (nano banana)',
  'gemini',
  'kimi',
  'perplexity',
  'runway',
  'deepseek',
  'midjourney',
  'character ai',
  'gamma',
  'copilot',
  'leonardo ai',
  'openai',
  'kling',
]);

const AI_NAME_RE = /\b(ai|gpt|claude|cursor|gemini|grok|kimi|llm|нейро|kling)\b|чатгпт|midjourney|perplexity|deepseek|runway|copilot|leonardo|character\.?\s*ai/i;

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim();
}

function isDeepSeek(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'deepseek' || n.startsWith('deepseek ') || s.includes('deepseek');
}

function isKling(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'kling' || n.startsWith('kling ') || s.includes('kling');
}

function isSuno(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'suno' || n.startsWith('suno ') || s.includes('suno');
}

function isNeiroseti(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'нейросети'
    || n.startsWith('нейросети ')
    || s.includes('нейросети')
  );
}

function isEaplay(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'ea play'
    || n === 'eaplay'
    || n.startsWith('ea play ')
    || s.includes('ea play')
    || s.includes('eaplay')
  );
}

function isOculusQuest(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'oculus quest'
    || n === 'oculus'
    || n === 'meta quest'
    || n.startsWith('oculus ')
    || n.startsWith('meta quest ')
    || s.includes('oculus')
    || s.includes('meta quest')
  );
}

function isMicrosoftStore(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'microsoft store'
    || n.startsWith('microsoft store ')
    || s.includes('microsoft store')
  );
}

function isLikee(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'likee' || n.startsWith('likee ') || s.includes('likee');
}

function isFlStudio(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'fl studio'
    || n === 'flstudio'
    || n.startsWith('fl studio ')
    || s.includes('fl studio')
    || s.includes('flstudio')
  );
}

function isElevenlabs(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'elevenlabs'
    || n === 'eleven labs'
    || n.startsWith('elevenlabs ')
    || n.startsWith('eleven labs ')
    || s.includes('elevenlabs')
    || s.includes('eleven labs')
  );
}

function isGearup(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'gearup'
    || n === 'gear up'
    || n.startsWith('gearup ')
    || n.startsWith('gear up ')
    || s.includes('gearup')
    || s.includes('gear up')
  );
}

function isPolybuzz(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'polybuzz'
    || n === 'poly buzz'
    || n.startsWith('polybuzz ')
    || s.includes('polybuzz')
    || s.includes('poly buzz')
  );
}

function isAutodesk(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'autodesk' || n.startsWith('autodesk ') || s.includes('autodesk');
}

function isNetflix(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'netflix' || n.startsWith('netflix ') || s.includes('netflix');
}

function isChai(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'chai'
    || n === 'chai ai'
    || n.startsWith('chai ')
    || s.includes('chai ai')
    || (s.includes('chai') && s.includes('ai'))
  );
}

function isZoom(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'zoom' || n.startsWith('zoom ') || s.includes('zoom');
}

function isZepeto(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'zepeto'
    || n === 'zapeto'
    || n.startsWith('zepeto ')
    || n.startsWith('zapeto ')
    || s.includes('zepeto')
    || s.includes('zapeto')
  );
}

function isReplit(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'replit' || n.startsWith('replit ') || s.includes('replit');
}

function isDesignCatalog(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'дизайн' || n.startsWith('дизайн ') || s === 'дизайн';
}

function isVoicemod(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'voicemod' || n.startsWith('voicemod ') || s.includes('voicemod');
}

function isHeygen(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'heygen'
    || n === 'hey gen'
    || n.startsWith('heygen ')
    || s.includes('heygen')
    || s.includes('hey gen')
  );
}

function isDuolingo(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'duolingo' || n.startsWith('duolingo ') || s.includes('duolingo');
}

function isRazerGold(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'razer gold'
    || n.startsWith('razer gold ')
    || s.includes('razer gold')
  );
}

function isSplice(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'splice' || n.startsWith('splice ') || s.includes('splice');
}

function isGeoguessr(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'geoguessr'
    || n.startsWith('geoguessr ')
    || s.includes('geoguessr')
  );
}

function isMeshy(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'meshy' || n.startsWith('meshy ') || s.includes('meshy');
}

function isEmochi(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'emochi' || n.startsWith('emochi ') || s.includes('emochi');
}

function isSnapchat(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'snapchat' || n.startsWith('snapchat ') || s.includes('snapchat');
}

function isFigma(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'figma' || n.startsWith('figma ') || s.includes('figma');
}

function isTradingview(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'tradingview'
    || n === 'trading view'
    || n.startsWith('tradingview ')
    || s.includes('tradingview')
    || s.includes('trading view')
  );
}

function isJetbrains(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'jetbrains'
    || n === 'jet brains'
    || n.startsWith('jetbrains ')
    || s.includes('jetbrains')
    || s.includes('jet brains')
  );
}

function isHiggsfield(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'higgsfield'
    || n.startsWith('higgsfield ')
    || s.includes('higgsfield')
  );
}

function isOpenrouter(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'openrouter'
    || n === 'open router'
    || n.startsWith('openrouter ')
    || s.includes('openrouter')
    || s.includes('open router')
  );
}

function isCanva(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'canva' || n.startsWith('canva ') || s.includes('canva');
}

function isUbisoft(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'ubisoft' || n.startsWith('ubisoft ') || s.includes('ubisoft');
}

function isWindsurf(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'windsurf' || n.startsWith('windsurf ') || s.includes('windsurf');
}

function isLagofast(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'lagofast'
    || n === 'lago fast'
    || n.startsWith('lagofast ')
    || s.includes('lagofast')
    || s.includes('lago fast')
  );
}

function isLovable(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'lovable' || n.startsWith('lovable ') || s.includes('lovable');
}

function isEpicGames(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'epic games'
    || n === 'epicgames'
    || n.startsWith('epic games ')
    || s.includes('epic games')
    || s.includes('epicgames')
  );
}

function isNotion(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'notion' || n.startsWith('notion ') || s.includes('notion');
}

function isPhotoroom(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'photoroom'
    || n === 'photo room'
    || n.startsWith('photoroom ')
    || s.includes('photoroom')
    || s.includes('photo room')
  );
}

function isPicsart(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'picsart' || n.startsWith('picsart ') || s.includes('picsart');
}

function isN8n(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'n8n' || n.startsWith('n8n ') || s.includes('n8n');
}

function isCoursera(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'coursera' || n.startsWith('coursera ') || s.includes('coursera');
}

function isTripo(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'tripo'
    || n === 'tripo ai'
    || n.startsWith('tripo ')
    || s.includes('tripo')
  );
}

function isPixverse(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'pixverse'
    || n.startsWith('pixverse ')
    || s.includes('pixverse')
  );
}

function isWallpaperEngine(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'wallpaper engine'
    || n.startsWith('wallpaper engine ')
    || s.includes('wallpaper engine')
  );
}

function isTeamspeak(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'teamspeak'
    || n === 'team speak'
    || n.startsWith('teamspeak ')
    || s.includes('teamspeak')
    || s.includes('team speak')
  );
}

function isSoundpad(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'soundpad' || n.startsWith('soundpad ') || s.includes('soundpad');
}

function isDzen(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'дзен' || n === 'dzen' || n.startsWith('дзен ') || s === 'дзен' || s.includes('dzen');
}

function isAbleton(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'ableton' || n.startsWith('ableton ') || s.includes('ableton');
}

function isObsStudio(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'obs studio'
    || n === 'obs'
    || n.startsWith('obs studio ')
    || s.includes('obs studio')
  );
}

function isClipStudioPaint(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'clip studio paint'
    || n === 'clip studio'
    || n.startsWith('clip studio ')
    || s.includes('clip studio')
  );
}

function isCrunchyroll(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'кранчролл'
    || n === 'crunchyroll'
    || n.startsWith('кранчролл ')
    || n.startsWith('crunchyroll ')
    || s.includes('crunchyroll')
    || s.includes('кранчролл')
  );
}

function isTangoLive(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'tango live'
    || n === 'tango'
    || n.startsWith('tango live ')
    || s.includes('tango live')
  );
}

function isApple(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'apple' || n.startsWith('apple ') || s.includes('apple') || n === 'app store';
}

function isSoundcloud(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'soundcloud' || n.startsWith('soundcloud ') || s.includes('soundcloud');
}

function isSpotify(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'spotify' || n.startsWith('spotify ') || s.includes('spotify');
}

function isSteam(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'steam' || n.startsWith('steam ') || s.includes('steam');
}

function isTelegram(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'telegram' || n.startsWith('telegram ') || s.includes('telegram');
}

function isTiktok(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'tiktok' || n.startsWith('tiktok ') || s.includes('tiktok');
}

function isPlaystation(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'playstation'
    || n.startsWith('playstation ')
    || n === 'ps5'
    || n === 'ps4'
    || n === 'psn'
    || s.includes('playstation')
  );
}

function isXbox(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'xbox' || n.startsWith('xbox ') || s.includes('xbox');
}

function isGooglePlay(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'google play'
    || n === 'googleplay'
    || n.startsWith('google play ')
    || s.includes('google play')
    || s.includes('googleplay')
  );
}

function isBattlenet(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'battle.net'
    || n === 'battlenet'
    || n === 'battle net'
    || n.startsWith('battle.net ')
    || n.startsWith('battlenet ')
    || s.includes('battle.net')
    || s.includes('battlenet')
  );
}

function isAdobe(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'adobe' || n.startsWith('adobe ') || s.includes('adobe');
}

function isFaceit(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'faceit' || n.startsWith('faceit ') || s.includes('faceit');
}

function isRockstar(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'rockstar games'
    || n === 'rockstar'
    || n.startsWith('rockstar ')
    || s.includes('rockstar')
  );
}

function isWindows(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'windows' || n.startsWith('windows ') || s.includes('windows');
}

function isCapcut(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'capcut' || n.startsWith('capcut ') || s.includes('capcut');
}

function isVkontakte(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'вконтакте'
    || n === 'vk'
    || n === 'vkontakte'
    || n.startsWith('вконтакте ')
    || n.startsWith('vk ')
    || s.includes('вконтакте')
    || s.includes('vkontakte')
  );
}

function isTwitch(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'twitch' || n.startsWith('twitch ') || s.includes('twitch');
}

function isEsim(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'esim' || n === 'e-sim' || n.startsWith('esim ') || s.includes('esim');
}

function isExitlag(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'exitlag' || n.startsWith('exitlag ') || s.includes('exitlag');
}

function isPaxHistoria(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'pax historia'
    || n === 'paxhistoria'
    || n.startsWith('pax historia ')
    || s.includes('pax historia')
    || s.includes('paxhistoria')
  );
}

function isYoutube(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'youtube' || n.startsWith('youtube ') || s.includes('youtube');
}

function isAiService(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  if (AI_SERVICE_NAMES.has(n)) return true;
  if ([...AI_SERVICE_NAMES].some((x) => n === x || n.startsWith(`${x} `))) return true;
  return AI_NAME_RE.test(n) || AI_NAME_RE.test(s);
}

/**
 * Returns listing type values allowed for a selected assortment name/item.
 * Order is preserved for UI.
 */
export function allowedListingTypesForAssortment(gameOrItem) {
  const item = typeof gameOrItem === 'string'
    ? resolveAssortmentItem(gameOrItem)
    : gameOrItem;

  const name = normalizeName(item?.name || gameOrItem);
  const kind = item?.kind || 'app';

  if (isPlaystation(item?.name || name, item?.search)) {
    return PLAYSTATION_TYPES;
  }
  if (isXbox(item?.name || name, item?.search)) {
    return XBOX_TYPES;
  }
  if (isGooglePlay(item?.name || name, item?.search)) {
    return GOOGLE_PLAY_TYPES;
  }
  if (isBattlenet(item?.name || name, item?.search)) {
    return BATTLENET_TYPES;
  }
  if (isAdobe(item?.name || name, item?.search)) {
    return ADOBE_TYPES;
  }
  if (isFaceit(item?.name || name, item?.search)) {
    return FACEIT_TYPES;
  }
  if (isRockstar(item?.name || name, item?.search)) {
    return ROCKSTAR_TYPES;
  }
  if (isWindows(item?.name || name, item?.search)) {
    return WINDOWS_TYPES;
  }
  if (isCapcut(item?.name || name, item?.search)) {
    return CAPCUT_TYPES;
  }
  if (isVkontakte(item?.name || name, item?.search)) {
    return VKONTAKTE_TYPES;
  }
  if (isTwitch(item?.name || name, item?.search)) {
    return TWITCH_TYPES;
  }
  if (isEsim(item?.name || name, item?.search)) {
    return ESIM_TYPES;
  }
  if (isExitlag(item?.name || name, item?.search)) {
    return EXITLAG_TYPES;
  }
  if (isPaxHistoria(item?.name || name, item?.search)) {
    return PAX_HISTORIA_TYPES;
  }
  if (isYoutube(item?.name || name, item?.search)) {
    return YOUTUBE_TYPES;
  }
  if (isTelegram(item?.name || name, item?.search)) {
    return TELEGRAM_TYPES;
  }
  if (isTiktok(item?.name || name, item?.search)) {
    return TIKTOK_TYPES;
  }
  if (isSteam(item?.name || name, item?.search)) {
    return STEAM_TYPES;
  }
  if (isApple(item?.name || name, item?.search)) {
    return APPLE_TYPES;
  }
  if (isSpotify(item?.name || name, item?.search)) {
    return SPOTIFY_TYPES;
  }
  if (isSoundcloud(item?.name || name, item?.search)) {
    return SOUNDCLOUD_TYPES;
  }
  if (GAME_PLATFORM_NAMES.has(name) || [...GAME_PLATFORM_NAMES].some((n) => name.includes(n))) {
    return GAME_PLATFORM_TYPES;
  }
  if (isDeepSeek(item?.name || name, item?.search)) {
    return DEEPSEEK_TYPES;
  }
  if (isKling(item?.name || name, item?.search)) {
    return KLING_TYPES;
  }
  if (isSuno(item?.name || name, item?.search)) {
    return SUNO_TYPES;
  }
  if (isNeiroseti(item?.name || name, item?.search)) {
    return NEIROSETI_TYPES;
  }
  if (isEaplay(item?.name || name, item?.search)) {
    return EAPLAY_TYPES;
  }
  if (isOculusQuest(item?.name || name, item?.search)) {
    return OCULUS_QUEST_TYPES;
  }
  if (isMicrosoftStore(item?.name || name, item?.search)) {
    return MICROSOFT_STORE_TYPES;
  }
  if (isLikee(item?.name || name, item?.search)) {
    return LIKEE_TYPES;
  }
  if (isFlStudio(item?.name || name, item?.search)) {
    return FL_STUDIO_TYPES;
  }
  if (isElevenlabs(item?.name || name, item?.search)) {
    return ELEVENLABS_TYPES;
  }
  if (isGearup(item?.name || name, item?.search)) {
    return GEARUP_TYPES;
  }
  if (isPolybuzz(item?.name || name, item?.search)) {
    return POLYBUZZ_TYPES;
  }
  if (isAutodesk(item?.name || name, item?.search)) {
    return AUTODESK_TYPES;
  }
  if (isNetflix(item?.name || name, item?.search)) {
    return NETFLIX_TYPES;
  }
  if (isChai(item?.name || name, item?.search)) {
    return CHAI_TYPES;
  }
  if (isZoom(item?.name || name, item?.search)) {
    return ZOOM_TYPES;
  }
  if (isZepeto(item?.name || name, item?.search)) {
    return ZEPETO_TYPES;
  }
  if (isReplit(item?.name || name, item?.search)) {
    return REPLIT_TYPES;
  }
  if (isDesignCatalog(item?.name || name, item?.search)) {
    return DESIGN_CATALOG_TYPES;
  }
  if (isVoicemod(item?.name || name, item?.search)) {
    return VOICEMOD_TYPES;
  }
  if (isHeygen(item?.name || name, item?.search)) {
    return HEYGEN_TYPES;
  }
  if (isDuolingo(item?.name || name, item?.search)) {
    return DUOLINGO_TYPES;
  }
  if (isRazerGold(item?.name || name, item?.search)) {
    return RAZER_GOLD_TYPES;
  }
  if (isSplice(item?.name || name, item?.search)) {
    return SPLICE_TYPES;
  }
  if (isGeoguessr(item?.name || name, item?.search)) {
    return GEOGUESSR_TYPES;
  }
  if (isMeshy(item?.name || name, item?.search)) {
    return MESHY_TYPES;
  }
  if (isEmochi(item?.name || name, item?.search)) {
    return EMOCHI_TYPES;
  }
  if (isSnapchat(item?.name || name, item?.search)) {
    return SNAPCHAT_TYPES;
  }
  if (isFigma(item?.name || name, item?.search)) {
    return FIGMA_TYPES;
  }
  if (isTradingview(item?.name || name, item?.search)) {
    return TRADINGVIEW_TYPES;
  }
  if (isJetbrains(item?.name || name, item?.search)) {
    return JETBRAINS_TYPES;
  }
  if (isHiggsfield(item?.name || name, item?.search)) {
    return HIGGSFIELD_TYPES;
  }
  if (isOpenrouter(item?.name || name, item?.search)) {
    return OPENROUTER_TYPES;
  }
  if (isCanva(item?.name || name, item?.search)) {
    return CANVA_TYPES;
  }
  if (isUbisoft(item?.name || name, item?.search)) {
    return UBISOFT_TYPES;
  }
  if (isWindsurf(item?.name || name, item?.search)) {
    return WINDSURF_TYPES;
  }
  if (isLagofast(item?.name || name, item?.search)) {
    return LAGOFAST_TYPES;
  }
  if (isLovable(item?.name || name, item?.search)) {
    return LOVABLE_TYPES;
  }
  if (isEpicGames(item?.name || name, item?.search)) {
    return EPIC_GAMES_TYPES;
  }
  if (isNotion(item?.name || name, item?.search)) {
    return NOTION_TYPES;
  }
  if (isPhotoroom(item?.name || name, item?.search)) {
    return PHOTOROOM_TYPES;
  }
  if (isPicsart(item?.name || name, item?.search)) {
    return PICSART_TYPES;
  }
  if (isN8n(item?.name || name, item?.search)) {
    return N8N_TYPES;
  }
  if (isCoursera(item?.name || name, item?.search)) {
    return COURSERA_TYPES;
  }
  if (isTripo(item?.name || name, item?.search)) {
    return TRIPO_TYPES;
  }
  if (isPixverse(item?.name || name, item?.search)) {
    return PIXVERSE_TYPES;
  }
  if (isWallpaperEngine(item?.name || name, item?.search)) {
    return WALLPAPER_ENGINE_TYPES;
  }
  if (isTeamspeak(item?.name || name, item?.search)) {
    return TEAMSPEAK_TYPES;
  }
  if (isSoundpad(item?.name || name, item?.search)) {
    return SOUNDPAD_TYPES;
  }
  if (isDzen(item?.name || name, item?.search)) {
    return DZEN_TYPES;
  }
  if (isAbleton(item?.name || name, item?.search)) {
    return ABLETON_TYPES;
  }
  if (isObsStudio(item?.name || name, item?.search)) {
    return OBS_STUDIO_TYPES;
  }
  if (isClipStudioPaint(item?.name || name, item?.search)) {
    return CLIP_STUDIO_PAINT_TYPES;
  }
  if (isCrunchyroll(item?.name || name, item?.search)) {
    return CRUNCHYROLL_TYPES;
  }
  if (isTangoLive(item?.name || name, item?.search)) {
    return TANGO_LIVE_TYPES;
  }
  if (isAiService(item?.name || name, item?.search)) {
    return AI_SERVICE_TYPES;
  }
  if (SOCIAL_APP_NAMES.has(name)) {
    return SOCIAL_APP_TYPES;
  }

  return TYPES_BY_KIND[kind] || TYPES_BY_KIND.app;
}

/** LISTING_TYPE_OPTIONS filtered for the selected game/app (keeps allowed order) */
export function listingTypeOptionsForAssortment(gameOrItem) {
  const allowed = allowedListingTypesForAssortment(gameOrItem);
  const byValue = Object.fromEntries(LISTING_TYPE_OPTIONS.map((o) => [o.value, o]));
  const itemName = typeof gameOrItem === 'string' ? gameOrItem : gameOrItem?.name;
  const itemSearch = typeof gameOrItem === 'object' ? gameOrItem?.search : '';
  const labelMap =
    (isPlaystation(itemName, itemSearch) && PLAYSTATION_LABELS)
    ||     (isXbox(itemName, itemSearch) && XBOX_LABELS)
    || (isGooglePlay(itemName, itemSearch) && GOOGLE_PLAY_LABELS)
    || (isBattlenet(itemName, itemSearch) && BATTLENET_LABELS)
    || (isAdobe(itemName, itemSearch) && ADOBE_LABELS)
    || (isFaceit(itemName, itemSearch) && FACEIT_LABELS)
    || (isRockstar(itemName, itemSearch) && ROCKSTAR_LABELS)
    || (isWindows(itemName, itemSearch) && WINDOWS_LABELS)
    || (isCapcut(itemName, itemSearch) && CAPCUT_LABELS)
    || (isVkontakte(itemName, itemSearch) && VKONTAKTE_LABELS)
    || (isTwitch(itemName, itemSearch) && TWITCH_LABELS)
    || (isEsim(itemName, itemSearch) && ESIM_LABELS)
    || (isExitlag(itemName, itemSearch) && EXITLAG_LABELS)
    || (isPaxHistoria(itemName, itemSearch) && PAX_HISTORIA_LABELS)
    || (isYoutube(itemName, itemSearch) && YOUTUBE_LABELS)
    || (isTelegram(itemName, itemSearch) && TELEGRAM_LABELS)
    || (isTiktok(itemName, itemSearch) && TIKTOK_LABELS)
    || (isSteam(itemName, itemSearch) && STEAM_LABELS)
    || (isApple(itemName, itemSearch) && APPLE_LABELS)
    || (isSpotify(itemName, itemSearch) && SPOTIFY_LABELS)
    || (isSoundcloud(itemName, itemSearch) && SOUNDCLOUD_LABELS)
    || (isSuno(itemName, itemSearch) && SUNO_LABELS)
    || (isNeiroseti(itemName, itemSearch) && NEIROSETI_LABELS)
    || (isEaplay(itemName, itemSearch) && EAPLAY_LABELS)
    || (isOculusQuest(itemName, itemSearch) && OCULUS_QUEST_LABELS)
    || (isMicrosoftStore(itemName, itemSearch) && MICROSOFT_STORE_LABELS)
    || (isLikee(itemName, itemSearch) && LIKEE_LABELS)
    || (isFlStudio(itemName, itemSearch) && FL_STUDIO_LABELS)
    || (isElevenlabs(itemName, itemSearch) && ELEVENLABS_LABELS)
    || (isGearup(itemName, itemSearch) && GEARUP_LABELS)
    || (isPolybuzz(itemName, itemSearch) && POLYBUZZ_LABELS)
    || (isAutodesk(itemName, itemSearch) && AUTODESK_LABELS)
    || (isNetflix(itemName, itemSearch) && NETFLIX_LABELS)
    || (isChai(itemName, itemSearch) && CHAI_LABELS)
    || (isZoom(itemName, itemSearch) && ZOOM_LABELS)
    || (isZepeto(itemName, itemSearch) && ZEPETO_LABELS)
    || (isReplit(itemName, itemSearch) && REPLIT_LABELS)
    || (isDesignCatalog(itemName, itemSearch) && DESIGN_CATALOG_LABELS)
    || (isVoicemod(itemName, itemSearch) && VOICEMOD_LABELS)
    || (isHeygen(itemName, itemSearch) && HEYGEN_LABELS)
    || (isDuolingo(itemName, itemSearch) && DUOLINGO_LABELS)
    || (isRazerGold(itemName, itemSearch) && RAZER_GOLD_LABELS)
    || (isSplice(itemName, itemSearch) && SPLICE_LABELS)
    || (isGeoguessr(itemName, itemSearch) && GEOGUESSR_LABELS)
    || (isMeshy(itemName, itemSearch) && MESHY_LABELS)
    || (isEmochi(itemName, itemSearch) && EMOCHI_LABELS)
    || (isSnapchat(itemName, itemSearch) && SNAPCHAT_LABELS)
    || (isFigma(itemName, itemSearch) && FIGMA_LABELS)
    || (isTradingview(itemName, itemSearch) && TRADINGVIEW_LABELS)
    || (isJetbrains(itemName, itemSearch) && JETBRAINS_LABELS)
    || (isHiggsfield(itemName, itemSearch) && HIGGSFIELD_LABELS)
    || (isOpenrouter(itemName, itemSearch) && OPENROUTER_LABELS)
    || (isCanva(itemName, itemSearch) && CANVA_LABELS)
    || (isUbisoft(itemName, itemSearch) && UBISOFT_LABELS)
    || (isWindsurf(itemName, itemSearch) && WINDSURF_LABELS)
    || (isLagofast(itemName, itemSearch) && LAGOFAST_LABELS)
    || (isLovable(itemName, itemSearch) && LOVABLE_LABELS)
    || (isEpicGames(itemName, itemSearch) && EPIC_GAMES_LABELS)
    || (isNotion(itemName, itemSearch) && NOTION_LABELS)
    || (isPhotoroom(itemName, itemSearch) && PHOTOROOM_LABELS)
    || (isPicsart(itemName, itemSearch) && PICSART_LABELS)
    || (isN8n(itemName, itemSearch) && N8N_LABELS)
    || (isCoursera(itemName, itemSearch) && COURSERA_LABELS)
    || (isTripo(itemName, itemSearch) && TRIPO_LABELS)
    || (isPixverse(itemName, itemSearch) && PIXVERSE_LABELS)
    || (isWallpaperEngine(itemName, itemSearch) && WALLPAPER_ENGINE_LABELS)
    || (isTeamspeak(itemName, itemSearch) && TEAMSPEAK_LABELS)
    || (isSoundpad(itemName, itemSearch) && SOUNDPAD_LABELS)
    || (isDzen(itemName, itemSearch) && DZEN_LABELS)
    || (isAbleton(itemName, itemSearch) && ABLETON_LABELS)
    || (isObsStudio(itemName, itemSearch) && OBS_STUDIO_LABELS)
    || (isClipStudioPaint(itemName, itemSearch) && CLIP_STUDIO_PAINT_LABELS)
    || (isCrunchyroll(itemName, itemSearch) && CRUNCHYROLL_LABELS)
    || (isTangoLive(itemName, itemSearch) && TANGO_LIVE_LABELS)
    || null;

  return allowed
    .filter((value) => Boolean(byValue[value]))
    .map((value) => ({
      value,
      label: (labelMap && labelMap[value]) || byValue[value].label,
    }));
}
