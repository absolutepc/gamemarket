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
  { value: 'giftcard', label: 'Подарочные карты' },
  { value: 'steam_rewards', label: 'Награды Steam' },
];

export const LISTING_TYPE_VALUES = LISTING_TYPE_OPTIONS.map((o) => o.value);

export const LISTING_TYPE_LABEL_BY_VALUE = Object.fromEntries(
  LISTING_TYPE_OPTIONS.map((o) => [o.value, o.label])
);
