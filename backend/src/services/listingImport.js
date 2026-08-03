/**
 * Seller listing import — map external marketplace items into Lootz drafts.
 * Playerok live scrape is often blocked (DDoS-Guard); primary path is seller-provided
 * JSON/CSV of their own public listings + optional profile URL for attribution.
 */

const MAX_IMPORT = 50;

const TYPE_KEYWORDS = [
  ['subscription', [
    /подписк/i,
    /subscription/i,
    /premium/i,
    /ps\s*plus/i,
    /game\s*pass/i,
    /\bpro\s*plus\b/i,
    /\bpro\+\b/i,
    /\b\d+\s*(мес|месяц|дн|день|год)/i,
  ]],
  ['donate', [/донат/i, /donate/i]],
  ['topup', [/пополнен/i, /top[\s-]?up/i, /баланс/i]],
  ['currency', [/валют/i, /coins?/i, /гколд|gcoin|uc\b|robux|v-?bucks/i]],
  ['skins', [/скин/i, /skin/i]],
  ['keys', [/ключ/i, /\bkey\b/i, /gift\s*card/i, /карта/i]],
  ['boosting', [/буст/i, /boost/i, /прокачк/i]],
  ['account', [/аккаунт/i, /account/i, /акк\b/i]],
  ['game_account', [/аккаунт.*игр|игр.*аккаунт/i]],
  ['item', [/предмет/i, /item/i]],
  ['services', [/услуг/i, /service/i]],
  ['stars', [/звезд/i, /stars?/i]],
];

function guessListingType(item) {
  const explicit = String(item.listing_type || item.type || '').trim();
  if (explicit) return explicit;
  const hay = [
    item.category,
    item.category_name,
    item.game,
    item.title,
    item.description,
  ]
    .filter(Boolean)
    .join(' ');
  for (const [type, patterns] of TYPE_KEYWORDS) {
    if (patterns.some((re) => re.test(hay))) return type;
  }
  return 'other';
}

/** Infer Playerok-style subscription chips from title/description */
function guessSubscriptionAttributes(title, description = '') {
  const hay = `${title || ''} ${description || ''}`;
  let duration = null;
  if (/1\s*год|12\s*мес|one\s*year|\b1\s*year\b/i.test(hay)) duration = '1 год';
  else if (/6\s*мес|полгода|6\s*month/i.test(hay)) duration = '6 месяцев';
  else if (/3\s*мес|3\s*month/i.test(hay)) duration = '3 месяца';
  else if (/14\s*дн|2\s*недел|14\s*day/i.test(hay)) duration = '14 дней';
  else if (/7\s*дн|1\s*недел|7\s*day/i.test(hay)) duration = '7 дней';
  else if (/1\s*мес|месяц|\bmonth\b|1\s*m\.?/i.test(hay)) duration = '1 месяц';

  let plan = null;
  if (/pro\s*plus|pro\+|про\s*плюс/i.test(hay)) plan = 'Pro Plus';
  else if (/\bultra\b|ультра/i.test(hay)) plan = 'Ultra';
  else if (/\benterprise\b/i.test(hay)) plan = 'Enterprise';
  else if (/\bbusiness\b|бизнес/i.test(hay)) plan = 'Business';
  else if (/\btrial\b|триал/i.test(hay)) plan = 'Trial';
  else if (/\bbasic\b|базов/i.test(hay)) plan = 'Basic';
  else if (/\bpro\b|про\b/i.test(hay)) plan = 'Pro';

  const out = {};
  if (duration) out.duration = duration;
  if (plan) out.plan = plan;
  return out;
}

function mergePublicAttributes(raw, listingType, title, description) {
  const out = {};
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  for (const [key, value] of Object.entries(src)) {
    if (!key || key.startsWith('_')) continue;
    if (['imported_from', 'source_seller', 'source_url', 'external_id'].includes(key)) continue;
    const v = value == null ? '' : String(value).trim().slice(0, 80);
    if (v) out[key] = v;
  }
  if (listingType === 'subscription') {
    const guessed = guessSubscriptionAttributes(title, description);
    if (!out.duration && guessed.duration) out.duration = guessed.duration;
    if (!out.plan && guessed.plan) out.plan = guessed.plan;
  }
  return out;
}

