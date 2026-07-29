import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import {
  Shield, Zap, Lock, CheckCircle2, Search, ArrowRight, ChevronLeft, ChevronRight,
  Coins, User, Package, Sparkles, Gift, Wallet, Bot, Share2,
} from 'lucide-react';
import api from '../utils/api';
import ListingCard from '../components/ListingCard';
import Seo from '../components/Seo';

const CATEGORY_ICONS = {
  'game-currency': Coins,
  accounts: User,
  items: Package,
  subscriptions: Sparkles,
  topups: Wallet,
  'gift-cards': Gift,
  boosting: Zap,
  'ai-services': Bot,
  social: Share2,
  other: Package,
};

/** Playerok-style horizontal game/service assortment */
const ASSORTMENT = [
  { name: 'Arena Breakout', search: 'Arena Breakout', color: 'from-[#2d3a2e] to-[#1a221b]', letter: 'AB' },
  { name: 'App Store', search: 'App Store', color: 'from-[#147EFB] to-[#0a5ec4]', letter: 'A' },
  { name: 'Roblox', search: 'Roblox', color: 'from-[#E2231A] to-[#a31812]', letter: 'R' },
  { name: 'PUBG Mobile', search: 'PUBG', color: 'from-[#F2A900] to-[#c48400]', letter: 'P' },
  { name: 'Brawl Stars', search: 'Brawl Stars', color: 'from-[#F7C948] to-[#e8910f]', letter: 'BS' },
  { name: 'Telegram', search: 'Telegram', color: 'from-[#229ED9] to-[#1a7fb0]', letter: 'T' },
  { name: 'Steam', search: 'Steam', color: 'from-[#1b2838] to-[#2a475e]', letter: 'S' },
  { name: 'Valorant', search: 'Valorant', color: 'from-[#FF4655] to-[#b82e3a]', letter: 'V' },
  { name: 'Genshin', search: 'Genshin', color: 'from-[#4A90D9] to-[#2d5f96]', letter: 'GI' },
  { name: 'Fortnite', search: 'Fortnite', color: 'from-[#9D4DFF] to-[#6b2fb3]', letter: 'F' },
  { name: 'Minecraft', search: 'Minecraft', color: 'from-[#5D9C3F] to-[#3d6b2a]', letter: 'M' },
  { name: 'TikTok', search: 'TikTok', color: 'from-[#111111] to-[#333333]', letter: '♪' },
  { name: 'ChatGPT', search: 'ChatGPT', color: 'from-[#10A37F] to-[#0d7a5f]', letter: 'G' },
  { name: 'Claude', search: 'Claude', color: 'from-[#D97757] to-[#b45a3d]', letter: 'C' },
  { name: 'Discord', search: 'Discord', color: 'from-[#5865F2] to-[#3c45a8]', letter: 'D' },
  { name: 'PlayStation', search: 'PlayStation', color: 'from-[#003791] to-[#00215a]', letter: 'PS' },
  { name: 'Spotify', search: 'Spotify', color: 'from-[#1DB954] to-[#14833b]', letter: '♪' },
  { name: 'Mobile Legends', search: 'Mobile Legends', color: 'from-[#1a3a6b] to-[#0d1f3c]', letter: 'ML' },
];

