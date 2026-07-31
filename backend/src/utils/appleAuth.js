const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

let cachedJwks = null;
let cachedAt = 0;
const JWKS_TTL_MS = 60 * 60 * 1000;

async function getAppleJwks() {
  if (cachedJwks && Date.now() - cachedAt < JWKS_TTL_MS) return cachedJwks;
  const res = await fetch(APPLE_JWKS_URL);
  if (!res.ok) throw new Error('Failed to fetch Apple JWKS');
  const data = await res.json();
  cachedJwks = data.keys || [];
  cachedAt = Date.now();
  return cachedJwks;
}

function decodeJwtHeader(token) {
  const [headerB64] = String(token).split('.');
  if (!headerB64) throw new Error('Invalid Apple identity token');
  const json = Buffer.from(headerB64, 'base64url').toString('utf8');
  return JSON.parse(json);
}

/**
 * Verify Sign in with Apple identity_token (JWT).
 * Requires APPLE_CLIENT_ID (Services ID) as audience.
 */
async function verifyAppleIdentityToken(identityToken) {
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientId) throw new Error('APPLE_CLIENT_ID not configured');
  if (!identityToken || typeof identityToken !== 'string') {
    throw new Error('identityToken required');
  }

  const header = decodeJwtHeader(identityToken);
  const keys = await getAppleJwks();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('Apple signing key not found');

  const keyObject = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const claims = jwt.verify(identityToken, keyObject, {
    algorithms: ['RS256'],
    issuer: APPLE_ISSUER,
    audience: clientId,
  });

  if (!claims.sub) throw new Error('Apple subject missing');
  return claims;
}

module.exports = { verifyAppleIdentityToken };
