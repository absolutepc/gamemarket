/** Account type chosen at registration (or upgraded later). */
export const ACCOUNT_TYPES = {
  buyer: 'buyer',
  seller: 'seller',
};

export const ACCOUNT_TYPE_OPTIONS = [
  {
    value: ACCOUNT_TYPES.buyer,
    label: 'Покупатель',
    description: 'Покупаю товары и услуги на Lootz',
    criteria: [
      'Покупки с гарантией эскроу',
      'Чаты и сделки с продавцами',
      'Отзывы после завершения сделки',
      'Продажа доступна после смены типа аккаунта',
    ],
  },
  {
    value: ACCOUNT_TYPES.seller,
    label: 'Продавец',
    description: 'Выставляю лоты и получаю оплату',
    criteria: [
      'Создание и управление лотами',
      'Получение оплаты через эскроу Lootz',
      'Комиссия площадки 7.5% / 17.5%',
      'Соблюдение правил продажи и споров',
    ],
  },
];

export function isSellerAccount(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.account_type === ACCOUNT_TYPES.seller;
}
