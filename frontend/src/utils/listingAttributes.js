/**
 * Clickable characteristic schemas per listing type (Playerok-style chips).
 * Each group: { key, label, options: string[], required?: boolean }
 */
export const LISTING_ATTRIBUTE_SCHEMAS = {
  subscription: [
    {
      key: 'duration',
      label: 'Срок подписки',
      required: true,
      options: ['7 дней', '14 дней', '1 месяц', '3 месяца', '6 месяцев', '1 год'],
    },
    {
      key: 'plan',
      label: 'Тип подписки',
      required: true,
      options: ['Trial', 'Basic', 'Pro', 'Pro Plus', 'Ultra', 'Business', 'Enterprise'],
    },
  ],
  donate: [
    {
      key: 'platform',
      label: 'Платформа',
      required: true,
      options: ['Steam', 'PlayStation', 'Xbox', 'Mobile', 'PC launcher', 'Другое'],
    },
    {
      key: 'amount',
      label: 'Сумма доната',
      required: false,
      options: ['100 ₽', '300 ₽', '500 ₽', '1000 ₽', '2000 ₽', '5000 ₽', 'Другое'],
    },
  ],
  account: [
    {
      key: 'platform',
      label: 'Платформа',
      required: true,
      options: ['Steam', 'Epic', 'Origin/EA', 'Battle.net', 'Riot', 'Mobile', 'Другое'],
    },
    {
      key: 'email_access',
      label: 'Почта',
      required: true,
      options: ['С почтой', 'Без почты', 'Смена почты возможна'],
    },
  ],
  clean_account: [
    {
      key: 'platform',
      label: 'Платформа',
      required: true,
      options: ['Apple ID', 'iCloud', 'App Store', 'Другое'],
    },
    {
      key: 'email_access',
      label: 'Почта',
      required: true,
      options: ['С почтой', 'Без почты', 'Смена почты возможна'],
    },
  ],
  game_account: [
    {
      key: 'platform',
      label: 'Платформа',
      required: true,
      options: ['Steam', 'Epic', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile', 'Другое'],
    },
    {
      key: 'games_count',
      label: 'Количество игр',
      required: false,
      options: ['1–5', '6–20', '21–50', '50+'],
    },
  ],
  item: [
    {
      key: 'rarity',
      label: 'Редкость',
      required: false,
      options: ['Обычный', 'Редкий', 'Эпический', 'Легендарный', 'Уникальный'],
    },
    {
      key: 'tradable',
      label: 'Обмен',
      required: false,
      options: ['Можно обменять', 'Нельзя обменять', 'Через трейд'],
    },
  ],
  currency: [
    {
      key: 'delivery_speed',
      label: 'Скорость выдачи',
      required: true,
      options: ['Мгновенно', 'До 15 мин', 'До 1 часа', 'До 24 часов'],
    },
    {
      key: 'region',
      label: 'Регион',
      required: false,
      options: ['RU', 'EU', 'Global', 'Любой'],
    },
  ],
  topup: [
    {
      key: 'service',
      label: 'Сервис',
      required: true,
      options: ['Steam', 'PlayStation', 'Xbox', 'App Store', 'Google Play', 'Другое'],
    },
    {
      key: 'delivery_speed',
      label: 'Скорость',
      required: true,
      options: ['Мгновенно', 'До 15 мин', 'До 1 часа'],
    },
  ],
  keys: [
    {
      key: 'platform',
      label: 'Платформа',
      required: true,
      options: ['Steam', 'Epic', 'Origin/EA', 'Uplay', 'GOG', 'Другое'],
    },
    {
      key: 'region',
      label: 'Регион ключа',
      required: true,
      options: ['RU/CIS', 'EU', 'Global', 'Любой'],
    },
  ],
  boosting: [
    {
      key: 'mode',
      label: 'Формат',
      required: true,
      options: ['С вами', 'Пилотом', 'Смешанный'],
    },
    {
      key: 'duration',
      label: 'Срок выполнения',
      required: false,
      options: ['До 24 ч', '1–3 дня', 'До недели', 'По договорённости'],
    },
  ],
  services: [
    {
      key: 'format',
      label: 'Формат услуги',
      required: true,
      options: ['Онлайн', 'Офлайн', 'Разовая', 'Подписка на услугу'],
    },
  ],
  skins: [
    {
      key: 'rarity',
      label: 'Редкость',
      required: false,
      options: ['Consumer', 'Industrial', 'Mil-Spec', 'Restricted', 'Classified', 'Covert', 'Extraordinary'],
    },
    {
      key: 'float',
      label: 'Состояние',
      required: false,
      options: ['FN', 'MW', 'FT', 'WW', 'BS'],
    },
  ],
  games: [
    {
      key: 'platform',
      label: 'Платформа',
      required: true,
      options: ['Steam', 'Epic', 'PlayStation', 'Xbox', 'Nintendo', 'PC', 'Mobile'],
    },
    {
      key: 'edition',
      label: 'Издание',
      required: false,
      options: ['Standard', 'Deluxe', 'Ultimate', 'GOTY'],
    },
  ],
  media: [
    {
      key: 'format',
      label: 'Формат',
      required: true,
      options: ['Видео', 'Фото', 'Дизайн', 'Монтаж', 'Другое'],
    },
  ],
  rental: [
    {
      key: 'duration',
      label: 'Срок аренды',
      required: true,
      options: ['1 час', '6 часов', '1 день', '3 дня', '7 дней', '30 дней'],
    },
  ],
  region_change: [
    {
      key: 'from_region',
      label: 'Текущий регион',
      required: false,
      options: ['RU', 'US', 'EU', 'TR', 'KZ', 'Другое'],
    },
    {
      key: 'to_region',
      label: 'Новый регион',
      required: true,
      options: ['RU', 'US', 'EU', 'TR', 'KZ', 'Другое'],
    },
  ],
  mods: [
    {
      key: 'compatibility',
      label: 'Совместимость',
      required: false,
      options: ['PC', 'Mobile', 'Консоль', 'Универсально'],
    },
  ],
  design: [
    {
      key: 'format',
      label: 'Формат',
      required: true,
      options: ['Логотип', 'Аватар', 'Баннер', 'UI/UX', 'Другое'],
    },
  ],
  license: [
    {
      key: 'duration',
      label: 'Срок',
      required: true,
      options: ['1 месяц', '3 месяца', '6 месяцев', '1 год', 'Бессрочно'],
    },
    {
      key: 'seats',
      label: 'Тип лицензии',
      required: false,
      options: ['Individual', 'Team', 'Enterprise', 'Education'],
    },
  ],
  software: [
    {
      key: 'edition',
      label: 'Редакция',
      required: false,
      options: ['Home', 'Pro', 'Enterprise', 'Education', 'Другое'],
    },
    {
      key: 'delivery',
      label: 'Формат',
      required: false,
      options: ['Цифровой ключ', 'ISO / образ', 'Установка', 'Другое'],
    },
  ],
  training: [
    {
      key: 'format',
      label: 'Формат',
      required: true,
      options: ['1 на 1', 'Группа', 'Запись курса', 'Консультация'],
    },
    {
      key: 'duration',
      label: 'Длительность',
      required: false,
      options: ['30 мин', '1 час', '2 часа', 'Пакет занятий'],
    },
  ],
  other: [
    {
      key: 'delivery_speed',
      label: 'Скорость передачи',
      required: false,
      options: ['Мгновенно', 'До 1 часа', 'До 24 часов', 'По договорённости'],
    },
  ],
  giftcard: [
    {
      key: 'region',
      label: 'Регион',
      required: true,
      options: ['RU', 'EU', 'US', 'Global'],
    },
  ],
  steam_rewards: [
    {
      key: 'reward_type',
      label: 'Тип награды',
      required: true,
      options: ['Карточки', 'Смайлики', 'Фоны', 'Купоны', 'Набор наград', 'Другое'],
    },
  ],
  stars: [
    {
      key: 'amount',
      label: 'Количество',
      required: false,
      options: ['50', '100', '250', '500', '1000', 'Другое'],
    },
  ],
  premium: [
    {
      key: 'duration',
      label: 'Срок',
      required: true,
      options: ['1 месяц', '3 месяца', '6 месяцев', '1 год'],
    },
  ],
  nft_gifts: [
    {
      key: 'gift_type',
      label: 'Тип подарка',
      required: false,
      options: ['Обычный', 'Редкий', 'Лимитированный', 'Другое'],
    },
  ],
  channels: [
    {
      key: 'subscribers',
      label: 'Подписчики',
      required: false,
      options: ['До 1к', '1–5к', '5–20к', '20–100к', '100к+'],
    },
  ],
  usernames: [
    {
      key: 'length',
      label: 'Длина',
      required: false,
      options: ['4', '5', '6', '7+', 'Кастом'],
    },
  ],
  advertising: [
    {
      key: 'format',
      label: 'Формат',
      required: false,
      options: ['Пост', 'Сторис', 'Интеграция', 'Пакет', 'Другое'],
    },
  ],
  bots: [
    {
      key: 'bot_type',
      label: 'Тип бота',
      required: false,
      options: ['Готовый', 'Кастом', 'Админ-бот', 'Другое'],
    },
  ],
  groups: [
    {
      key: 'members',
      label: 'Участники',
      required: false,
      options: ['До 1к', '1–5к', '5–20к', '20к+'],
    },
  ],
  stickers: [
    {
      key: 'pack_size',
      label: 'Набор',
      required: false,
      options: ['1–10', '11–30', '30+', 'Кастом'],
    },
  ],
  clickers: [
    {
      key: 'game',
      label: 'Игра / кликер',
      required: false,
      options: ['Hamster', 'Notcoin', 'Другое'],
    },
  ],
  coins: [
    {
      key: 'amount',
      label: 'Количество',
      required: false,
      options: ['100', '500', '1000', '5000', '10000', 'Другое'],
    },
  ],
  voices: [
    {
      key: 'amount',
      label: 'Количество',
      required: false,
      options: ['100', '250', '500', '1000', '5000', 'Другое'],
    },
  ],
  vk_music: [
    {
      key: 'duration',
      label: 'Срок',
      required: true,
      options: ['1 месяц', '3 месяца', '6 месяцев', '1 год'],
    },
  ],
  vk_play: [
    {
      key: 'format',
      label: 'Формат',
      required: false,
      options: ['Игра', 'Аккаунт', 'Валюта', 'Другое'],
    },
  ],
  gifts: [
    {
      key: 'gift_type',
      label: 'Тип подарка',
      required: false,
      options: ['Обычный', 'Редкий', 'Лимитированный', 'Другое'],
    },
  ],
  twitch_drops: [
    {
      key: 'game',
      label: 'Игра',
      required: false,
      options: ['Другое'],
    },
  ],
  bits: [
    {
      key: 'amount',
      label: 'Количество',
      required: false,
      options: ['100', '500', '1000', '5000', '10000', 'Другое'],
    },
  ],
  tariff: [
    {
      key: 'duration',
      label: 'Срок',
      required: true,
      options: ['7 дней', '14 дней', '1 месяц', '3 месяца', '6 месяцев', '1 год'],
    },
    {
      key: 'data',
      label: 'Трафик',
      required: false,
      options: ['1 ГБ', '3 ГБ', '5 ГБ', '10 ГБ', '20 ГБ', 'Безлимит', 'Другое'],
    },
  ],
  tokens: [
    {
      key: 'amount',
      label: 'Количество',
      required: false,
      options: ['100', '500', '1000', '5000', '10000', 'Другое'],
    },
  ],
  diamonds: [
    {
      key: 'amount',
      label: 'Количество',
      required: false,
      options: ['100', '500', '1000', '5000', '10000', 'Другое'],
    },
  ],
  superlikes: [
    {
      key: 'amount',
      label: 'Количество',
      required: false,
      options: ['10', '50', '100', '500', '1000', 'Другое'],
    },
  ],
  beans: [
    {
      key: 'amount',
      label: 'Количество',
      required: false,
      options: ['100', '500', '1000', '5000', '10000', 'Другое'],
    },
  ],
  promocodes: [
    {
      key: 'duration',
      label: 'Срок',
      required: false,
      options: ['7 дней', '14 дней', '1 месяц', '3 месяца', '6 месяцев', '1 год', 'Бессрочно'],
    },
  ],
  plugins: [
    {
      key: 'format',
      label: 'Формат',
      required: false,
      options: ['Плагин', 'Скрипт', 'Расширение', 'Другое'],
    },
  ],
  guides: [
    {
      key: 'format',
      label: 'Формат',
      required: false,
      options: ['PDF', 'Видео', 'Статья', 'Другое'],
    },
  ],
  zems: [
    {
      key: 'amount',
      label: 'Количество',
      required: false,
      options: ['100', '500', '1000', '5000', '10000', 'Другое'],
    },
  ],
  packs: [
    {
      key: 'pack_type',
      label: 'Тип набора',
      required: false,
      options: ['Одежда', 'Аксессуары', 'Микс', 'Другое'],
    },
  ],
  product_design: [
    {
      key: 'format',
      label: 'Формат',
      required: false,
      options: ['Карточка товара', 'Обложка', 'Баннер', 'Инфографика', 'Другое'],
    },
  ],
  images: [
    {
      key: 'format',
      label: 'Формат',
      required: false,
      options: ['PNG', 'JPG', 'PSD', 'AI', 'Другое'],
    },
  ],
  design_packs: [
    {
      key: 'pack_type',
      label: 'Тип пака',
      required: false,
      options: ['Шрифты', 'Текстуры', 'Иконки', 'Шаблоны', 'Микс', 'Другое'],
    },
  ],
  mochi: [
    {
      key: 'amount',
      label: 'Количество',
      required: false,
      options: ['100', '500', '1000', '5000', '10000', 'Другое'],
    },
  ],
  servers: [
    {
      key: 'slots',
      label: 'Слоты',
      required: false,
      options: ['8', '16', '32', '64', '128', 'Другое'],
    },
  ],
  gold: [
    {
      key: 'duration',
      label: 'Срок',
      required: true,
      options: ['1 месяц', '3 месяца', '6 месяцев', '1 год'],
    },
  ],
  sounds: [
    {
      key: 'format',
      label: 'Формат',
      required: false,
      options: ['Сэмплы', 'Пресеты', 'Пак', 'Один файл', 'Другое'],
    },
  ],
  elixir: [
    {
      key: 'amount',
      label: 'Количество',
      required: false,
      options: ['100', '500', '1000', '5000', '10000', 'Другое'],
    },
  ],
  trovo_ace: [
    {
      key: 'duration',
      label: 'Срок',
      required: true,
      options: ['1 месяц', '3 месяца', '6 месяцев', '1 год'],
    },
  ],
  mana: [
    {
      key: 'amount',
      label: 'Количество',
      required: false,
      options: ['100', '500', '1000', '5000', '10000', 'Другое'],
    },
  ],
  addons: [
    {
      key: 'addon_type',
      label: 'Тип аддона',
      required: false,
      options: ['Site Audit', 'Content Explorer', 'Другое'],
    },
  ],
  promotion: [
    {
      key: 'format',
      label: 'Формат',
      required: false,
      options: ['Лайки', 'Подписчики', 'Просмотры', 'Комплекс', 'Другое'],
    },
  ],
  montage: [
    {
      key: 'format',
      label: 'Формат',
      required: false,
      options: ['Reels / Shorts', 'Клип', 'Рекламный ролик', 'Другое'],
    },
  ],
  ps_plus: [
    {
      key: 'duration',
      label: 'Срок',
      required: true,
      options: ['1 месяц', '3 месяца', '12 месяцев'],
    },
    {
      key: 'tier',
      label: 'Уровень',
      required: false,
      options: ['Essential', 'Extra', 'Premium'],
    },
  ],
  ea_play: [
    {
      key: 'duration',
      label: 'Срок',
      required: true,
      options: ['1 месяц', '12 месяцев'],
    },
    {
      key: 'tier',
      label: 'Уровень',
      required: false,
      options: ['EA Play', 'EA Play Pro'],
    },
  ],
  game_pass: [
    {
      key: 'duration',
      label: 'Срок',
      required: true,
      options: ['1 месяц', '3 месяца', '12 месяцев'],
    },
    {
      key: 'tier',
      label: 'Уровень',
      required: false,
      options: ['Core', 'Standard', 'Ultimate', 'PC'],
    },
  ],
  ubisoft_plus: [
    {
      key: 'duration',
      label: 'Срок',
      required: true,
      options: ['1 месяц', '12 месяцев'],
    },
    {
      key: 'tier',
      label: 'Уровень',
      required: false,
      options: ['Classic', 'Premium'],
    },
  ],
  youtube_music: [
    {
      key: 'duration',
      label: 'Срок',
      required: true,
      options: ['1 месяц', '3 месяца', '6 месяцев', '1 год'],
    },
  ],
  youtube_tv: [
    {
      key: 'duration',
      label: 'Срок',
      required: true,
      options: ['1 месяц', '3 месяца', '6 месяцев', '1 год'],
    },
  ],
};

export function getAttributeSchema(listingType) {
  return LISTING_ATTRIBUTE_SCHEMAS[listingType] || LISTING_ATTRIBUTE_SCHEMAS.other;
}

export function validateAttributes(listingType, attributes = {}) {
  const schema = getAttributeSchema(listingType);
  for (const group of schema) {
    if (!group.required) continue;
    const value = attributes[group.key];
    if (!value) {
      return { ok: false, error: `Выберите: ${group.label}` };
    }
  }
  return { ok: true };
}

export function attributesToTags(attributes = {}) {
  return Object.values(attributes).filter(Boolean).map(String).slice(0, 12);
}
