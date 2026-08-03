import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trophy, Dices, Store, ShoppingBag, RefreshCw, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';

function formatPct(n) {
  const v = Number(n) || 0;
  if (v < 0.01 && v > 0) return '<0.01%';
  return `${v.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}%`;
}

function currentMonthSlug() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function AdminContestPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('sellers');

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-contest-current'],
    queryFn: () => api.get('/admin/contests/current').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const drawMutation = useMutation({
    mutationFn: (side) =>
      api.post(`/admin/contests/${data.contest.id}/draw`, { side }).then((r) => r.data),
    onSuccess: (res) => {
      toast.success(
        res.winner?.username
          ? `Победитель (${res.side === 'sellers' ? 'продавцы' : 'покупатели'}): ${res.winner.username}`
          : 'Розыгрыш выполнен'
      );
      qc.invalidateQueries({ queryKey: ['admin-contest-current'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка розыгрыша'),
  });

  const startMutation = useMutation({
    mutationFn: () => api.post('/admin/contests/start', {}).then((r) => r.data),
    onSuccess: (res) => {
      toast.success(res.message || (res.created ? 'Конкурс создан' : 'Конкурс уже активен'));
      qc.invalidateQueries({ queryKey: ['admin-contest-current'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Не удалось запустить конкурс'),
  });

  const contest = data?.contest;
  const stats = data?.stats || {};
  const rows = tab === 'sellers' ? data?.sellers || [] : data?.buyers || [];
  const winnerUsername =
    tab === 'sellers' ? contest?.seller_winner_username : contest?.buyer_winner_username;
  const alreadyDrawn = Boolean(
    tab === 'sellers' ? contest?.seller_drawn_at : contest?.buyer_drawn_at
  );
  const monthSlug = currentMonthSlug();
  const isThisMonthActive =
    contest?.slug === monthSlug
    && contest?.status === 'active'
    && contest?.starts_at
    && contest?.ends_at
    && new Date(contest.starts_at) <= new Date()
    && new Date(contest.ends_at) > new Date();

  const runDraw = () => {
    const label = tab === 'sellers' ? 'продавцов' : 'покупателей';
    if (
      !window.confirm(
        `Провести взвешенный розыгрыш среди ${label}? Победитель выбирается случайно; вес = число завершённых сделок за период.`
      )
    ) {
      return;
    }
    drawMutation.mutate(tab);
  };

  const runStart = () => {
    if (
      !window.confirm(
        isThisMonthActive
          ? `Конкурс ${monthSlug} уже активен. Нажать всё равно? (ничего не сломает — операция безопасна)`
          : `Создать / активировать конкурс на ${monthSlug}? Новый месяц также поднимается автоматически.`
      )
    ) {
      return;
    }
    startMutation.mutate();
  };

  return (
    <div className={`${PAGE_WIDTH_CLASS} py-8`}>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <Trophy className="text-amber-300" size={22} />
        <h1 className="text-2xl font-bold">Конкурс</h1>
        <Link to="/admin" className="ml-auto btn-ghost text-sm">← Админ-панель</Link>
      </div>
      <p className="text-sm text-dark-400 mb-6 max-w-3xl">
        Период — календарный месяц (UTC). Новый конкурс создаётся автоматически при смене месяца.
        Кнопка «Начать конкурс» — ручной запасной вариант. Розыгрыш победителей по-прежнему ручной.
      </p>

      {isLoading ? (
        <div className="card h-40 animate-pulse" />
      ) : isError ? (
        <div className="card p-8 text-center">
          <p className="text-red-300 mb-3">
            {error?.response?.data?.error || 'Не удалось загрузить конкурс'}
          </p>
          <button type="button" className="btn-secondary" onClick={() => refetch()}>
            Повторить
          </button>
        </div>
      ) : (
        <>
          <div className="card p-5 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{contest?.title}</h2>
                <p className="text-sm text-dark-400 mt-1">
                  {contest?.starts_at
                    ? new Date(contest.starts_at).toLocaleDateString('ru-RU')
                    : '—'}
                  {' — '}
                  {contest?.ends_at
                    ? new Date(contest.ends_at).toLocaleDateString('ru-RU')
                    : '—'}
                  {' · '}
                  <span className="text-dark-300">{contest?.status}</span>
                  {contest?.slug ? (
                    <span className="text-dark-500"> · {contest.slug}</span>
                  ) : null}
                </p>
                <p className="text-sm text-dark-300 mt-2">
                  Приз продавцам: {contest?.prize_sellers || '—'}
                  <br />
                  Приз покупателям: {contest?.prize_buyers || '—'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary h-9 px-3 inline-flex items-center gap-1.5 text-sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                >
                  <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                  Обновить
                </button>
                <button
                  type="button"
                  className="btn-primary h-9 px-3 inline-flex items-center gap-1.5 text-sm"
                  onClick={runStart}
                  disabled={startMutation.isPending}
                  title="Создать конкурс текущего месяца, если его ещё нет"
                >
                  <Play size={14} />
                  {startMutation.isPending
                    ? 'Запуск…'
                    : isThisMonthActive
                      ? 'Конкурс активен'
                      : 'Начать конкурс'}
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mt-5">
              <div className="rounded-xl bg-dark-800/70 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-dark-400 mb-1">
                  <Store size={14} /> Продавцы
                </div>
                <div className="text-2xl font-extrabold tabular-nums">
                  {stats.sellers_count ?? 0}
                  <span className="text-sm font-medium text-dark-400 ml-2">
                    · сделок {stats.sellers_deals ?? 0}
                  </span>
                </div>
                {contest?.seller_winner_username ? (
                  <p className="text-sm text-emerald-300 mt-1">
                    Победитель: {contest.seller_winner_username}
                  </p>
                ) : null}
              </div>
              <div className="rounded-xl bg-dark-800/70 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-dark-400 mb-1">
                  <ShoppingBag size={14} /> Покупатели
                </div>
                <div className="text-2xl font-extrabold tabular-nums">
                  {stats.buyers_count ?? 0}
                  <span className="text-sm font-medium text-dark-400 ml-2">
                    · сделок {stats.buyers_deals ?? 0}
                  </span>
                </div>
                {contest?.buyer_winner_username ? (
                  <p className="text-sm text-emerald-300 mt-1">
                    Победитель: {contest.buyer_winner_username}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {[
              { id: 'sellers', label: 'Продавцы', icon: Store },
              { id: 'buyers', label: 'Покупатели', icon: ShoppingBag },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTab(f.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${
                    tab === f.id ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-300 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  {f.label}
                </button>
              );
            })}
            <button
              type="button"
              className="ml-auto btn-primary h-10 px-4 inline-flex items-center gap-1.5"
              disabled={drawMutation.isPending || alreadyDrawn || !rows.length}
              onClick={runDraw}
            >
              <Dices size={16} />
              {alreadyDrawn ? `Уже выбран: ${winnerUsername || '—'}` : 'Разыграть'}
            </button>
          </div>

          {!rows.length ? (
            <div className="card p-8 text-center text-dark-400">Пока нет участников</div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-dark-400 border-b border-dark-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Участник</th>
                      <th className="px-4 py-3 font-medium">Сделки</th>
                      <th className="px-4 py-3 font-medium">Вес</th>
                      <th className="px-4 py-3 font-medium">Шанс</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800">
                    {rows.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={
                          winnerUsername && p.username === winnerUsername
                            ? 'bg-emerald-500/10'
                            : ''
                        }
                      >
                        <td className="px-4 py-2.5 text-dark-500 tabular-nums">{idx + 1}</td>
                        <td className="px-4 py-2.5">
                          <Link to={`/users/${p.username}`} className="font-medium hover:text-brand-400">
                            {p.username}
                          </Link>
                          <div className="text-[11px] text-dark-500">{p.email}</div>
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">{p.deals}</td>
                        <td className="px-4 py-2.5 tabular-nums">{p.weight}</td>
                        <td className="px-4 py-2.5 tabular-nums font-semibold text-amber-200">
                          {formatPct(p.chance_percent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
