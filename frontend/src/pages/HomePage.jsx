import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import {
  Zap, ArrowRight, ChevronLeft, ChevronRight,
  Coins, User, Package, Sparkles, Gift, Wallet, Bot, Share2,
} from 'lucide-react';
import api from '../utils/api';
import ListingCard from '../components/ListingCard';
import Seo from '../components/Seo';
import HomeHeroSlider from '../components/HomeHeroSlider';

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

/** Playerok-style horizontal game/service assortment — apps first, then popular games */
const ASSORTMENT = [
  // Apps (playerok.com/apps order)
  { name: 'Steam', search: 'Steam', icon: '/assortment/steam.png' },
  { name: 'Telegram', search: 'Telegram', icon: '/assortment/telegram.png' },
  { name: 'PlayStation', search: 'PlayStation', icon: '/assortment/playstation.png' },
  { name: 'TikTok', search: 'TikTok', icon: '/assortment/tiktok.png' },
  { name: 'App Store', search: 'App Store', icon: '/assortment/app-store.png' },
  { name: 'ChatGPT', search: 'ChatGPT', icon: '/assortment/chatgpt.png' },
  { name: 'Discord', search: 'Discord', icon: '/assortment/discord.png' },
  { name: 'Xbox', search: 'Xbox', icon: '/assortment/xbox.svg' },
  { name: 'Spotify', search: 'Spotify', icon: '/assortment/spotify.png' },
  { name: 'ВКонтакте', search: 'ВКонтакте', icon: '/assortment/vk.svg' },
  { name: 'Нейросети', search: 'Нейросети', icon: '/assortment/ai.svg' },
  { name: 'Claude', search: 'Claude', icon: '/assortment/claude.png' },
  { name: 'Cursor', search: 'Cursor', icon: '/assortment/cursor.svg' },
  { name: 'Windows', search: 'Windows', icon: '/assortment/windows.svg' },
  { name: 'Battle.net', search: 'Battle.net', icon: '/assortment/battlenet.svg' },
  { name: 'Nintendo', search: 'Nintendo', icon: '/assortment/nintendo.svg' },
  { name: 'Faceit', search: 'Faceit', icon: '/assortment/faceit.svg' },
  { name: 'Google Play', search: 'Google Play', icon: '/assortment/google-play.svg' },
  { name: 'YouTube', search: 'YouTube', icon: '/assortment/youtube.svg' },
  { name: 'Adobe', search: 'Adobe', icon: '/assortment/adobe.svg' },
  { name: 'FL Studio', search: 'FL Studio', icon: '/assortment/fl-studio.svg' },
  { name: 'Дизайн', search: 'Дизайн', icon: '/assortment/design.svg' },
  { name: 'Likee', search: 'Likee', icon: '/assortment/likee.svg' },
  { name: 'EA Play', search: 'EA Play', icon: '/assortment/ea-play.svg' },
  { name: 'ExitLag', search: 'ExitLag', icon: '/assortment/exitlag.svg' },
  { name: 'Epic Games', search: 'Epic Games', icon: '/assortment/epic-games.svg' },
  { name: 'Netflix', search: 'Netflix', icon: '/assortment/netflix.svg' },
  { name: 'Ubisoft', search: 'Ubisoft', icon: '/assortment/ubisoft.svg' },
  { name: 'iTunes', search: 'iTunes', icon: '/assortment/itunes.svg' },
  { name: 'Wallpaper Engine', search: 'Wallpaper Engine', icon: '/assortment/wallpaper-engine.svg' },
  { name: 'Дзен', search: 'Дзен', icon: '/assortment/dzen.svg' },
  { name: 'GeForce NOW', search: 'GeForce NOW', icon: '/assortment/geforce-now.svg' },
  { name: 'TeamSpeak', search: 'TeamSpeak', icon: '/assortment/teamspeak.svg' },
  { name: 'Skype', search: 'Skype', icon: '/assortment/skype.svg' },
  { name: 'Yappy', search: 'Yappy', icon: '/assortment/yappy.svg' },
  { name: 'SoundCloud', search: 'SoundCloud', icon: '/assortment/soundcloud.svg' },
  { name: 'Хостинг', search: 'Хостинг', icon: '/assortment/hosting.svg' },
  { name: 'Trovo', search: 'Trovo', icon: '/assortment/trovo.svg' },
  { name: 'Kick', search: 'Kick', icon: '/assortment/kick.svg' },
  { name: 'Snapchat', search: 'Snapchat', icon: '/assortment/snapchat.svg' },
  { name: 'Zoom', search: 'Zoom', icon: '/assortment/zoom.svg' },
  { name: 'WhatsApp', search: 'WhatsApp', icon: '/assortment/whatsapp.svg' },
  { name: 'Twitch', search: 'Twitch', icon: '/assortment/twitch.svg' },
  { name: 'Microsoft Store', search: 'Microsoft Store', icon: '/assortment/microsoft-store.svg' },
  { name: 'Другие приложения', search: 'приложения', icon: '/assortment/other-apps.svg' },
  // Popular games
  { name: 'Roblox', search: 'Roblox', icon: '/assortment/roblox.png' },
  { name: 'PUBG Mobile', search: 'PUBG', icon: '/assortment/pubg-mobile.png' },
  { name: 'Brawl Stars', search: 'Brawl Stars', icon: '/assortment/brawl-stars.png' },
  { name: 'Standoff 2', search: 'Standoff 2', icon: '/assortment/standoff-2.svg' },
  { name: 'Valorant', search: 'Valorant', icon: '/assortment/valorant.png' },
  { name: 'Genshin', search: 'Genshin', icon: '/assortment/genshin.png' },
  { name: 'Fortnite', search: 'Fortnite', icon: '/assortment/fortnite.png' },
  { name: 'Minecraft', search: 'Minecraft', icon: '/assortment/minecraft.png' },
  { name: 'Mobile Legends', search: 'Mobile Legends', icon: '/assortment/mobile-legends.png' },
  { name: 'Clash of Clans', search: 'Clash of Clans', icon: '/assortment/clash-of-clans.svg' },
  { name: 'Clash Royale', search: 'Clash Royale', icon: '/assortment/clash-royale.svg' },
  { name: 'CS2', search: 'Counter-Strike', icon: '/assortment/cs2.svg' },
  { name: 'FC Mobile', search: 'FC Mobile', icon: '/assortment/fc-mobile.svg' },
  { name: 'Dota 2', search: 'Dota 2', icon: '/assortment/dota-2.svg' },
  { name: 'Arena Breakout', search: 'Arena Breakout', icon: '/assortment/arena-breakout.png' },
  { name: 'CoD Mobile', search: 'Call of Duty', icon: '/assortment/cod-mobile.svg' },
  { name: 'Free Fire', search: 'Free Fire', icon: '/assortment/free-fire.svg' },
  { name: 'GTA 5', search: 'GTA', icon: '/assortment/gta-5.svg' },
  { name: 'Warface', search: 'Warface', icon: '/assortment/warface.svg' },
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
        description="Lootz — маркетплейс цифровых товаров и услуг с безопасными сделками через эскроу."
        path="/"
      />

      <HomeHeroSlider />

      {/* Assortment of games & services — Playerok-style */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Игры и сервисы</h2>
          <div className="hidden lg:flex items-center gap-2">
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
                className="w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-2xl overflow-hidden
                            bg-dark-800 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ring-1 ring-white/10
                            group-hover:scale-105 group-hover:ring-[#2B71F3]/50 transition-all duration-200"
              >
                <img
                  src={item.icon}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
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

      <section className="py-6 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">Ассортимент</h2>
          <Link to="/catalog" className="flex items-center gap-1 text-[#2B71F3] hover:text-blue-400 text-sm font-medium transition-colors">
            Все лоты <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {listings?.listings?.map((l) => <ListingCard key={l.id} listing={l} />)}
          {(!listings?.listings || listings.listings.length === 0) && (
            <div className="col-span-full text-center text-dark-400 py-12 text-sm px-4">
              Пока нет активных лотов —{' '}
              <Link to="/listings/create" className="text-[#2B71F3] hover:underline">создайте первый</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
