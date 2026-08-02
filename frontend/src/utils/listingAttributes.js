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
