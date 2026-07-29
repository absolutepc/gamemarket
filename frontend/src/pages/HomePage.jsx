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

/** Assortment of games & services — Playerok-style horizontal selector */
const ASSORTMENT = [
  { name: 'Steam', search: 'Steam', color: 'from-[#1b2838] to-[#2a475e]', letter: 'S' },
  { name: 'Telegram', search: 'Telegram', color: 'from-[#229ED9] to-[#1a7fb0]', letter: 'T' },
  { name: 'App Store', search: 'App Store', color: 'from-[#147EFB] to-[#0a5ec4]', letter: 'A' },
  { name: 'Roblox', search: 'Roblox', color: 'from-[#E2231A] to-[#a31812]', letter: 'R' },
  { name: 'PUBG', search: 'PUBG', color: 'from-[#F2A900] to-[#c48400]', letter: 'P' },
  { name: 'Brawl Stars', search: 'Brawl Stars', color: 'from-[#F7C948] to-[#e8910f]', letter: 'B' },
  { name: 'Valorant', search: 'Valorant', color: 'from-[#FF4655] to-[#b82e3a]', letter: 'V' },
  { name: 'Minecraft', search: 'Minecraft', color: 'from-[#5D9C3F] to-[#3d6b2a]', letter: 'M' },
  { name: 'TikTok', search: 'TikTok', color: 'from-[#111111] to-[#333333]', letter: '♪' },
  { name: 'ChatGPT', search: 'ChatGPT', color: 'from-[#10A37F] to-[#0d7a5f]', letter: 'G' },
  { name: 'Claude', search: 'Claude', color: 'from-[#D97757] to-[#b45a3d]', letter: 'C' },
  { name: 'PlayStation', search: 'PlayStation', color: 'from-[#003791] to-[#00215a]', letter: 'PS' },
  { name: 'Spotify', search: 'Spotify', color: 'from-[#1DB954] to-[#14833b]', letter: '♪' },
  { name: 'Discord', search: 'Discord', color: 'from-[#5865F2] to-[#3c45a8]', letter: 'D' },
  { name: 'Fortnite', search: 'Fortnite', color: 'from-[#9D4DFF] to-[#6b2fb3]', letter: 'F' },
  { name: 'Genshin', search: 'Genshin', color: 'from-[#4A90D9] to-[#2d5f96]', letter: 'GI' },
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
    el.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <div>
      <Seo
        title="Торговая площадка цифровых товаров"
        description="GameMarket — маркетплейс цифровых товаров и услуг с безопасными сделками через эскроу."
        path="/"
      />

      <section className="relative overflow-hidden border-b border-dark-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,91,255,0.18),_transparent_55%),linear-gradient(180deg,#12121a_0%,#18181f_100%)]" />
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

      {/* Assortment of games & services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Игры и сервисы</h2>
          <div className="hidden sm:flex items-center gap-2">
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
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scroll-smooth"
          style={{ scrollbarWidth: 'none' }}
        >
          {ASSORTMENT.map((item) => (
            <Link
              key={item.search}
              to={`/catalog?search=${encodeURIComponent(item.search)}`}
              className="shrink-0 w-[88px] sm:w-24 group flex flex-col items-center gap-2"
            >
              <div
                className={`w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${item.color}
                            flex items-center justify-center text-white font-bold text-lg sm:text-xl
                            shadow-lg shadow-black/30 ring-2 ring-white/5
                            group-hover:scale-105 group-hover:ring-brand-400/40 transition-all duration-200`}
              >
                {item.letter}
              </div>
              <span className="text-xs text-dark-300 group-hover:text-white text-center leading-tight truncate w-full transition-colors">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {categories?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] || Package;
              return (
                <Link
                  key={cat.id}
                  to={`/catalog?category=${cat.slug}`}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-dark-900 border border-dark-800
                             hover:border-brand-500/40 text-sm transition-colors"
                >
                  <Icon size={14} className="text-brand-400" />
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Популярные предложения</h2>
          <Link to="/catalog" className="flex items-center gap-1 text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors">
            Все лоты <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {listings?.listings?.map((l) => <ListingCard key={l.id} listing={l} />)}
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
                <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center relative">
                  <step.icon size={24} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center">
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
