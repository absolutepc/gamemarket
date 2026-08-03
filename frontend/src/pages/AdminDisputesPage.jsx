import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Scale, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatPrice, formatRelative } from '../utils/format';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';

const REASON_LABELS = {
  not_received: 'Товар не получен',
  not_as_described: 'Не соответствует описанию',
  fraud: 'Мошенничество',
  other: 'Другое',
};

export default function AdminDisputesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('open');
  const [forms, setForms] = useState({});

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['admin-disputes', filter],
    queryFn: () => api.get(`/admin/disputes?status=${filter}`).then((r) => r.data),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, winner, resolution }) =>
      api.post(`/admin/disputes/${id}/resolve`, { winner, resolution }),
    onSuccess: () => {
      toast.success('Спор решён');
      qc.invalidateQueries(['admin-disputes']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const setForm = (id, patch) => {
    setForms((prev) => ({ ...prev, [id]: { winner: 'buyer', resolution: '', ...prev[id], ...patch } }));
  };

  return (
    <div className={`${PAGE_WIDTH_CLASS} py-8`}>
      <div className="flex items-center gap-3 mb-6">
        <Scale className="text-brand-400" size={22} />
        <h1 className="text-2xl font-bold">Разбор споров</h1>
        <Link to="/admin/stats" className="ml-auto btn-ghost text-sm">Статистика</Link>
        <Link to="/admin/assortment" className="btn-ghost text-sm">Каталог</Link>
        <Link to="/admin/founders" className="btn-ghost text-sm">Founders</Link>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { id: 'open', label: 'Открытые' },
          { id: 'resolved', label: 'Решённые' },
          { id: 'all', label: 'Все' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.id ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-300 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card h-40 animate-pulse" />
      ) : disputes.length === 0 ? (
        <div className="card p-8 text-center text-dark-400">Споров нет</div>
      ) : (
        <div className="flex flex-col gap-4">
          {disputes.map((d) => {
            const form = forms[d.id] || { winner: 'buyer', resolution: '' };
            return (
              <div key={d.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <Link to={`/transactions/${d.transaction_id}`} className="font-semibold hover:text-brand-400">
                      {d.listing_title}
                    </Link>
                    <p className="text-sm text-dark-400 mt-1">
                      {REASON_LABELS[d.reason] || d.reason} · {formatRelative(d.created_at)}
                    </p>
                  </div>
                  <span className={d.status === 'open' ? 'badge-red' : 'badge-green'}>
                    {d.status === 'open' ? 'Открыт' : 'Решён'}
                  </span>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-dark-500">Покупатель</span>
                    <p className="font-medium">{d.buyer_username}</p>
                  </div>
                  <div>
                    <span className="text-dark-500">Продавец</span>
                    <p className="font-medium">{d.seller_username}</p>
                  </div>
                  <div>
                    <span className="text-dark-500">Сумма</span>
                    <p className="font-medium">{formatPrice(d.amount)}</p>
                  </div>
                </div>

                <p className="text-sm text-dark-300 mb-4 whitespace-pre-wrap">{d.description}</p>

                {d.status === 'open' ? (
                  <div className="border-t border-dark-800 pt-4 space-y-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setForm(d.id, { winner: 'buyer' })}
                        className={`btn-secondary text-sm flex items-center gap-1.5 ${
                          form.winner === 'buyer' ? 'border-emerald-500/50 text-emerald-400' : ''
                        }`}
                      >
                        <CheckCircle size={14} /> В пользу покупателя
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(d.id, { winner: 'seller' })}
                        className={`btn-secondary text-sm flex items-center gap-1.5 ${
                          form.winner === 'seller' ? 'border-brand-500/50 text-brand-400' : ''
                        }`}
                      >
                        <XCircle size={14} /> В пользу продавца
                      </button>
                    </div>
                    <textarea
                      className="input text-sm resize-none"
                      rows={3}
                      placeholder="Мотивировка решения (мин. 10 символов)..."
                      value={form.resolution}
                      onChange={(e) => setForm(d.id, { resolution: e.target.value })}
                    />
                    <button
                      type="button"
                      disabled={resolveMutation.isPending || form.resolution.trim().length < 10}
                      onClick={() => resolveMutation.mutate({
                        id: d.id,
                        winner: form.winner,
                        resolution: form.resolution.trim(),
                      })}
                      className="btn-primary text-sm"
                    >
                      Вынести решение
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-dark-800 pt-3 text-sm text-dark-400">
                    Решение: {d.resolution}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
