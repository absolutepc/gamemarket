import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import api from '../utils/api';
import ListingCard, { LISTING_GRID_CLASS, PAGE_WIDTH_CLASS } from '../components/ListingCard';
import Seo from '../components/Seo';
import { getAssortmentPath, resolveAssortmentLanding } from '../utils/gameSlug';
import { LISTING_TYPE_OPTIONS } from '../utils/listingTypes';
import { offerTypeLabel, typeFromOfferPath } from '../utils/offerTypes';

const FALLBACK_ICON = '/assortment/other-apps.png';

const GAME_TYPE_CHIPS = [
  { value: '', label: 'Все' },
  { value: 'account', label: 'Аккаунты' },
  { value: 'currency', label: 'Валюта' },
  { value: 'skins', label: 'Скины' },
  { value: 'item', label: 'Предметы' },
  { value: 'boosting', label: 'Бусты' },
  { value: 'keys', label: 'Ключи' },
  { value: 'services', label: 'Услуги' },
  { value: 'topup', label: 'Пополнение' },
];

const APP_TYPE_CHIPS = [
  { value: '', label: 'Все' },
  { value: 'subscription', label: 'Подписки' },
  { value: 'account', label: 'Аккаунты' },
  { value: 'topup', label: 'Пополнение' },
  { value: 'keys', label: 'Ключи' },
  { value: 'services', label: 'Услуги' },
  { value: 'other', label: 'Другое' },
];

function buildSeoCopy(item, listingType) {
  const name = item.name;
  const typeLabel = LISTING_TYPE_OPTIONS.find((o) => o.value === listingType)?.label;
  const buyPhrase = listingType ? offerTypeLabel(listingType) : null;

  if (item.kind === 'app') {
    if (listingType && typeLabel) {
      return {
        title: `${name}: ${typeLabel} — купить на Lootz`,
        description:
          `Купить ${buyPhrase} для ${name} на Lootz — маркетплейсе игровых товаров и услуг. ` +
          'Безопасные сделки с гарантией эскроу.',
        intro:
          `Актуальные предложения «${typeLabel}» для ${name}. Покупайте и продавайте с защитой эскроу — деньги удерживаются до подтверждения сделки.`,
        h1Default: `${name}: ${typeLabel}`,
      };
    }
    return {
      title: `${name} — купить подписку, аккаунт или пополнение`,
      description:
        `Lootz — маркетплейс игровых товаров и услуг: ${name} — подписки, аккаунты и пополнения. ` +
        'Безопасные сделки с гарантией эскроу.',
      intro:
        `На Lootz собраны предложения по сервису ${name}: подписки, аккаунты, пополнения баланса и связанные услуги. ` +
        'Покупайте и продавайте с защитой эскроу — деньги удерживаются до подтверждения сделки.',
      h1Default: `${name} — подписки и услуги`,
    };
  }

  const kindPhrase = item.kind === 'mobile' ? 'мобильной игре' : 'игре';
  if (listingType && typeLabel) {
    return {
      title: `${name}: ${typeLabel} — купить на Lootz`,
      description:
        `Купить ${buyPhrase} для ${name} на Lootz — маркетплейсе игровых товаров и услуг. ` +
        'Безопасные сделки с гарантией эскроу.',
      intro:
        `Актуальные лоты «${typeLabel}» по ${kindPhrase} ${name}. Сделки защищены эскроу.`,
      h1Default: `${name}: ${typeLabel}`,
    };
  }

  return {
    title: `${name} — купить аккаунты, валюту и бусты`,
    description:
      `Lootz — маркетплейс игровых товаров и услуг для ${name}: аккаунты, валюта, предметы и бусты. ` +
      'Безопасные сделки с гарантией эскроу.',
    intro:
      `На Lootz собраны предложения по ${kindPhrase} ${name}: аккаунты, игровая валюта, предметы, скины, бусты и ключи. ` +
      'Покупайте и продавайте с защитой эскроу — деньги удерживаются до подтверждения сделки.',
    h1Default: `${name} — товары и услуги`,
  };
}

