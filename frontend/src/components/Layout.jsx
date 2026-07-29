import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Shield, ShoppingBag, Plus, Wallet, Search, MessageCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { formatPrice } from '../utils/format';
import Footer from './Footer';
import ProfileMenuModal from './ProfileMenuModal';

export default function Layout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

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
            <Link to="/catalog" className="btn-ghost text-sm">Каталог</Link>
            <Link to="/faq" className="btn-ghost text-sm">FAQ</Link>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {user ? (
              <>
                <Link to="/listings/create" className="btn-primary text-sm hidden sm:flex items-center gap-1.5">
                  <Plus size={15} /> Продать
                </Link>
                <Link to="/wallet" className="btn-secondary text-sm hidden sm:flex items-center gap-1.5">
                  <Wallet size={15} />
                  {formatPrice(user.balance)}
                </Link>
                <Link to="/chats" className="btn-ghost p-2" title="Чаты">
                  <MessageCircle size={18} />
                </Link>
                <Link to="/transactions" className="btn-ghost p-2" title="Сделки">
                  <ShoppingBag size={18} />
                </Link>
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  title="Меню профиля"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-semibold">
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Войти</Link>
                <Link to="/register" className="btn-primary text-sm">Регистрация</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <ProfileMenuModal open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
