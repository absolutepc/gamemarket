function parseOrigins(raw) {
  return (raw || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function getAllowedOrigins() {
  const fromList = parseOrigins(process.env.ALLOWED_ORIGINS);
  if (fromList.length) return fromList;

  const primary = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  return [primary];
}

function getPrimaryOrigin() {
  return getAllowedOrigins()[0];
}

function isOriginAllowed(origin) {
  if (!origin) return true;
  const allowed = getAllowedOrigins();
  return allowed.includes(origin.replace(/\/$/, ''));
}

module.exports = {
  getAllowedOrigins,
  getPrimaryOrigin,
  isOriginAllowed,
};