function parsePrice(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const cleaned = String(raw)
    .replace(/\s/g, '')
    .replace(/₽|rub|р\./gi, '')
    .replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function ensureDescription(title, description) {
  const d = String(description || '').trim();
  if (d.length >= 20) return d.slice(0, 5000);
  const base = d || `Импортированный лот: ${String(title || 'Без названия').trim()}`;
  if (base.length >= 20) return base.slice(0, 5000);
  return `${base}. Перенесено продавцом на Lootz. Проверьте условия перед покупкой.`.slice(0, 5000);
}

function normalizeImageList(raw) {
  const list = Array.isArray(raw)
    ? raw
    : raw
      ? [raw]
      : [];
  return list
    .map((u) => String(u || '').trim())
    .filter((u) => /^https?:\/\//i.test(u) || u.startsWith('/'))
    .slice(0, 5);
}

function parsePlayerokProfileUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (!/playerok\.com$/i.test(u.hostname) && !/\.playerok\.com$/i.test(u.hostname)) {
      return null;
    }
    const m = u.pathname.match(/\/profile\/([^/]+)/i) || u.pathname.match(/\/user\/([^/]+)/i);
    if (!m) return { url: u.origin + u.pathname, username: null };
    return {
      url: `https://playerok.com/profile/${decodeURIComponent(m[1])}`,
      username: decodeURIComponent(m[1]),
    };
  } catch {
    return null;
  }
}

function parseCsv(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const split = (line) => {
    const cols = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else q = !q;
      } else if (ch === ',' && !q) {
        cols.push(cur.trim());
        cur = '';
      } else cur += ch;
    }
    cols.push(cur.trim());
    return cols;
  };
  const headers = split(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = split(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] || '';
    });
    return {
      title: row.title || row.name || row['название'] || '',
      description: row.description || row.desc || row['описание'] || '',
      price: row.price || row['цена'] || '',
      original_price: row.original_price || row['старая_цена'] || '',
      game: row.game || row['игра'] || row.category || '',
      listing_type: row.listing_type || row.type || '',
      images: (row.image || row.images || '')
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean),
      source_url: row.url || row.source_url || '',
      external_id: row.id || row.external_id || '',
    };
  });
}

function toDraft(raw, index, { provider, profile }) {
  const title = String(raw.title || raw.name || '').trim().slice(0, 200);
  const price = parsePrice(raw.price ?? raw.amount);
  const original = parsePrice(raw.original_price ?? raw.old_price);
  const game = String(raw.game || raw.game_name || raw.category || raw.category_name || 'Другое')
    .trim()
    .slice(0, 100);
  const listingType = guessListingType(raw);
  const images = normalizeImageList(raw.images || raw.image || raw.photos);
  const description = ensureDescription(title, raw.description || raw.desc);
  const attributes = mergePublicAttributes(raw.attributes, listingType, title, description);
  const warnings = [];
  if (!title || title.length < 5) warnings.push('Короткое или пустое название');
  if (price == null || price < 1) warnings.push('Нужна цена ≥ 1 ₽');
  if (!game) warnings.push('Не указана игра/сервис');
  if (listingType === 'subscription') {
    if (!attributes.duration) warnings.push('Укажите срок подписки');
    if (!attributes.plan) warnings.push('Укажите тип подписки');
  }
  const hardFail = (!title || title.length < 5) || price == null || price < 1 || !game;

  return {
    key: String(raw.external_id || raw.id || raw.source_url || `row-${index}`),
    selected: !hardFail,
    provider,
    source_profile: profile?.url || null,
    source_url: raw.source_url || raw.url || null,
    external_id: raw.external_id || raw.id || null,
    title: title || `Лот ${index + 1}`,
    description,
    price: price != null ? Math.round(price * 100) / 100 : null,
    original_price: original != null && price != null && original > price ? original : null,
    game: game || 'Другое',
    listing_type: listingType,
    delivery_method: 'manual',
    images,
    tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 12) : [],
    attributes,
    _import: {
      provider,
      ...(profile?.username ? { source_seller: profile.username } : {}),
      ...(raw.source_url || raw.url ? { source_url: String(raw.source_url || raw.url).slice(0, 300) } : {}),
      ...(raw.external_id || raw.id ? { external_id: String(raw.external_id || raw.id).slice(0, 80) } : {}),
    },
    warnings,
  };
}

