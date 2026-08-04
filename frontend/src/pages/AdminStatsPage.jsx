import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Store,
  Crown,
  ShoppingBag,
  Shield,
  Activity,
  RefreshCw,
} from 'lucide-react';
import api from '../utils/api';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';

const CARDS = [
  {
    key: 'users',
    title: 'Пользователи',
    hint: 'Все зарегистрированные аккаунты',
    icon: Users,
    accent: 'text-sky-300',
    ring: 'ring-sky-500/20',
  },
  {
    key: 'sellers',
    title: 'Продавцы',
    hint: 'account_type = seller, Founders и админы',
    icon: Store,
    accent: 'text-emerald-300',
    ring: 'ring-emerald-500/20',
  },
  {
    key: 'founders',
    title: 'Founders',
    hint: 'Активный статус Founding Seller',
    icon: Crown,
    accent: 'text-amber-300',
    ring: 'ring-amber-500/20',
  },
  {
    key: 'purchasers',
    title: 'С покупкой',
    hint: 'Хотя бы одна завершённая покупка',
    icon: ShoppingBag,
    accent: 'text-violet-300',
    ring: 'ring-violet-500/20',
  },
  {
    key: 'admins',
    title: 'Админы',
    hint: 'Роли admin и owner',
    icon: Shield,
    accent: 'text-rose-300',
    ring: 'ring-rose-500/20',
  },
];

function formatNum(n) {
  return new Intl.NumberFormat('ru-RU').format(Number(n) || 0);
}

export default function AdminStatsPage() {
  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
    refetchInterval: 20_000,
  });

  const windowMin = data?.online_window_minutes ?? 5;

  return (
    <div className={`${PAGE_WIDTH_CLASS} py-8`}>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <Activity className="text-brand-400" size={22} />
        <h1 className="text-2xl font-bold">Статистика</h1>
        <Link to="/admin" className="ml-auto btn-ghost text-sm">← Админ-панель</Link>
      </div>
      <p className="text-sm text-dark-400 mb-6 max-w-2xl">
        Онлайн — пользователи с активностью за последние {windowMin} мин (запросы к API / чаты).
        Обновляется автоматически.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-dark-400">
        <button
          type="button"
          className="btn-secondary h-9 px-3 inline-flex items-center gap-1.5 text-sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Обновить
        </button>
        {dataUpdatedAt ? (
          <span>
            обновлено{' '}
            {new Date(dataUpdatedAt).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {CARDS.map((c) => (
            <div key={c.key} className="card h-36 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="card p-8 text-center">
          <p className="text-red-300 mb-3">
            {error?.response?.data?.error || 'Не удалось загрузить статистику'}
          </p>
          <button type="button" className="btn-secondary" onClick={() => refetch()}>
            Повторить
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {CARDS.map((c) => {
            const Icon = c.icon;
            const row = data?.[c.key] || { total: 0, online: 0 };
            const onlineShare =
              row.total > 0 ? Math.min(100, Math.round((row.online / row.total) * 100)) : 0;
            return (
              <div
                key={c.key}
                className={`card p-5 ring-1 ${c.ring} flex flex-col gap-4`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-dark-400">{c.title}</p>
                    <p className="text-3xl font-extrabold tabular-nums mt-1 tracking-tight">
                      {formatNum(row.total)}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-dark-800 ${c.accent}`}>
                    <Icon size={20} />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-dark-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                    </span>
                    <span className="text-sm text-dark-300 truncate">Онлайн</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-bold tabular-nums text-emerald-300">
                      {formatNum(row.online)}
                    </span>
                    <span className="text-xs text-dark-500 ml-1.5">{onlineShare}%</span>
                  </div>
                </div>

                <p className="text-[11px] text-dark-500 leading-snug">{c.hint}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
