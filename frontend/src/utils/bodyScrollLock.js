/**
 * Lock page scroll without layout jump.
 * Relies on `html { scrollbar-gutter: stable }` — do NOT add padding-right,
 * or the page shifts the other way (double compensation).
 */

const LOCK_ATTR = 'data-lootz-scroll-lock';

export function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  const count = Number(document.body.getAttribute(LOCK_ATTR) || 0);
  if (count === 0) {
    document.documentElement.dataset.lootzPrevOverflow = document.documentElement.style.overflow;
    document.body.dataset.lootzPrevOverflow = document.body.style.overflow;
    // Clear any leftover padding from older lock implementations
    document.body.style.paddingRight = '';
    document.documentElement.style.removeProperty('--lootz-scrollbar-comp');
    document.querySelectorAll('header.sticky').forEach((el) => {
      el.style.paddingRight = '';
    });
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  document.body.setAttribute(LOCK_ATTR, String(count + 1));
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  const count = Number(document.body.getAttribute(LOCK_ATTR) || 0);
  if (count <= 1) {
    document.documentElement.style.overflow = document.documentElement.dataset.lootzPrevOverflow || '';
    document.body.style.overflow = document.body.dataset.lootzPrevOverflow || '';
    delete document.documentElement.dataset.lootzPrevOverflow;
    delete document.body.dataset.lootzPrevOverflow;
    document.body.style.paddingRight = '';
    document.documentElement.style.removeProperty('--lootz-scrollbar-comp');
    document.querySelectorAll('header.sticky').forEach((el) => {
      el.style.paddingRight = '';
    });
    document.body.removeAttribute(LOCK_ATTR);
  } else {
    document.body.setAttribute(LOCK_ATTR, String(count - 1));
  }
}
