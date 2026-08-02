import { useEffect } from 'react';

const SITE_NAME = 'Lootz';

/** Default homepage-style title — matches top SERP phrasing for the niche */
export const DEFAULT_TITLE = `${SITE_NAME} — маркетплейс игровых товаров и услуг`;

export const DEFAULT_DESCRIPTION =
  'Покупайте и продавайте аккаунты, игровую валюту, предметы и бусты. Безопасные сделки между игроками с гарантией эскроу.';

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  noindex = false,
  type = 'website',
  /** When true, `title` is used as the full document title (no "— Lootz" suffix). */
  absoluteTitle = false,
}) {
  const fullTitle = title
    ? (absoluteTitle ? title : `${title} — ${SITE_NAME}`)
    : DEFAULT_TITLE;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = `${origin}${path}`;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (selector, attr, value) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (selector.includes('property=')) {
          el.setAttribute('property', selector.match(/property="([^"]+)"/)[1]);
        } else if (selector.includes('name=')) {
          el.setAttribute('name', selector.match(/name="([^"]+)"/)[1]);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[name="robots"]', 'content', noindex ? 'noindex, nofollow' : 'index, follow');
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:type"]', 'content', type);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:site_name"]', 'content', SITE_NAME);
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [fullTitle, description, url, noindex, type]);

  return null;
}
