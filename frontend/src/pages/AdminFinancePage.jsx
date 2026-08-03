import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Wallet,
  RefreshCw,
  ArrowDownToLine,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';
import { formatRelative } from '../utils/format';

const TYPE_LABEL = {
  sale_fee: 'Комиссия',
  listing_promote: 'ТОП',
  adjustment: 'Корректировка',
  withdrawal: 'Вывод',
  withdrawal_reversal: 'Отмена вывода',
};

function money(n) {
  return `${new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0)} ₽`;
}

export default function AdminFinancePage() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('');
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    method: 'card',
    destination: '',
    note: '',
  });
  const [adjustForm, setAdjustForm] = useState({ amount: '', description: '' });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-finance', typeFilter],
    queryFn: () =>
      api
        .get('/admin/finance', {
          params: {
            limit: 100,
            entry_type: typeFilter || undefined,
          },
        })
        .then((r) => r.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-finance'] });

  const withdrawMutation = useMutation({
    mutationFn: (body) => api.post('/admin/finance/withdrawals', body).then((r) => r.data),
    onSuccess: () => {
      toast.success('Заявка на вывод создана (pending)');
      setWithdrawForm({ amount: '', method: 'card', destination: '', note: '' });
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const processMutation = useMutation({
    mutationFn: ({ id, status, admin_note }) =>
      api.post(`/admin/finance/withdrawals/${id}/process`, { status, admin_note }).then((r) => r.data),
    onSuccess: (_res, vars) => {
      toast.success(
        vars.status === 'paid' ? 'Вывод отмечен как оплаченный' : 'Заявка обновлена'
      );
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const adjustMutation = useMutation({
    mutationFn: (body) => api.post('/admin/finance/adjustments', body).then((r) => r.data),
    onSuccess: () => {
      toast.success('Корректировка записана');
      setAdjustForm({ amount: '', description: '' });
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const balance = data?.balance || { balance: 0, credits: 0, debits: 0 };
  const breakdown = data?.breakdown || {};
  const items = data?.ledger?.items || [];
  const withdrawals = data?.withdrawals || [];

  return (
    <div className={`${PAGE_WIDTH_CLASS} py-8`}>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <Wallet className="text-emerald-300" size={22} />
        <h1 className="text-2xl font-bold">Финансы площадки</h1>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link to="/admin/stats" className="btn-ghost text-sm">Статистика</Link>
          <Link to="/admin/contest" className="btn-ghost text-sm">Конкурс</Link>
          <Link to="/admin/founders" className="btn-ghost text-sm">Founders</Link>
        </div>
      </div>
      <p className="text-sm text-dark-400 mb-6 max-w-3xl">
        Учётный баланс комиссий и ТОП. Реальные деньги — на счёте платёжного провайдера / юрлица.
        Заявка на вывод фиксирует намерение; перевод на карту делает бухгалтерия или PSP.
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
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-28 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="card p-8 text-center mb-6">
          <p className="text-red-300 mb-3">
            {error?.response?.data?.error || 'Не удалось загрузить финансы'}
          </p>
          <button type="button" className="btn-secondary" onClick={() => refetch()}>
            Повторить
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card p-5 ring-1 ring-emerald-500/20">
              <p className="text-sm text-dark-400">Доступный баланс</p>
              <p className="text-3xl font-extrabold tabular-nums mt-1 text-emerald-300">
                {money(balance.balance)}
              </p>
              <p className="text-[11px] text-dark-500 mt-2">credits − debits (учётный)</p>
            </div>
            <div className="card p-5 ring-1 ring-sky-500/20">
              <p className="text-sm text-dark-400">Начислено</p>
              <p className="text-3xl font-extrabold tabular-nums mt-1">{money(balance.credits)}</p>
              <p className="text-[11px] text-dark-500 mt-2">
                комиссия {money(breakdown.sale_fee || 0)} · ТОП {money(breakdown.listing_promote || 0)}
              </p>
            </div>
            <div className="card p-5 ring-1 ring-amber-500/20">
              <p className="text-sm text-dark-400">Списано</p>
              <p className="text-3xl font-extrabold tabular-nums mt-1">{money(balance.debits)}</p>
              <p className="text-[11px] text-dark-500 mt-2">
                выводы {money(Math.abs(breakdown.withdrawal || 0))}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-8">
            <div className="card p-5">
              <h2 className="font-bold mb-3 inline-flex items-center gap-2">
                <ArrowDownToLine size={16} className="text-amber-300" /> Заявка на вывод
              </h2>
              <div className="space-y-3">
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Сумма, ₽"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm((f) => ({ ...f, amount: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Способ (card / bank / SBP…)"
                  value={withdrawForm.method}
                  onChange={(e) => setWithdrawForm((f) => ({ ...f, method: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Реквизиты (маскированная карта / счёт)"
                  value={withdrawForm.destination}
                  onChange={(e) => setWithdrawForm((f) => ({ ...f, destination: e.target.value }))}
                />
                <textarea
                  className="input min-h-[72px]"
                  placeholder="Комментарий"
                  value={withdrawForm.note}
                  onChange={(e) => setWithdrawForm((f) => ({ ...f, note: e.target.value }))}
                />
                <button
                  type="button"
                  className="btn-primary h-10 px-4"
                  disabled={withdrawMutation.isPending || !withdrawForm.amount}
                  onClick={() =>
                    withdrawMutation.mutate({
                      amount: Number(withdrawForm.amount),
                      method: withdrawForm.method || 'card',
                      destination: withdrawForm.destination || undefined,
                      note: withdrawForm.note || undefined,
                    })
                  }
                >
                  Создать заявку
                </button>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-bold mb-3 inline-flex items-center gap-2">
                <Plus size={16} className="text-sky-300" />
                <Minus size={16} className="text-rose-300" />
                Корректировка
              </h2>
              <div className="space-y-3">
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  placeholder="Сумма (+ начисление / − списание)"
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, amount: e.target.value }))}
                />
                <textarea
                  className="input min-h-[72px]"
                  placeholder="Описание корректировки"
                  value={adjustForm.description}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, description: e.target.value }))}
                />
                <button
                  type="button"
                  className="btn-secondary h-10 px-4"
                  disabled={adjustMutation.isPending || !adjustForm.amount || !adjustForm.description.trim()}
                  onClick={() =>
                    adjustMutation.mutate({
                      amount: Number(adjustForm.amount),
                      description: adjustForm.description.trim(),
                    })
                  }
                >
                  Записать
                </button>
              </div>
            </div>
          </div>

          <h2 className="font-bold text-lg mb-3">Заявки на вывод</h2>
          {!withdrawals.length ? (
            <div className="card p-6 text-center text-dark-400 text-sm mb-8">Заявок пока нет</div>
          ) : (
            <div className="flex flex-col gap-3 mb-8">
              {withdrawals.map((w) => (
                <div key={w.id} className="card p-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold tabular-nums">{money(w.amount)}</p>
                    <p className="text-sm text-dark-400 mt-1">
                      {w.method}
                      {w.destination ? ` · ${w.destination}` : ''}
                      {' · '}
                      {formatRelative(w.created_at)}
                      {w.created_by_username ? ` · ${w.created_by_username}` : ''}
                    </p>
                    {w.note ? <p className="text-xs text-dark-500 mt-1">{w.note}</p> : null}
                    <span
                      className={
                        w.status === 'pending'
                          ? 'badge-yellow mt-2'
                          : w.status === 'paid'
                            ? 'badge-green mt-2'
                            : 'badge-red mt-2'
                      }
                    >
                      {w.status}
                    </span>
                  </div>
                  {w.status === 'pending' ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-primary h-9 px-3 inline-flex items-center gap-1.5 text-sm"
                        disabled={processMutation.isPending}
                        onClick={() => {
                          if (!window.confirm('Отметить вывод как оплаченный? Сумма спишется с учётного баланса.')) {
                            return;
                          }
                          processMutation.mutate({ id: w.id, status: 'paid' });
                        }}
                      >
                        <CheckCircle size={14} /> Оплачено
                      </button>
                      <button
                        type="button"
                        className="btn-secondary h-9 px-3 inline-flex items-center gap-1.5 text-sm text-red-300"
                        disabled={processMutation.isPending}
                        onClick={() => processMutation.mutate({ id: w.id, status: 'cancelled' })}
                      >
                        <XCircle size={14} /> Отменить
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h2 className="font-bold text-lg mr-2">Детализация</h2>
            {[
              { id: '', label: 'Все' },
              { id: 'sale_fee', label: 'Комиссии' },
              { id: 'listing_promote', label: 'ТОП' },
              { id: 'withdrawal', label: 'Выводы' },
              { id: 'adjustment', label: 'Корректировки' },
            ].map((f) => (
              <button
                key={f.id || 'all'}
                type="button"
                onClick={() => setTypeFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
                  typeFilter === f.id
                    ? 'bg-brand-500 text-white'
                    : 'bg-dark-800 text-dark-300 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {!items.length ? (
            <div className="card p-8 text-center text-dark-400">Записей пока нет</div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-dark-400 border-b border-dark-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Дата</th>
                      <th className="px-4 py-3 font-medium">Тип</th>
                      <th className="px-4 py-3 font-medium">Описание</th>
                      <th className="px-4 py-3 font-medium text-right">Сумма</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800">
                    {items.map((row) => {
                      const signed =
                        row.direction === 'credit' ? Number(row.amount) : -Number(row.amount);
                      return (
                        <tr key={row.id}>
                          <td className="px-4 py-2.5 text-dark-400 whitespace-nowrap">
                            {formatRelative(row.created_at)}
                          </td>
                          <td className="px-4 py-2.5">
                            {TYPE_LABEL[row.entry_type] || row.entry_type}
                          </td>
                          <td className="px-4 py-2.5 text-dark-300 max-w-md">
                            <div className="truncate" title={row.description || ''}>
                              {row.description || '—'}
                            </div>
                            {row.reference_id ? (
                              <div className="text-[11px] text-dark-500 mt-0.5">
                                {row.reference_type || 'ref'}: {String(row.reference_id).slice(0, 8)}…
                                {row.meta?.listing_id ? (
                                  <>
                                    {' · '}
                                    <Link
                                      to={`/listings/${row.meta.listing_id}`}
                                      className="text-brand-300 hover:underline"
                                    >
                                      лот
                                    </Link>
                                  </>
                                ) : null}
                                {row.reference_type === 'transaction' ? (
                                  <>
                                    {' · '}
                                    <Link
                                      to={`/transactions/${row.reference_id}`}
                                      className="text-brand-300 hover:underline"
                                    >
                                      сделка
                                    </Link>
                                  </>
                                ) : null}
                              </div>
                            ) : null}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right tabular-nums font-semibold ${
                              signed >= 0 ? 'text-emerald-300' : 'text-rose-300'
                            }`}
                          >
                            {signed >= 0 ? '+' : ''}
                            {money(signed)}
                          </td>
                        </tr>
                      );
                    })}
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