export default function HomePage() {
  const scrollRef = useRef(null);

  const { data: listings } = useQuery({
    queryKey: ['listings', 'featured'],
    queryFn: () => api.get('/listings?limit=12&sort=popular').then((r) => r.data),
  });
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const scrollAssortment = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by one full visible page (same count of items as initially shown)
    const amount = el.clientWidth || el.offsetWidth;
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  return (
    <div>
      <Seo
        title="Торговая площадка цифровых товаров"
        description="GameMarket — маркетплейс цифровых товаров и услуг с безопасными сделками через эскроу."
        path="/"
      />

      <section className="relative overflow-hidden border-b border-dark-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(43,113,243,0.16),_transparent_55%),linear-gradient(180deg,#101214_0%,#16181c_100%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-12 sm:pt-16 sm:pb-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 badge-blue mb-4 text-sm px-3 py-1">
              <Shield size={14} /> Безопасные сделки · комиссия 7.5%
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              GameMarket
            </h1>
            <p className="text-dark-300 text-base sm:text-lg mb-8 max-w-2xl leading-relaxed">
              Маркетплейс цифровых товаров и услуг: покупайте и продавайте безопасно.
              Средства удерживаются в эскроу до подтверждения сделки — защита и для покупателя, и для продавца.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/catalog" className="btn-primary h-12 px-6 inline-flex items-center gap-2">
                Смотреть каталог <ArrowRight size={16} />
              </Link>
              <Link to="/listings/create" className="btn-secondary h-12 px-6 inline-flex items-center">
                Продать товар
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Assortment of games & services — Playerok-style */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Игры и сервисы</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollAssortment(-1)}
              className="w-9 h-9 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-dark-300 hover:text-white hover:border-dark-500 transition-colors"
              aria-label="Назад"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollAssortment(1)}
              className="w-9 h-9 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-dark-300 hover:text-white hover:border-dark-500 transition-colors"
              aria-label="Вперёд"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        {/* pt + -mt: room for hover scale so icons are not clipped by overflow-x */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pt-3 -mt-1 pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none' }}
        >
          {ASSORTMENT.map((item) => (
            <Link
              key={item.search + item.name}
              to={`/catalog?search=${encodeURIComponent(item.search)}`}
              className="shrink-0 w-[84px] sm:w-[92px] group flex flex-col items-center gap-2.5 relative z-0 hover:z-10"
            >
              <div
                className={`w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-2xl bg-gradient-to-br ${item.color}
                            flex items-center justify-center text-white font-bold text-base sm:text-lg
                            shadow-[0_8px_24px_rgba(0,0,0,0.35)] ring-2 ring-white/10
                            group-hover:scale-105 group-hover:ring-[#2B71F3]/50 transition-all duration-200`}
              >
                {item.letter}
              </div>
              <span className="text-[11px] sm:text-xs text-dark-300 group-hover:text-white text-center leading-tight line-clamp-2 w-full transition-colors">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Steam top-up promo — Playerok-style featured block */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <Link
          to="/catalog?search=Steam"
          className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 rounded-2xl bg-dark-900 border border-dark-800
                     px-5 py-5 hover:border-[#2B71F3]/40 transition-colors group"
        >
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1b2838] to-[#2a475e] flex items-center justify-center font-bold text-lg shadow-lg">
              S
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

      {categories?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] || Package;
              return (
                <Link
                  key={cat.id}
                  to={`/catalog?category=${cat.slug}`}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-900 border border-dark-800
                             hover:border-[#2B71F3]/40 text-sm transition-colors"
                >
                  <Icon size={14} className="text-[#2B71F3]" />
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-16">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">Ассортимент</h2>
          <Link to="/catalog" className="flex items-center gap-1 text-[#2B71F3] hover:text-blue-400 text-sm font-medium transition-colors">
            Все лоты <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {listings?.listings?.map((l) => <ListingCard key={l.id} listing={l} />)}
          {(!listings?.listings || listings.listings.length === 0) && (
            <div className="col-span-full text-center text-dark-400 py-12 text-sm">
              Пока нет активных лотов —{' '}
              <Link to="/listings/create" className="text-[#2B71F3] hover:underline">создайте первый</Link>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-dark-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center mb-10">Как работает безопасная сделка</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Search, title: 'Найдите товар', desc: 'Выберите лот в каталоге цифровых товаров и услуг' },
              { icon: Lock, title: 'Оплата в эскроу', desc: 'Средства замораживаются до завершения' },
              { icon: Zap, title: 'Получите товар', desc: 'Вручную или автовыдачей' },
              { icon: CheckCircle2, title: 'Подтвердите', desc: 'Деньги уходят продавцу после проверки' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#2B71F3]/10 text-[#2B71F3] flex items-center justify-center relative">
                  <step.icon size={24} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#2B71F3] text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-dark-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
