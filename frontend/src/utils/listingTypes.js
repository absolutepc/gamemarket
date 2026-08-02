/** Listing type options for create/edit forms (order as product spec). */
export const LISTING_TYPE_OPTIONS = [
  { value: 'subscription', label: 'Подписка' },
  { value: 'donate', label: 'Донат' },
  { value: 'account', label: 'Аккаунты' },
  { value: 'item', label: 'Предметы' },
  { value: 'topup', label: 'Пополнение баланса' },
  { value: 'keys', label: 'Ключи' },
  { value: 'other', label: 'Другое' },
  { value: 'currency', label: 'Игровая валюта' },
  { value: 'game_account', label: 'Аккаунты с играми' },
  { value: 'clean_account', label: 'Чистые аккаунты' },
  { value: 'boosting', label: 'Буст' },
  { value: 'services', label: 'Услуги' },
  { value: 'skins', label: 'Скины' },
  { value: 'games', label: 'Игры' },
  { value: 'media', label: 'Медиа' },
  { value: 'rental', label: 'Аренда' },
  { value: 'region_change', label: 'Смена региона' },
  { value: 'mods', label: 'Моды' },
  { value: 'design', label: 'Дизайн' },
  { value: 'training', label: 'Обучение' },
  { value: 'license', label: 'Лицензия' },
  { value: 'software', label: 'Программное обеспечение' },
  { value: 'giftcard', label: 'Подарочные карты' },
  { value: 'steam_rewards', label: 'Награды Steam' },
  // Telegram / social
  { value: 'stars', label: 'Звезды' },
  { value: 'premium', label: 'Премиум' },
  { value: 'nft_gifts', label: 'Подарки (NFT)' },
  { value: 'channels', label: 'Каналы' },
  { value: 'usernames', label: 'Юзернеймы' },
  { value: 'advertising', label: 'Реклама' },
  { value: 'bots', label: 'Боты' },
  { value: 'groups', label: 'Группы' },
  { value: 'stickers', label: 'Стикеры' },
  { value: 'clickers', label: 'Кликеры' },
  // TikTok
  { value: 'coins', label: 'Монеты' },
  { value: 'promotion', label: 'Продвижение' },
  { value: 'montage', label: 'Монтаж' },
  // ВКонтакте
  { value: 'voices', label: 'Голоса' },
  { value: 'vk_music', label: 'VK Music' },
  { value: 'vk_play', label: 'VK Play' },
  { value: 'gifts', label: 'Подарки' },
  // Twitch
  { value: 'twitch_drops', label: 'Twitch Drops' },
  { value: 'bits', label: 'Bits' },
  // eSIM
  { value: 'tariff', label: 'Тариф' },
  // Pax Historia / tokens
  { value: 'tokens', label: 'Токены' },
  // Likee
  { value: 'diamonds', label: 'Алмазы' },
  { value: 'superlikes', label: 'Суперлайки' },
  { value: 'beans', label: 'Бобы' },
  // GearUP
  { value: 'promocodes', label: 'Промокоды' },
  // Autodesk
  { value: 'plugins', label: 'Плагины' },
  // Zoom
  { value: 'guides', label: 'Руководства' },
  // ZEPETO
  { value: 'zems', label: 'Земы' },
  { value: 'packs', label: 'Наборы' },
  // Дизайн
  { value: 'product_design', label: 'Оформление товара' },
  { value: 'images', label: 'Изображения' },
  { value: 'design_packs', label: 'Паки для дизайна' },
  // Emochi
  { value: 'mochi', label: 'Mochi' },
  // TeamSpeak
  { value: 'servers', label: 'Сервера' },
  // Clip Studio Paint
  { value: 'gold', label: 'GOLD' },
  // Аудиоредакторы
  { value: 'sounds', label: 'Звуки' },
  // Trovo
  { value: 'elixir', label: 'Элексир' },
  { value: 'trovo_ace', label: 'Trovo Ace' },
  { value: 'mana', label: 'Мана' },
  // PlayStation
  { value: 'ps_plus', label: 'PS Plus' },
  { value: 'ea_play', label: 'EA Play' },
  // YouTube
  { value: 'youtube_music', label: 'YouTube Music' },
  { value: 'youtube_tv', label: 'YouTube TV' },
  // Xbox
  { value: 'game_pass', label: 'Game Pass' },
  { value: 'ubisoft_plus', label: 'Ubisoft+' },
];

export const LISTING_TYPE_VALUES = LISTING_TYPE_OPTIONS.map((o) => o.value);

export const LISTING_TYPE_LABEL_BY_VALUE = Object.fromEntries(
  LISTING_TYPE_OPTIONS.map((o) => [o.value, o.label])
);
