import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Zap, Lock, CheckCircle2, Search, ArrowRight, Coins, User, Package } from 'lucide-react';
import api from '../utils/api';
import ListingCard from '../components/ListingCard';
import Seo from '../components/Seo';

const CATEGORY_ICONS = {
  'game-currency': Coins,
  accounts: User,
  items: Package,
  boosting: Zap,
};

export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: listings } = useQuery({
    queryKey: ['listings', 'featured'],
    queryFn: () => api.get('/listings?limit=8&sort=popular').then((r) => r.data),
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
        title="Торговая площадка игровых товаров"
        description="GameMarket — покупайте и продавайте игровые аккаунты, валюту и предметы безопасно. Эскроу-защита сделок."
        path="/"
      />
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/50 via-dark-950 to-dark-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/10 rounded-full blur-[120px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 badge-blue mb-6 text-sm px-4 py-1.5">
            <Shield size={14} />
            Безопасные сделки с эскроу-защитой
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Торговая площадка<br />
            <span className="text-brand-400">для игровых товаров</span>
          </h1>
          <p className="text-dark-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            Покупайте и продавайте игровые предметы, аккаунты и валюту безопасно.
            Эскроу-система защищает обе стороны сделки.
          </p>
          <form onSubmit={handleSearch} className="flex max-w-xl mx-auto gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                className="input pl-10 h-12 text-base"
                placeholder="Что ищете?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary h-12 px-6">Найти</button>
          </form>
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-dark-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" />Гарантия возврата</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" />Мгновенные сделки</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" />Комиссия 7.5%</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-xl font-bold mb-6">Категории</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] || Package;
              return (
                <Link
                  key={cat.id}
                  to={`/catalog?category=${cat.slug}`}
                  className="card p-4 flex flex-col items-center gap-3 hover:border-brand-500/50 hover:-translate-y-0.5
                             transition-all duration-200 text-center group"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center
                                  group-hover:bg-brand-500/20 transition-colors">
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{cat.name}</p>
                    <p className="text-dark-400 text-xs mt-0.5">{cat.listings_count} лотов</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Popular listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Популярные лоты</h2>
          <Link to="/catalog" className="flex items-center gap-1 text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors">
            Все лоты <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {listings?.listings?.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-dark-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center mb-10">Как работает безопасная сделка</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Search, title: 'Найдите лот', desc: 'Выберите нужный товар в каталоге' },
              { icon: Lock, title: 'Оплата в эскроу', desc: 'Средства замораживаются до завершения сделки' },
              { icon: Zap, title: 'Получите товар', desc: 'Продавец передаёт товар, вы проверяете' },
              { icon: CheckCircle2, title: 'Подтвердите', desc: 'Подтвердите получение — деньги уходят продавцу' },
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
