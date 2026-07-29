import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Shield, ShoppingBag, Bell, User, LogOut, Plus, Wallet, Menu, X, Search } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { formatPrice } from '../utils/format';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/catalog?search=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
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
              placeholder="Поиск лотов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <nav className="hidden md:flex items-center gap-1">
            <Link to="/catalog" className="btn-ghost text-sm">Каталог</Link>
            <Link to="/faq" className="btn-ghost text-sm">FAQ</Link>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <Link to="/listings/create" className="btn-primary text-sm hidden sm:flex items-center gap-1.5">
                  <Plus size={15} /> Продать
                </Link>
                <Link to="/wallet" className="btn-secondary text-sm hidden sm:flex items-center gap-1.5">
                  <Wallet size={15} />
                  {formatPrice(user.balance)}
                </Link>
                <Link to="/transactions" className="btn-ghost p-2">
                  <ShoppingBag size={18} />
                </Link>
                <Link to={`/users/${user.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-semibold">
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                </Link>
                <button onClick={handleLogout} className="btn-ghost p-2 text-dark-400 hover:text-red-400">
                  <LogOut size={16} />
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

      <footer className="border-t border-dark-800 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center">
                <Shield size={12} className="text-white" />
              </div>
              <span className="font-semibold">GameMarket</span>
              <span className="text-dark-400 text-sm">— безопасные сделки</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-dark-400">
              <span>© 2026 GameMarket</span>
              <Link to="/rules" className="hover:text-white transition-colors">Правила</Link>
              <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
              <Link to="/support" className="hover:text-white transition-colors">Поддержка</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
