import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Search, MessageCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import ThemeToggle from './ThemeToggle';
import BrandJsonLd from './BrandJsonLd';
import { PAGE_WIDTH_CLASS } from './ListingCard';

/** Product detail: /listings/:id (not create/edit) */
function isListingDetailPath(pathname) {
  return /^\/listings\/[^/]+$/.test(pathname);
}

function isListingWizardPath(pathname) {
  return pathname === '/listings/create' || /\/listings\/[^/]+\/edit$/.test(pathname);
}

export default function Layout() {
  const { user, accessToken, hydrateUser } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [search, setSearch] = useState('');
  const listingDetail = isListingDetailPath(pathname);
  const listingWizard = isListingWizardPath(pathname);
  // Product detail + sell wizard: hide site header on mobile only (desktop keeps Playerok-style nav)
  const hideHeaderMobile = listingDetail || listingWizard;

  useEffect(() => {
    if (accessToken) hydrateUser();
  }, [accessToken, hydrateUser]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/catalog?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <BrandJsonLd />
      <header
        className={`sticky top-0 z-50 bg-dark-950/80 backdrop-blur-xl border-b border-dark-800 ${
          hideHeaderMobile ? 'hidden lg:block' : ''
        }`}
      >
        <div className={`${PAGE_WIDTH_CLASS} py-3.5 lg:py-0 lg:h-20 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5`}>
          {/* Top row: brand + theme; actions on the right */}
          <div className="flex items-center justify-between gap-3 lg:contents">
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <Link
                to="/"
                className="flex items-center gap-2.5 no-underline"
                aria-label="Lootz — маркетплейс игровых товаров и услуг"
              >
                <span className="font-bold text-2xl lg:text-[1.75rem] leading-none tracking-tight text-[#5B8CFF]">
                  Lootz
                </span>
              </Link>
              <ThemeToggle />
            </div>

            <div className="flex items-center gap-2 lg:order-last shrink-0">
              <nav className="hidden lg:flex items-center gap-1">
                <Link to="/about" className="btn-ghost text-sm">О Lootz</Link>
                <Link to="/faq" className="btn-ghost text-sm">FAQ</Link>
                {user?.role === 'admin' && (
                  <>
                    <Link to="/admin/assortment" className="btn-ghost text-sm">Каталог</Link>
                    <Link to="/admin/disputes" className="btn-ghost text-sm">Споры</Link>
                  </>
                )}
              </nav>

              <div className="hidden lg:flex items-center gap-1 sm:gap-2">
                {user ? (
                  <>
                    <Link to="/listings/create" className="btn-primary text-sm flex items-center gap-1.5 h-11 px-4">
                      <Plus size={16} /> Продать
                    </Link>
                    <Link to="/chats" className="btn-ghost p-2.5" title="Чаты">
                      <MessageCircle size={20} />
                    </Link>
                    <Link to="/transactions" className="btn-ghost p-2.5" title="Сделки">
                      <ShoppingBag size={20} />
                    </Link>
                    <Link
                      to={user.username ? `/users/${user.username}` : '/login'}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      title="Личный кабинет"
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-semibold">
                          {(user.username?.[0] || '?').toUpperCase()}
                        </div>
                      )}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn-ghost text-sm h-11 px-3 inline-flex items-center">Войти</Link>
                    <Link to="/register" className="btn-primary text-sm h-11 px-4 inline-flex items-center">Регистрация</Link>
                  </>
                )}
              </div>

              {!user && (
                <Link to="/login" className="lg:hidden btn-ghost text-sm px-2">Войти</Link>
              )}
            </div>
          </div>

          {/* Search — full width below brand on mobile; center on desktop */}
          <form onSubmit={handleSearch} className="w-full lg:flex-1 lg:max-w-2xl lg:mx-auto relative order-last lg:order-none">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              className="input pl-10 h-11 text-sm lg:text-base rounded-full lg:rounded-xl"
              placeholder="Поиск игр, подписок и приложений..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        </div>
      </header>

      <main className={
        listingWizard
          ? 'flex-1'
          : listingDetail
            ? 'flex-1 pb-8 lg:pb-0'
            : 'flex-1 pb-28 lg:pb-0'
      }>
        <Outlet />
      </main>

      {!listingWizard && (
        <>
          <div className={`pb-24 lg:pb-0 ${listingDetail ? '[&>footer]:mt-6' : ''}`}>
            <Footer />
          </div>
          <MobileBottomNav />
        </>
      )}
    </div>
  );
}
