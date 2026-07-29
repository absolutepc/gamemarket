import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield, Zap, Lock, CheckCircle2, Search, ArrowRight,
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

const POPULAR = [
  { name: 'Steam', color: 'from-sky-600 to-blue-800', slug: 'Steam' },
  { name: 'Telegram', color: 'from-sky-400 to-blue-600', slug: 'Telegram' },
  { name: 'ChatGPT', color: 'from-emerald-500 to-teal-700', slug: 'ChatGPT' },
  { name: 'Claude', color: 'from-orange-500 to-amber-700', slug: 'Claude' },
  { name: 'TikTok', color: 'from-fuchsia-500 to-pink-700', slug: 'TikTok' },
  { name: 'App Store', color: 'from-blue-400 to-indigo-600', slug: 'App Store' },
  { name: 'Roblox', color: 'from-red-500 to-rose-700', slug: 'Roblox' },
  { name: 'PUBG', color: 'from-yellow-500 to-orange-700', slug: 'PUBG' },
  { name: 'Valorant', color: 'from-rose-500 to-red-800', slug: 'Valorant' },
  { name: 'Minecraft', color: 'from-green-500 to-emerald-800', slug: 'Minecraft' },
  { name: 'PlayStation', color: 'from-indigo-500 to-blue-900', slug: 'PlayStation' },
  { name: 'Spotify', color: 'from-green-400 to-emerald-700', slug: 'Spotify' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: listings } = useQuery({
    queryKey: ['listings', 'featured'],
    queryFn: () => api.get('/listings?limit=12&sort=popular').then((r) => r.data),
  });
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/catalog?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div>
      <Seo
        title="Торговая площадка цифровых товаров"
        description="GameMarket — подписки ИИ, Telegram Stars, TikTok монеты, Steam, App Store, аккаунты и игровая валюта. Безопасные сделки с эскроу."
        path="/"
      />

      <section className="relative overflow-hidden border-b border-dark-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,91,255,0.18),_transparent_55%),linear-gradient(180deg,#12121a_0%,#18181f_100%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 badge-blue mb-4 text-sm px-3 py-1">
              <Shield size={14} /> Безопасные сделки · комиссия 7.5%
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              GameMarket
            </h1>
            <p className="text-dark-300 text-base sm:text-lg mb-6 max-w-2xl">
              Подписки ИИ, звёзды Telegram, монеты TikTok, Steam, App Store, аккаунты и игровая валюта — в одном месте.
            </p>
            <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  className="input pl-10 h-12 text-base"
                  placeholder="Поиск игр, подписок и приложений"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary h-12 px-6">Найти</button>
            </form>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {POPULAR.map((item) => (
            <Link
              key={item.slug}
              to={`/catalog?search=${encodeURIComponent(item.slug)}`}
              className={`shrink-0 w-28 h-28 rounded-2xl bg-gradient-to-br ${item.color}
                          flex items-end p-3 font-bold text-sm shadow-lg shadow-black/20
                          hover:scale-[1.03] transition-transform`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </section>

      {categories?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
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
              { icon: Search, title: 'Найдите товар', desc: 'Игры, ИИ, соцсети, подарочные карты' },
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
