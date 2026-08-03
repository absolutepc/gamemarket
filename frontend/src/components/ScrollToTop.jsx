import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Reset window scroll on route changes. Without this, SPA navigation keeps
 * the previous page offset — listing pages open at reviews/footer on mobile.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    // iOS Safari sometimes keeps offset on the documentElement
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);

  return null;
}
