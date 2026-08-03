/**
 * Stable-ish device fingerprint for Founders anti-abuse (not a security boundary alone).
 */
export async function getDeviceFingerprint() {
  try {
    const parts = [
      navigator.userAgent || '',
      navigator.language || '',
      String(screen.width),
      String(screen.height),
      String(screen.colorDepth || ''),
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      String(navigator.hardwareConcurrency || ''),
      String(navigator.maxTouchPoints || 0),
    ];
    const raw = parts.join('|');
    const data = new TextEncoder().encode(raw);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}
