import { Link } from 'react-router-dom';
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

export default function HomePage() {
  const { data: listings } = useQuery({
    queryKey: ['listings', 'featured'],
    queryFn: () => api.get('/listings?limit=12&sort=popular').then((r) => r.data),
  });
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

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

      {categories?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2">
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
