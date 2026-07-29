import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, ShoppingBag, PlusCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function MobileBottomNav() {
  const { user } = useAuthStore();
  const { pathname } = useLocation();

  const profileTo = user ? `/users/${user.username}` : '/login';
  const chatsTo = user ? '/chats' : '/login';
  const dealsTo = user ? '/transactions' : '/login';
  const sellTo = user ? '/listings/create' : '/login';

  const isChats = pathname.startsWith('/chats');
  const isDeals = pathname.startsWith('/transactions');
  const isSell = pathname.startsWith('/listings/create') || pathname.includes('/edit');
  const isProfile = user
    ? pathname === `/users/${user.username}` || pathname.startsWith('/wallet') || pathname.startsWith('/settings')
    : pathname === '/login' || pathname === '/register';

  const items = [
    {
      key: 'chats',
      to: chatsTo,
      label: 'Сообщения',
      active: isChats,
      icon: (active) => (
        <MessageCircle size={22} strokeWidth={active ? 2.25 : 1.75} className={active ? 'text-[#2B71F3]' : 'text-dark-300'} />
      ),
    },
    {
      key: 'deals',
      to: dealsTo,
      label: 'Сделки',
      active: isDeals,
      icon: (active) => (
        <ShoppingBag size={22} strokeWidth={active ? 2.25 : 1.75} className={active ? 'text-[#2B71F3]' : 'text-dark-300'} />
      ),
    },
    {
      key: 'sell',
      to: sellTo,
      label: 'Продать',
      active: isSell,
      icon: (active) => (
        <PlusCircle size={22} strokeWidth={active ? 2.25 : 1.75} className={active ? 'text-[#2B71F3]' : 'text-dark-300'} />
      ),
    },
    {
      key: 'profile',
      to: profileTo,
      label: 'Профиль',
      active: isProfile,
      icon: (active) => (
        user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className={`w-[22px] h-[22px] rounded-full object-cover ${active ? 'ring-2 ring-[#2B71F3]' : 'ring-1 ring-dark-600'}`}
          />
        ) : (
          <div
            className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold ${
              active
                ? 'bg-[#2B71F3] text-white'
                : 'bg-dark-700 text-dark-300'
            }`}
          >
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
        )
      ),
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[min(100%-1.5rem,420px)]"
      aria-label="Мобильная навигация"
    >
      <div className="flex items-stretch justify-between gap-1 rounded-full bg-[#14151a]/95 border border-dark-700/80
                      backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.55)] px-2 py-1.5">
        {items.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-full
                       transition-colors active:scale-95"
          >
            {item.icon(item.active)}
            <span
              className={`text-[10px] leading-none font-medium ${
                item.active ? 'text-[#2B71F3]' : 'text-dark-400'
              }`}
            >
              {item.label}
            </span>
            {item.active && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#2B71F3] shadow-[0_0_8px_rgba(43,113,243,0.8)]" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
