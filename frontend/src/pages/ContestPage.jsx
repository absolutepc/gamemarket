import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Store, ShoppingBag, Shield } from 'lucide-react';
import Seo from '../components/Seo';
import api from '../utils/api';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';
import useAuthStore from '../store/authStore';

export default function ContestPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ['contest-current'],
    queryFn: () => api.get('/contest/current').then((r) => r.data),
    staleTime: 60_000,
  });

  const contest = data?.contest;
  const stats = data?.stats || {};
  const me = data?.me || {};

  return (
    <div className={`${PAGE_WIDTH_CLASS} py-8 max-w-3xl`}>
      <Seo
        title="Ежемесячный конкурс"
        description="Разыгрываем MacBook среди продавцов и покупателей Lootz. Больше сделок — выше шанс, без публичных рейтингов."
        path="/contest"
      />

      <div className="flex items-center gap-3 mb-4">
        <Trophy className="text-amber-300" size={24} />
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {contest?.title || 'Ежемесячный конкурс'}
        </h1>
      </div>

      <p className="text-dark-300 text-sm sm:text-base leading-relaxed mb-6">
        Каждый месяц разыгрываем два приза: один среди продавцов и один среди покупателей.
        Победитель выбирается случайно, но чем больше завершённых сделок за месяц — тем выше шанс.
        Личные шансы и рейтинги участников не публикуются.
      </p>

      {isLoading ? (
        <div className="card h-32 animate-pulse mb-6" />
      ) : (
        <div className="card p-5 mb-6 space-y-4">
          <div>
            <div className="text-xs text-dark-500 mb-1">Приз продавцам</div>
            <div className="font-semibold text-amber-100">{contest?.prize_sellers || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-dark-500 mb-1">Приз покупателям</div>
            <div className="font-semibold text-amber-100">{contest?.prize_buyers || '—'}</div>
          </div>
          <div className="text-sm text-dark-400">
            Период:{' '}
            {contest?.starts_at
              ? new Date(contest.starts_at).toLocaleDateString('ru-RU')
              : '—'}
            {' — '}
            {contest?.ends_at
              ? new Date(contest.ends_at).toLocaleDateString('ru-RU')
              : '—'}
          </div>

          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl bg-dark-800/60 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-dark-400 mb-1">
                <Store size={14} /> Участников-продавцов
              </div>
              <div className="text-2xl font-extrabold tabular-nums">{stats.sellers_count ?? 0}</div>
            </div>
            <div className="rounded-xl bg-dark-800/60 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-dark-400 mb-1">
                <ShoppingBag size={14} /> Участников-покупателей
              </div>
              <div className="text-2xl font-extrabold tabular-nums">{stats.buyers_count ?? 0}</div>
            </div>
          </div>

          {(contest?.seller_winner_username || contest?.buyer_winner_username) && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm">
              {contest.seller_winner_username ? (
                <p>
                  Победитель среди продавцов:{' '}
                  <Link className="text-emerald-300 hover:underline" to={`/users/${contest.seller_winner_username}`}>
                    {contest.seller_winner_username}
                  </Link>
                </p>
              ) : null}
              {contest.buyer_winner_username ? (
                <p className="mt-1">
                  Победитель среди покупателей:{' '}
                  <Link className="text-emerald-300 hover:underline" to={`/users/${contest.buyer_winner_username}`}>
                    {contest.buyer_winner_username}
                  </Link>
                </p>
              ) : null}
            </div>
          )}
        </div>
      )}

      <div className="card p-5 mb-6">
        <div className="flex items-start gap-2 mb-3">
          <Shield size={16} className="text-brand-400 mt-0.5 shrink-0" />
          <h2 className="font-bold">Как участвовать</h2>
        </div>
        <ul className="space-y-2 text-sm text-dark-300">
          <li>Продавец: завершите хотя бы одну продажу в этом месяце.</li>
          <li>Покупатель: завершите хотя бы одну покупку в этом месяце.</li>
          <li>Один аккаунт может участвовать в обеих категориях отдельно.</li>
          <li>Шансы и места в таблице участникам не показываются.</li>
        </ul>

        {user ? (
          <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-dark-800/50 px-3 py-2.5">
              Как продавец:{' '}
              {me.as_seller?.participating
                ? `участвуете · сделок ${me.as_seller.deals}`
                : 'пока нет завершённых продаж'}
            </div>
            <div className="rounded-xl bg-dark-800/50 px-3 py-2.5">
              Как покупатель:{' '}
              {me.as_buyer?.participating
                ? `участвуете · сделок ${me.as_buyer.deals}`
                : 'пока нет завершённых покупок'}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-dark-400">
            <Link to="/login" className="text-brand-300 hover:underline">Войдите</Link>
            , чтобы увидеть, участвуете ли вы в этом месяце.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/catalog" className="btn-primary h-11 px-5 inline-flex items-center">
          В каталог
        </Link>
        <Link to="/become-seller" className="btn-secondary h-11 px-5 inline-flex items-center">
          Стать продавцом
        </Link>
      </div>
    </div>
  );
}
