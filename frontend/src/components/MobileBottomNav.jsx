import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, ShoppingBag, Plus } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function MobileBottomNav() {
  const { user } = useAuthStore();
  const { pathname } = useLocation();

  const profileTo = user?.username ? `/users/${user.username}` : '/login';
  const chatsTo = user ? '/chats' : '/login';
  const dealsTo = user ? '/transactions' : '/login';
  const sellTo = user ? '/listings/create' : '/login';

  const isChats = pathname.startsWith('/chats');
  const isDeals = pathname.startsWith('/transactions');
  const isSell = pathname.startsWith('/listings/create') || /\/listings\/[^/]+\/edit/.test(pathname);
  const isProfile = user
    ? pathname === `/users/${user.username}` || pathname.startsWith('/wallet')
    : pathname === '/login' || pathname === '/register';

  const items = [
    {
      key: 'chats',
      to: chatsTo,
      label: 'Сообщения',
      active: isChats,
      renderIcon: (active) => (
        <MessageCircle
          size={22}
          strokeWidth={1.75}
          className={active ? 'text-[#5B8CFF]' : 'text-[#A8ADB8]'}
        />
      ),
    },
    {
      key: 'deals',
      to: dealsTo,
      label: 'Сделки',
      active: isDeals,
      renderIcon: (active) => (
        <ShoppingBag
          size={22}
          strokeWidth={1.75}
          className={active ? 'text-[#5B8CFF]' : 'text-[#A8ADB8]'}
        />
      ),
    },
    {
      key: 'sell',
      to: sellTo,
      label: 'Продать',
      active: isSell,
      renderIcon: (active) => (
        <span
          className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center ${
            active ? 'border-[#5B8CFF] text-[#5B8CFF]' : 'border-[#A8ADB8] text-[#A8ADB8]'
          }`}
        >
          <Plus size={14} strokeWidth={2.25} />
        </span>
      ),
    },
    {
      key: 'profile',
      to: profileTo,
      label: 'Профиль',
      active: isProfile,
      renderIcon: (active) => (
        user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className={`w-7 h-7 rounded-full object-cover ring-1 ring-white/15 ${
              active ? 'ring-2 ring-[#5B8CFF] ring-offset-1 ring-offset-[#1a1b20]' : ''
            }`}
          />
        ) : (
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold ring-1 ring-white/10 ${
              active ? 'bg-[#5B8CFF] text-white' : 'bg-[#2a2c33] text-[#A8ADB8]'
            }`}
          >
            {user?.username?.[0]?.toUpperCase() || '?'}
          </span>
        )
      ),
    },
  ];

  return (
    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-[60] pointer-events-none"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      aria-label="Нижняя навигация"
    >
      <div className="pointer-events-auto mx-auto w-[min(100%-1.25rem,440px)]">
        <div
          className="flex items-center justify-between rounded-[28px] px-1.5 py-1.5
                     bg-[#1a1b20]/92 border border-white/10
                     backdrop-blur-2xl
                     shadow-[0_10px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)]"
        >
          {items.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-full
                         active:scale-[0.96] transition-transform"
            >
              {item.renderIcon(item.active)}
              <span
                className={`text-[10px] leading-none font-medium ${
                  item.active ? 'text-[#5B8CFF]' : 'text-[#A8ADB8]'
                }`}
              >
                {item.label}
              </span>
              {item.active && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-7 h-[2px] rounded-full bg-[#5B8CFF]
                                 shadow-[0_0_10px_rgba(91,140,255,0.9)]" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
