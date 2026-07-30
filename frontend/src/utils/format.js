export function formatPrice(amount, currency = 'RUB') {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatRelative(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} дн назад`;
  return formatDate(dateStr);
}

export function formatReviewsCount(count = 0) {
  const n = Number(count) || 0;
  if (n === 0) return 'нет отзывов';

  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return `${n} отзывов`;
  if (mod10 === 1) return `${n} отзыв`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} отзыва`;
  return `${n} отзывов`;
}

export const TX_STATUS = {
  pending: { label: 'Ожидание', color: 'badge-yellow' },
  awaiting_delivery: { label: 'Ожидает передачи', color: 'badge-yellow' },
  awaiting_confirmation: { label: 'Ожидает подтверждения', color: 'badge-blue' },
  completed: { label: 'Завершена', color: 'badge-green' },
  disputed: { label: 'Спор', color: 'badge-red' },
  cancelled: { label: 'Отменена', color: 'badge-gray' },
};
