import { getDeviceFingerprint } from './deviceFingerprint';
import { clearFoundersInvite, hasFoundersInvite } from './foundersInvite';

const STORAGE_KEY = 'oauth_account_choice';

/** Persist buyer/seller choice before OAuth redirect (Google / VK). */
export function saveOAuthAccountChoice({ accountType, acceptSellerTerms } = {}) {
  if (accountType !== 'buyer' && accountType !== 'seller') {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
    account_type: accountType,
    accept_seller_terms: accountType === 'seller' ? Boolean(acceptSellerTerms) : undefined,
  }));
}

export function readOAuthAccountChoice() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.account_type !== 'buyer' && parsed?.account_type !== 'seller') return null;
    return {
      account_type: parsed.account_type,
      accept_seller_terms: parsed.accept_seller_terms === true,
    };
  } catch {
    return null;
  }
}

export function clearOAuthAccountChoice() {
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Extra fields for /auth/google|vk|apple body */
export async function oauthAccountTypePayload() {
  const choice = readOAuthAccountChoice();
  const fingerprint = await getDeviceFingerprint();
  const payload = {};
  if (fingerprint) payload.device_fingerprint = fingerprint;
  if (!choice) return payload;
  payload.account_type = choice.account_type;
  if (choice.account_type === 'seller') {
    payload.accept_seller_terms = true;
  }
  return payload;
}

/** Where to send the user after OAuth / social login */
export function pathAfterOAuth(data) {
  if (data?.needs_account_type || data?.user?.needs_account_type) {
    return '/complete-account-type';
  }
  const foundersInvite = hasFoundersInvite();
  if (foundersInvite) {
    clearFoundersInvite();
    if (data?.user?.account_type === 'seller' || data?.created) {
      return '/founders';
    }
  }
  if (data?.created && data?.user?.account_type === 'seller') {
    return '/founders';
  }
  return '/';
}
