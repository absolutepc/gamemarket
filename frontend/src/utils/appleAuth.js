const APPLE_SDK_URL = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

function loadAppleSdk() {
  if (window.AppleID?.auth) return Promise.resolve(window.AppleID);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${APPLE_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.AppleID));
      existing.addEventListener('error', () => reject(new Error('Не удалось загрузить Apple SDK')));
      if (window.AppleID?.auth) resolve(window.AppleID);
      return;
    }
    const script = document.createElement('script');
    script.src = APPLE_SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.AppleID?.auth) resolve(window.AppleID);
      else reject(new Error('Apple SDK недоступен'));
    };
    script.onerror = () => reject(new Error('Не удалось загрузить Apple SDK'));
    document.head.appendChild(script);
  });
}

/**
 * Sign in with Apple (popup). Returns { identityToken, user? }.
 * config: { clientId, redirectUri }
 */
export async function startAppleLogin(config) {
  const { clientId, redirectUri } = config || {};
  if (!clientId) throw new Error('Apple ID не настроен');
  if (!redirectUri) throw new Error('Apple redirect URI не настроен');

  const AppleID = await loadAppleSdk();
  AppleID.auth.init({
    clientId: String(clientId),
    scope: 'name email',
    redirectURI: redirectUri,
    usePopup: true,
  });

  const response = await AppleID.auth.signIn();
  const identityToken = response?.authorization?.id_token;
  if (!identityToken) throw new Error('Apple не вернул identity token');

  return {
    identityToken,
    authorizationCode: response?.authorization?.code || null,
    user: response?.user || null,
  };
}
