/**
 * Paid listing promotion (ТОП) — boost visibility above organic / Founders tiebreak.
 * Charged from seller wallet balance.
 */

const PROMOTE_PACKAGES = [
  { days: 3, price: 149, label: '3 дня' },
  { days: 7, price: 299, label: '7 дней' },
  { days: 14, price: 499, label: '14 дней' },
];

function getPromotePackage(days) {
  const n = parseInt(days, 10);
  return PROMOTE_PACKAGES.find((p) => p.days === n) || null;
}

/** SQL boolean expression: listing currently has paid TOP */
const SQL_IS_PROMOTED = `(l.featured_until IS NOT NULL AND l.featured_until > NOW())`;

module.exports = {
  PROMOTE_PACKAGES,
  getPromotePackage,
  SQL_IS_PROMOTED,
};