export default function AssortmentLandingPage({ section = 'games' }) {
  const { slug, offerType: offerTypeParam } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const typeFromPath = offerTypeParam ? typeFromOfferPath(offerTypeParam) : '';
  const legacyType = params.get('type') || '';
  const type = typeFromPath || legacyType || '';

  const resolved = useMemo(
    () => resolveAssortmentLanding(slug, section, type || undefined),
    [slug, section, type]
  );
  const item = resolved.item;

  // Legacy ?type= → clean path URL
  const legacyRedirect = useMemo(() => {
    if (!item || typeFromPath || !legacyType) return null;
    if (!LISTING_TYPE_OPTIONS.some((o) => o.value === legacyType)) return null;
    const next = new URLSearchParams(params);
    next.delete('type');
    const q = next.toString();
    return `${getAssortmentPath(item, legacyType)}${q ? `?${q}` : ''}`;
  }, [item, typeFromPath, legacyType, params]);

  const invalidOffer = Boolean(offerTypeParam && typeFromPath === null);

  const page = parseInt(params.get('page') || '1', 10) || 1;
  const sort = params.get('sort') || 'newest';
  const typeChips = section === 'apps' ? APP_TYPE_CHIPS : GAME_TYPE_CHIPS;

  const filters = useMemo(
    () => ({
      search: item?.search || item?.name || '',
      type: type || '',
      sort,
      page,
      limit: 20,
    }),
    [item, type, sort, page]
  );

  const { data, isLoading } = useQuery({
    queryKey: ['assortment-landing', section, filters],
    queryFn: () => {
      const p = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) p.set(k, String(v));
      });
      return api.get(`/listings?${p}`).then((r) => r.data);
    },
    enabled: Boolean(item) && !invalidOffer,
  });

  const total = data?.total || 0;

  const { data: relatedData } = useQuery({
    queryKey: ['assortment-related-popular', section],
    queryFn: () => api.get('/listings?sort=popular&limit=8').then((r) => r.data),
    enabled: Boolean(item) && !isLoading && total === 0 && !invalidOffer,
  });

  if (resolved.redirectPath) {
    return <Navigate to={resolved.redirectPath} replace />;
  }

  if (legacyRedirect) {
    return <Navigate to={legacyRedirect} replace />;
  }

  if (invalidOffer) {
    return <Navigate to={`/${section}/${slug}`} replace />;
  }

  if (!item) {
    const notFoundLabel = section === 'apps' ? 'Приложение не найдено' : 'Игра не найдена';
    return (
      <div className={`${PAGE_WIDTH_CLASS} py-16 text-center`}>
        <Seo
          title={notFoundLabel}
          description="Страница не найдена"
          path={`/${section}/${slug || ''}`}
          noindex
        />
        <Package className="mx-auto text-dark-600 mb-4" size={40} />
        <h1 className="text-xl font-bold mb-2">Страница не найдена</h1>
        <p className="text-dark-400 mb-6">
          {section === 'apps'
            ? 'Такого приложения или сервиса нет в каталоге Lootz.'
            : 'Такой игры нет в каталоге Lootz.'}
        </p>
        <Link
          to={section === 'apps' ? '/apps?tab=apps' : '/apps'}
          className="btn-primary inline-flex"
        >
          {section === 'apps' ? 'Все приложения' : 'Все игры и сервисы'}
        </Link>
      </div>
    );
  }

  const { title, description, intro, h1Default } = buildSeoCopy(item, type || undefined);
  const path = getAssortmentPath(item, type || undefined);
  const h1 = h1Default;
  const pages = data?.pages || 1;
  const sectionCrumb = section === 'apps' ? 'Приложения' : 'Игры';
  const related = relatedData?.listings || [];

  const goType = (nextType) => {
    const next = new URLSearchParams(params);
    next.delete('type');
    next.delete('page');
    const q = next.toString();
    navigate(`${getAssortmentPath(item, nextType || undefined)}${q ? `?${q}` : ''}`);
  };

  const setPage = (nextPage) => {
    const next = new URLSearchParams(params);
    if (nextPage <= 1) next.delete('page');
    else next.set('page', String(nextPage));
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`${PAGE_WIDTH_CLASS} py-6 sm:py-8`}>
      <Seo title={title} description={description} path={path} />

      <nav className="text-sm text-dark-500 mb-4 flex flex-wrap items-center gap-1.5">
        <Link to="/" className="hover:text-dark-300">Главная</Link>
        <span>/</span>
        <Link
          to={section === 'apps' ? '/apps?tab=apps' : '/apps'}
          className="hover:text-dark-300"
        >
          {sectionCrumb}
        </Link>
        <span>/</span>
        <Link to={getAssortmentPath(item)} className="hover:text-dark-300">{item.name}</Link>
        {type ? (
          <>
            <span>/</span>
            <span className="text-dark-300">
              {LISTING_TYPE_OPTIONS.find((o) => o.value === type)?.label || type}
            </span>
          </>
        ) : null}
      </nav>

      <header className="flex items-start gap-4 sm:gap-5 mb-5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[22%] overflow-hidden bg-dark-800 ring-1 ring-white/10 shrink-0">
          <img
            src={item.icon}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_ICON;
            }}
          />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{h1}</h1>
          <p className="mt-2 text-sm sm:text-[15px] text-dark-300 leading-relaxed max-w-3xl">
            {intro}
          </p>
          <p className="mt-2 text-xs text-dark-500">
            {isLoading ? 'Загрузка…' : `${total} ${total === 1 ? 'активный лот' : total < 5 ? 'активных лота' : 'активных лотов'}`}
            {' · '}
            <Link to={`/catalog?search=${encodeURIComponent(item.search)}`} className="text-brand-400 hover:text-brand-300">
              открыть в каталоге
            </Link>
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 mb-6">
        {typeChips.map((chip) => {
          const active = type === chip.value;
          return (
            <button
              key={chip.value || 'all'}
              type="button"
              onClick={() => goType(chip.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#2B71F3] text-white'
                  : 'bg-dark-800 text-dark-300 hover:text-white hover:bg-dark-700'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className={LISTING_GRID_CLASS}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-dark-800/80 aspect-[3/4] animate-pulse" />
          ))}
        </div>
      ) : data?.listings?.length ? (
        <>
          <div className={LISTING_GRID_CLASS}>
            {data.listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="btn-secondary inline-flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Назад
              </button>
              <span className="text-sm text-dark-400">
                {page} / {pages}
              </span>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage(page + 1)}
                className="btn-secondary inline-flex items-center gap-1 disabled:opacity-40"
              >
                Далее <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-10">
          <div className="rounded-2xl border border-dark-800 bg-dark-900/50 px-6 py-14 text-center">
            <Package className="mx-auto text-dark-600 mb-3" size={36} />
            <p className="font-medium text-white mb-1">Пока нет активных лотов</p>
            <p className="text-sm text-dark-400 mb-5 max-w-md mx-auto">
              Станьте первым продавцом по направлению {item.name}
              {type ? ` (${LISTING_TYPE_OPTIONS.find((o) => o.value === type)?.label})` : ''}
              {' '}— создайте лот за пару минут. Чем больше свежих объявлений, тем выше страница в поиске.
            </p>
            <Link to="/listings/create" className="btn-primary inline-flex">
              Создать лот
            </Link>
          </div>

          {related.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4">Популярные лоты на Lootz</h2>
              <div className={LISTING_GRID_CLASS}>
                {related.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/** @deprecated use AssortmentLandingPage */
export { AssortmentLandingPage as GameLandingPage };
