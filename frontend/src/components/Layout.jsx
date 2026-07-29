import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Shield, ShoppingBag, Plus, Search, MessageCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';

export default function Layout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/catalog?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-dark-950/80 backdrop-blur-xl border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:block">GameMarket</span>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              className="input pl-9 h-10 text-sm"
              placeholder="Поиск игр, подписок и приложений..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <nav className="hidden md:flex items-center gap-1">
            <Link to="/faq" className="btn-ghost text-sm">FAQ</Link>
            {user?.role === 'admin' && (
              <Link to="/admin/disputes" className="btn-ghost text-sm">Споры</Link>
            )}
          </nav>

          {/* Desktop actions — on mobile these live in the bottom bar */}
          <div className="hidden md:flex items-center gap-1 sm:gap-2 shrink-0">
            {user ? (
              <>
                <Link to="/listings/create" className="btn-primary text-sm flex items-center gap-1.5">
                  <Plus size={15} /> Продать
                </Link>
                <Link to="/chats" className="btn-ghost p-2" title="Чаты">
                  <MessageCircle size={18} />
                </Link>
                <Link to="/transactions" className="btn-ghost p-2" title="Сделки">
                  <ShoppingBag size={18} />
                </Link>
                <Link
                  to={`/users/${user.username}`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  title="Личный кабинет"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-semibold">
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Войти</Link>
                <Link to="/register" className="btn-primary text-sm">Регистрация</Link>
              </>
            )}
          </div>

          {/* Mobile: compact auth when logged out */}
          {!user && (
            <div className="flex md:hidden items-center gap-1 shrink-0">
              <Link to="/login" className="btn-ghost text-sm px-2">Войти</Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>

      <div className="pb-20 md:pb-0">
        <Footer />
      </div>

      <MobileBottomNav />
    </div>
  );
}
