import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Zap, ArrowRight, ChevronLeft, ChevronRight,
  Coins, User, Package, Sparkles, Gift, Wallet,
  KeyRound, HelpCircle, Gamepad2, Wrench, Layers,
  Film, Clock, Puzzle, Palette, GraduationCap, ShoppingBag,
} from 'lucide-react';
import api from '../utils/api';
import ListingCard, { LISTING_GRID_CLASS, PAGE_WIDTH_CLASS } from '../components/ListingCard';
import Seo from '../components/Seo';
import HomeHeroSlider from '../components/HomeHeroSlider';
import { ASSORTMENT, HOME_TOP_14 } from '../data/assortment';
import { LISTING_TYPE_OPTIONS } from '../utils/listingTypes';

const LISTING_TYPE_ICONS = {
  subscription: Sparkles,
  donate: Gift,
  account: User,
  item: Package,
  topup: Wallet,
  keys: KeyRound,
  other: HelpCircle,
  currency: Coins,
  game_account: Gamepad2,
  boosting: Zap,
  services: Wrench,
  skins: Layers,
  games: ShoppingBag,
  media: Film,
  rental: Clock,
  mods: Puzzle,
  design: Palette,
  training: GraduationCap,
};



const DESKTOP_VISIBLE = 16; // exact items per page — no partial peek
const DESKTOP_ITEMS = 31; // + mosaic folder = 32
const CAT_PAGE_SIZE = 10; // exact categories on first page — no 11th peek

