/** Founders program invite — registration as seller + path to /founders. */

const STORAGE_KEY = 'founders_invite';

export const FOUNDERS_INVITE_PATH = '/invite/founders';
export const FOUNDERS_REGISTER_PATH = '/register?invite=founders';

export function isFoundersInviteParam(value) {
  if (value == null) return false;
  const v = String(value).toLowerCase().trim();
  return v === 'founders' || v === '1' || v === 'true' || v === 'yes';
}

export function saveFoundersInvite() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function clearFoundersInvite() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasFoundersInvite() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Absolute invite URL for sharing (browser only). */
export function getFoundersInviteUrl() {
  if (typeof window === 'undefined') return FOUNDERS_INVITE_PATH;
  return `${window.location.origin}${FOUNDERS_INVITE_PATH}`;
}
