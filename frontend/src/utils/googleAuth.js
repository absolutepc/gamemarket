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

/** Start Google OAuth (authorization code + PKCE). Redirects the window. */
export async function startGoogleLogin(config) {
  const { clientId, redirectUri } = config || {};
  if (!clientId) throw new Error('Google вход не настроен');
  if (!redirectUri) throw new Error('Google redirect URI не настроен');

  const state = randomString(40);
  const codeVerifier = randomString(64);
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier));

  sessionStorage.setItem('google_oauth', JSON.stringify({
    state,
    codeVerifier,
    redirectUri,
    clientId,
  }));

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: String(clientId),
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
  });

  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

export function parseGoogleCallback(search) {
  const q = new URLSearchParams(search);
  const error = q.get('error');
  if (error) {
    return { error: q.get('error_description') || error };
  }
  const code = q.get('code');
  const state = q.get('state');
  if (!code) return null;
  return { code, state };
}