export default function HomePage() {
  const scrollRef = useRef(null);
  const catScrollRef = useRef(null);
  const [tileWidth, setTileWidth] = useState(72);
  const [gapPx, setGapPx] = useState(12);
  const [isDesktop, setIsDesktop] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canCatLeft, setCanCatLeft] = useState(false);
  const [canCatRight, setCanCatRight] = useState(false);
  const [catViewport, setCatViewport] = useState(0);

  const catPage1 = useMemo(() => LISTING_TYPE_OPTIONS.slice(0, CAT_PAGE_SIZE), []);
  const catPage2 = useMemo(() => LISTING_TYPE_OPTIONS.slice(CAT_PAGE_SIZE), []);

  // Desktop: 31 games + mosaic folder = 32; mobile: top-14 + folder
  const previewItems = useMemo(
    () => (isDesktop ? ASSORTMENT.slice(0, DESKTOP_ITEMS) : HOME_TOP_14),
    [isDesktop]
  );
  const moreCount = Math.max(0, ASSORTMENT.length - previewItems.length);
  const mosaicIcons = useMemo(
    () => ASSORTMENT.slice(previewItems.length, previewItems.length + 4).map((p) => p.icon),
    [previewItems.length]
  );

  const updateScrollEdges = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    setCanScrollLeft(left > 6);
    setCanScrollRight(maxScroll > 6 && left < maxScroll - 6);
  };

  const updateCatScrollEdges = () => {
    const el = catScrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    setCanCatLeft(left > 6);
    setCanCatRight(maxScroll > 6 && left < maxScroll - 6);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    const update = () => {
      const desktop = window.matchMedia('(min-width: 1024px)').matches;
      setIsDesktop(desktop);
      const gap = 12;
      setGapPx(gap);

      if (desktop) {
        // Fit exactly 16 tiles into the container — next page never peeks
        const w = el.clientWidth;
        const size = (w - gap * (DESKTOP_VISIBLE - 1)) / DESKTOP_VISIBLE;
        setTileWidth(Math.max(48, size));
      } else {
        setTileWidth(72);
      }
      requestAnimationFrame(updateScrollEdges);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener('scroll', updateScrollEdges, { passive: true });
    el.addEventListener('scrollend', updateScrollEdges);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', updateScrollEdges);
      el.removeEventListener('scrollend', updateScrollEdges);
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(updateScrollEdges);
  }, [previewItems.length, tileWidth, gapPx]);

  useEffect(() => {
    const el = catScrollRef.current;
    if (!el) return undefined;
    const onScroll = () => updateCatScrollEdges();
    const onResize = () => {
      setCatViewport(el.clientWidth);
      requestAnimationFrame(updateCatScrollEdges);
    };
    setCatViewport(el.clientWidth);
    updateCatScrollEdges();
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scrollend', onScroll);
    window.addEventListener('resize', onResize);
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scrollend', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const { data: listings } = useQuery({
    queryKey: ['listings', 'featured'],
    queryFn: () => api.get('/listings?limit=12&sort=popular').then((r) => r.data),
  });

  const scrollAssortment = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    if (isDesktop) {
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      // Step = one full page including the gap after the 16th item
      // so page 2 lands exactly at maxScroll (fixes stuck right arrow)
      const step = DESKTOP_VISIBLE * (tileWidth + gapPx);
      let target = el.scrollLeft + dir * step;
      if (dir > 0) target = Math.min(maxScroll, target);
      else target = Math.max(0, target);
      if (dir > 0 && target >= maxScroll - 2) target = maxScroll;
      if (dir < 0 && target <= 2) target = 0;
      el.scrollTo({ left: target, behavior: 'smooth' });
      window.setTimeout(updateScrollEdges, 400);
    } else {
      const step = tileWidth + gapPx;
      const page = Math.max(1, Math.floor(el.clientWidth / step));
      el.scrollBy({ left: dir * step * page, behavior: 'smooth' });
      window.setTimeout(updateScrollEdges, 400);
    }
  };

  const scrollCategories = (dir) => {
    const el = catScrollRef.current;
    if (!el) return;
    const pageWidth = catViewport || el.clientWidth;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    let target = dir > 0 ? pageWidth : 0;
    target = Math.max(0, Math.min(maxScroll, target));
    el.scrollTo({ left: target, behavior: 'smooth' });
    window.setTimeout(updateCatScrollEdges, 400);
  };

  const renderCatChip = (opt) => {
    const Icon = LISTING_TYPE_ICONS[opt.value] || Package;
    return (
      <Link
        key={opt.value}
        to={`/catalog?type=${encodeURIComponent(opt.value)}`}
        className="min-w-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-dark-900 border border-dark-800
                   hover:border-[#2B71F3]/40 text-sm transition-colors"
      >
        <Icon size={14} className="text-[#2B71F3] shrink-0" />
        <span className="truncate">{opt.label}</span>
      </Link>
    );
  };

  const glassArrowClass =
    'hidden lg:flex absolute z-20 w-11 h-11 rounded-full items-center justify-center ' +
    'bg-white/10 hover:bg-white/20 text-white border border-white/20 ' +
    'backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-colors';

  return (
    <div>
      <Seo
        title="Торговая площадка цифровых товаров"
        description="Lootz — маркетплейс цифровых товаров и услуг с безопасными сделками через эскроу."
        path="/"
      />

      <HomeHeroSlider />

      {/* Assortment: 16 exact per desktop page, side glass arrows */}
      <section className={`${PAGE_WIDTH_CLASS} pt-5 lg:pt-6 pb-1`}>
        <div className="flex items-center justify-between mb-2.5 lg:mb-3">
          <h2 className="text-base lg:text-lg font-bold">Игры и сервисы</h2>
        </div>

        <div className="relative">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollAssortment(-1)}
              className={`${glassArrowClass} left-0 -translate-x-1/2 -translate-y-1/2`}
              style={{ top: Math.max(24, tileWidth / 2 + 4) }}
              aria-label="Назад"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollAssortment(1)}
              className={`${glassArrowClass} right-0 translate-x-1/2 -translate-y-1/2`}
              style={{ top: Math.max(24, tileWidth / 2 + 4) }}
              aria-label="Вперёд"
            >
              <ChevronRight size={22} />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex overflow-x-auto lg:overflow-x-hidden pt-1 pb-3 scroll-smooth
                       [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ gap: `${gapPx}px` }}
          >
            {previewItems.map((item) => (
              <Link
                key={item.search + item.name}
                to={`/catalog?search=${encodeURIComponent(item.search)}`}
                className="shrink-0 group flex flex-col items-center gap-1.5 relative z-0 hover:z-10"
                style={{ width: tileWidth }}
              >
                <div
                  className="w-full aspect-square rounded-[18%] overflow-hidden
                              bg-dark-800 ring-1 ring-white/10
                              group-hover:scale-[1.04] group-hover:ring-[#2B71F3]/45 transition-all duration-200"
                >
                  <img
                    src={item.icon}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assortment/other-apps.png';
                    }}
                  />
                </div>
                <span className="text-[11px] lg:text-[12px] text-dark-300 group-hover:text-white text-center leading-tight line-clamp-2 w-full px-0.5 transition-colors">
                  {item.name}
                </span>
              </Link>
            ))}

            {/* End tile: mosaic folder → all games & services */}
            <Link
              to="/apps?tab=games"
              className="shrink-0 group flex flex-col items-center gap-1.5"
              style={{ width: tileWidth }}
              aria-label="Все игры и сервисы"
            >
              <div
                className="w-full aspect-square rounded-[18%] overflow-hidden
                            bg-dark-800 ring-1 ring-white/10
                            group-hover:scale-[1.04] group-hover:ring-[#2B71F3]/45 transition-all duration-200
                            grid grid-cols-2 grid-rows-2 gap-[2px] p-[2px]"
              >
                {mosaicIcons.map((src, i) => (
                  <img
                    key={`${src}-${i}`}
                    src={src}
                    alt=""
                    className="w-full h-full object-cover rounded-[28%]"
                    loading="lazy"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assortment/other-apps.png';
                    }}
                  />
                ))}
              </div>
              <span className="text-[11px] lg:text-[12px] text-[#2B71F3] font-semibold text-center leading-tight">
                +{moreCount.toLocaleString('ru-RU')}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Steam top-up promo — Playerok-style featured block */}
      <section className={`${PAGE_WIDTH_CLASS} pt-4 pb-2`}>
        <Link
          to="/catalog?search=Steam"
          className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 rounded-2xl bg-dark-900 border border-dark-800
                     px-5 py-5 hover:border-[#2B71F3]/40 transition-colors group"
        >
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10">
              <img src="/assortment/steam.png" alt="Steam" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-semibold group-hover:text-[#2B71F3] transition-colors">Пополнить Steam</div>
              <div className="text-xs text-dark-400">Логин · сумма · мгновенная оплата</div>
            </div>
          </div>
          <div className="hidden sm:flex flex-1 items-center gap-3 min-w-0">
            <div className="flex-1 h-11 rounded-xl bg-dark-800 border border-dark-700 px-4 flex items-center text-sm text-dark-500">
              Логин Steam
            </div>
            <div className="w-36 h-11 rounded-xl bg-dark-800 border border-dark-700 px-4 flex items-center justify-between text-sm text-dark-500">
              Сумма
              <span className="text-dark-400">₽</span>
            </div>
          </div>
          <div className="btn-primary h-11 px-6 inline-flex items-center justify-center shrink-0 pointer-events-none">
            Перейти
          </div>
        </Link>
      </section>

      <section className={`${PAGE_WIDTH_CLASS} pt-5 pb-2`}>
        <div className="relative">
          {canCatLeft && (
            <button
              type="button"
              onClick={() => scrollCategories(-1)}
              className={`${glassArrowClass} left-0 -translate-x-1/2 top-1/2 -translate-y-1/2`}
              aria-label="Категории назад"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          {canCatRight && (
            <button
              type="button"
              onClick={() => scrollCategories(1)}
              className={`${glassArrowClass} right-0 translate-x-1/2 top-1/2 -translate-y-1/2`}
              aria-label="Категории вперёд"
            >
              <ChevronRight size={22} />
            </button>
          )}

          <div
            ref={catScrollRef}
            className="flex overflow-x-auto lg:overflow-x-hidden scroll-smooth pb-2
                       [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div
              className="shrink-0 grid gap-2"
              style={{
                width: catViewport ? `${catViewport}px` : '100%',
                gridTemplateColumns: `repeat(${CAT_PAGE_SIZE}, minmax(0, 1fr))`,
              }}
            >
              {catPage1.map(renderCatChip)}
            </div>
            {catPage2.length > 0 && (
              <div
                className="shrink-0 flex gap-2"
                style={{ minWidth: catViewport ? `${catViewport}px` : '100%' }}
              >
                {catPage2.map((opt) => {
                  const Icon = LISTING_TYPE_ICONS[opt.value] || Package;
                  return (
                    <Link
                      key={opt.value}
                      to={`/catalog?type=${encodeURIComponent(opt.value)}`}
                      className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-900 border border-dark-800
                                 hover:border-[#2B71F3]/40 text-sm transition-colors"
                    >
                      <Icon size={14} className="text-[#2B71F3] shrink-0" />
                      {opt.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-6 pb-16">
        <div className={PAGE_WIDTH_CLASS}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold">Ассортимент</h2>
            <Link to="/catalog" className="flex items-center gap-1 text-[#2B71F3] hover:text-blue-400 text-sm font-medium transition-colors">
              Все лоты <ArrowRight size={14} />
            </Link>
          </div>
          <div className={LISTING_GRID_CLASS}>
            {listings?.listings?.map((l) => <ListingCard key={l.id} listing={l} />)}
            {(!listings?.listings || listings.listings.length === 0) && (
              <div className="col-span-full text-center text-dark-400 py-12 text-sm">
                Пока нет активных лотов —{' '}
                <Link to="/listings/create" className="text-[#2B71F3] hover:underline">создайте первый</Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
