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
import { ASSORTMENT, ASSORTMENT_PREVIEW_COUNT, HOME_TOP_14 } from '../data/assortment';
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



export default function HomePage() {
  const scrollRef = useRef(null);
  // Compact Playerok-style tiles: fixed icon size (not stretched to 5-across)
  const [tileWidth, setTileWidth] = useState(72);
  const [gapPx, setGapPx] = useState(12);
  const sidePad = 16;

  // Explicit top-14 list (not a slice of a reordered catalog)
  const previewItems = HOME_TOP_14;
  const moreCount = Math.max(0, ASSORTMENT.length - ASSORTMENT_PREVIEW_COUNT);
  const mosaicIcons = useMemo(
    () => ASSORTMENT.slice(ASSORTMENT_PREVIEW_COUNT, ASSORTMENT_PREVIEW_COUNT + 4).map((p) => p.icon),
    []
  );

  useEffect(() => {
    const update = () => {
      // Desktop: dense ~64px icons like Playerok; mobile: slightly larger for touch
      const desktop = window.matchMedia('(min-width: 1024px)').matches;
      setTileWidth(desktop ? 64 : 72);
      setGapPx(desktop ? 16 : 12);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const { data: listings } = useQuery({
    queryKey: ['listings', 'featured'],
    queryFn: () => api.get('/listings?limit=12&sort=popular').then((r) => r.data),
  });

  const scrollAssortment = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = tileWidth + gapPx;
    const page = Math.max(1, Math.floor((el.clientWidth - sidePad * 2) / step));
    el.scrollBy({ left: dir * step * page, behavior: 'smooth' });
  };

  return (
    <div>
      <Seo
        title="Торговая площадка цифровых товаров"
        description="Lootz — маркетплейс цифровых товаров и услуг с безопасными сделками через эскроу."
        path="/"
      />

      <HomeHeroSlider />

      {/* Assortment — compact Playerok-style icon row */}
      <section className="pt-5 lg:pt-6 pb-1">
        <div className="px-4 flex items-center justify-between mb-2.5 lg:mb-3">
          <h2 className="text-base lg:text-lg font-bold">Игры и сервисы</h2>
          <div className="hidden lg:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollAssortment(-1)}
              className="w-8 h-8 rounded-full bg-dark-800/80 border border-dark-700 flex items-center justify-center text-dark-300 hover:text-white hover:border-dark-500 transition-colors"
              aria-label="Назад"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollAssortment(1)}
              className="w-8 h-8 rounded-full bg-dark-800/80 border border-dark-700 flex items-center justify-center text-dark-300 hover:text-white hover:border-dark-500 transition-colors"
              aria-label="Вперёд"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto pt-1 pb-3 scroll-smooth
                     [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ gap: `${gapPx}px`, paddingLeft: sidePad, paddingRight: sidePad }}
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

          {/* Last tile: mosaic → all games & services */}
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
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {LISTING_TYPE_OPTIONS.map((opt) => {
            const Icon = LISTING_TYPE_ICONS[opt.value] || Package;
            return (
              <Link
                key={opt.value}
                to={`/catalog?type=${encodeURIComponent(opt.value)}`}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-900 border border-dark-800
                           hover:border-[#2B71F3]/40 text-sm transition-colors"
              >
                <Icon size={14} className="text-[#2B71F3]" />
                {opt.label}
              </Link>
            );
          })}
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
