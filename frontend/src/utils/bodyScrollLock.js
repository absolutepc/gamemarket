/**
 * Lock page scroll without layout jump when the scrollbar disappears.
 * Compensates body + sticky header padding for scrollbar width.
 */

const LOCK_ATTR = 'data-lootz-scroll-lock';

function scrollbarWidth() {
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

export function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  const count = Number(document.body.getAttribute(LOCK_ATTR) || 0);
  if (count === 0) {
    const width = scrollbarWidth();
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.dataset.lootzPrevOverflow = prevOverflow;
    document.body.dataset.lootzPrevPadding = prevPadding;
    document.body.style.overflow = 'hidden';
    if (width > 0) {
      document.body.style.paddingRight = `${width}px`;
      document.documentElement.style.setProperty('--lootz-scrollbar-comp', `${width}px`);
      // Sticky site header is full-bleed — pad it so logo/actions don't jump
      document.querySelectorAll('header.sticky').forEach((el) => {
        el.style.paddingRight = `${width}px`;
      });
    }
  }
  document.body.setAttribute(LOCK_ATTR, String(count + 1));
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  const count = Number(document.body.getAttribute(LOCK_ATTR) || 0);
  if (count <= 1) {
    document.body.style.overflow = document.body.dataset.lootzPrevOverflow || '';
    document.body.style.paddingRight = document.body.dataset.lootzPrevPadding || '';
    delete document.body.dataset.lootzPrevOverflow;
    delete document.body.dataset.lootzPrevPadding;
    document.body.removeAttribute(LOCK_ATTR);
    document.documentElement.style.removeProperty('--lootz-scrollbar-comp');
    document.querySelectorAll('header.sticky').forEach((el) => {
      el.style.paddingRight = '';
    });
  } else {
    document.body.setAttribute(LOCK_ATTR, String(count - 1));
  }
}
