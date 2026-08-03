/** Positive aspects the buyer can select; count → final rating 1–5 */
export const REVIEW_CRITERIA = [
  { key: 'deal_speed', label: 'Скорость сделки' },
  { key: 'polite_seller', label: 'Вежливый продавец' },
  { key: 'fair_price', label: 'Хорошая цена' },
  { key: 'quality', label: 'Качество выполнения' },
  { key: 'as_described', label: 'Соответствие описанию' },
];

export const REVIEW_CRITERIA_BY_KEY = Object.fromEntries(
  REVIEW_CRITERIA.map((c) => [c.key, c.label])
);

export function ratingFromCriteria(selectedKeys = []) {
  const unique = [...new Set(selectedKeys)].filter((k) => REVIEW_CRITERIA_BY_KEY[k]);
  return Math.min(5, Math.max(0, unique.length));
}

export function labelsForCriteria(keys = []) {
  return (keys || [])
    .map((k) => REVIEW_CRITERIA_BY_KEY[k])
    .filter(Boolean);
}
