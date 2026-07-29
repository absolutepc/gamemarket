function randomString(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  bytes.forEach((b) => { str += String.fromCharCode(b); });
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(plain) {
  const data = new TextEncoder().encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

export async function startVkLogin(config) {
  const { appId, redirectUri } = config;
  if (!appId) throw new Error('VK ID не настроен');

  const state = randomString(40);
  const codeVerifier = randomString(64);
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier));

  sessionStorage.setItem('vk_oauth', JSON.stringify({
    state,
    codeVerifier,
    redirectUri,
    appId,
  }));

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: String(appId),
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: 'email',
    lang_id: '0',
    scheme: 'dark',
  });

  window.location.assign(`https://id.vk.ru/authorize?${params.toString()}`);
}

export function parseVkCallbackPayload(search, hash) {
  const fromQuery = new URLSearchParams(search);
  if (fromQuery.get('payload')) {
    try {
      return JSON.parse(fromQuery.get('payload'));
    } catch {
      return null;
    }
  }

  const code = fromQuery.get('code') || new URLSearchParams(hash.replace(/^#/, '')).get('code');
  const state = fromQuery.get('state') || new URLSearchParams(hash.replace(/^#/, '')).get('state');
  const deviceId = fromQuery.get('device_id') || new URLSearchParams(hash.replace(/^#/, '')).get('device_id');
  if (code && state) return { code, state, device_id: deviceId };
  return null;
}
