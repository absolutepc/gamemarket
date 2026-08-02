import { useEffect } from 'react';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from './Seo';

const SCRIPT_ID = 'lootz-brand-jsonld';

/**
 * Organization + WebSite JSON-LD so search engines recognize the Lootz brand
 * and sitelinks search box.
 */
export default function BrandJsonLd() {
  useEffect(() => {
    const origin = window.location.origin;
    const data = [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Lootz',
        alternateName: ['Лутз', 'Lootz.ru'],
        url: origin,
        logo: `${origin}/favicon.svg`,
        description: DEFAULT_DESCRIPTION,
        slogan: DEFAULT_TITLE,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Lootz',
        alternateName: 'Lootz — маркетплейс игровых товаров и услуг',
        url: origin,
        inLanguage: 'ru-RU',
        publisher: {
          '@type': 'Organization',
          name: 'Lootz',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${origin}/catalog?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ];

    let el = document.getElementById(SCRIPT_ID);
    if (!el) {
      el = document.createElement('script');
      el.id = SCRIPT_ID;
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);

    return () => {
      // Keep brand schema for SPA navigations; only clear on full unmount of layout
      const node = document.getElementById(SCRIPT_ID);
      if (node) node.remove();
    };
  }, []);

  return null;
}