function buildDraftsFromPayload(body) {
  const provider = String(body.provider || 'manual').toLowerCase();
  if (!['playerok', 'manual', 'csv'].includes(provider)) {
    const err = new Error('Поддерживаются provider: playerok, csv, manual');
    err.status = 400;
    throw err;
  }

  const profile = provider === 'playerok' ? parsePlayerokProfileUrl(body.profile_url) : null;
  if (provider === 'playerok' && body.profile_url && !profile) {
    const err = new Error('Укажите корректную ссылку вида https://playerok.com/profile/username');
    err.status = 400;
    throw err;
  }

  let items = [];
  if (Array.isArray(body.items) && body.items.length) {
    items = body.items;
  } else if (body.csv) {
    items = parseCsv(body.csv);
  }

  if (!items.length) {
    const err = new Error(
      provider === 'playerok'
        ? 'Playerok с сервера Lootz недоступен (защита площадки). Вставьте свои лоты JSON/CSV ниже — это ваши публичные объявления.'
        : 'Добавьте товары: JSON-массив items или CSV'
    );
    err.status = 400;
    err.code = 'ITEMS_REQUIRED';
    err.meta = {
      profile,
      hint: {
        json_example: [
          {
            title: 'PUBG UC 60',
            description: 'Пополнение UC, выдача вручную после оплаты',
            price: 99,
            game: 'PUBG',
            listing_type: 'topup',
            images: ['https://example.com/uc.png'],
          },
        ],
        csv_header: 'title,description,price,game,listing_type,images,url',
      },
    };
    throw err;
  }

  const drafts = items.slice(0, MAX_IMPORT).map((item, i) => toDraft(item, i, { provider, profile }));
  return {
    provider,
    profile,
    limit: MAX_IMPORT,
    total: drafts.length,
    drafts,
    note:
      provider === 'playerok'
        ? 'Автовыдача и секретные данные с Playerok не переносятся. Проверьте тип лота и описание перед публикацией.'
        : 'Проверьте типы лотов и цены перед публикацией.',
  };
}

/** Fill missing duration/plan on already-published subscription lots (e.g. early imports). */
function enrichListingAttributes(listing) {
  if (!listing || typeof listing !== 'object') {
    return { listing, attributes: {}, changed: false };
  }
  const listingType = String(listing.listing_type || '');
  const attrs = listing.attributes && typeof listing.attributes === 'object' && !Array.isArray(listing.attributes)
    ? { ...listing.attributes }
    : {};
  const titleHay = `${listing.title || ''} ${listing.description || ''}`;
  const looksLikeSub = listingType === 'subscription'
    || listingType === 'premium'
    || (Boolean(attrs._import) && /подписк|pro\s*plus|\bpro\b|месяц|month|premium/i.test(titleHay));
  if (!looksLikeSub) {
    return { listing, attributes: attrs, changed: false };
  }
  const guessed = guessSubscriptionAttributes(listing.title, listing.description);
  let changed = false;
  if (!attrs.duration && guessed.duration) {
    attrs.duration = guessed.duration;
    changed = true;
  }
  if (!attrs.plan && guessed.plan) {
    attrs.plan = guessed.plan;
    changed = true;
  }
  if (!changed) {
    return { listing, attributes: attrs, changed: false };
  }
  return { listing: { ...listing, attributes: attrs }, attributes: attrs, changed: true };
}

module.exports = {
  MAX_IMPORT,
  buildDraftsFromPayload,
  parsePlayerokProfileUrl,
  guessListingType,
  guessSubscriptionAttributes,
  mergePublicAttributes,
  enrichListingAttributes,
};
