import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Crown, CheckCircle, XCircle, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatRelative } from '../utils/format';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';

export default function AdminFoundersPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [notes, setNotes] = useState({});

  const isMembers = filter === 'members';

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-founders', filter],
    queryFn: () =>
      isMembers
        ? api.get('/admin/founders/members').then((r) => r.data)
        : api.get(`/admin/founders/applications?status=${filter}`).then((r) => r.data),
  });

  const applications = data?.applications || [];
  const members = data?.members || [];
  const founders = data?.founders || {};

  const approveMutation = useMutation({
    mutationFn: ({ id, admin_note }) =>
      api.post(`/admin/founders/applications/${id}/approve`, { admin_note }),
    onSuccess: (res) => {
      toast.success(res.data?.number ? `Одобрено · Founding Seller #${res.data.number}` : 'Одобрено');
      qc.invalidateQueries({ queryKey: ['admin-founders'] });
      qc.invalidateQueries({ queryKey: ['platform-stats'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, admin_note }) =>
      api.post(`/admin/founders/applications/${id}/reject`, { admin_note }),
    onSuccess: () => {
      toast.success('Заявка отклонена');
      qc.invalidateQueries({ queryKey: ['admin-founders'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const revokeMutation = useMutation({
    mutationFn: ({ userId, admin_note }) =>
      api.post(`/admin/founders/members/${userId}/revoke`, { admin_note }),
    onSuccess: (res) => {
      const n = res.data?.previous_number;
      toast.success(n ? `Статус снят · было #${n}` : 'Статус Founders снят');
      qc.invalidateQueries({ queryKey: ['admin-founders'] });
      qc.invalidateQueries({ queryKey: ['platform-stats'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const revokeUser = (userId, noteKey) => {
    if (!window.confirm('Снять статус Founding Seller? Комиссия вернётся к стандартной, слот освободится.')) {
      return;
    }
    revokeMutation.mutate({ userId, admin_note: notes[noteKey] || undefined });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Crown className="text-amber-300" size={22} />
        <h1 className="text-2xl font-bold">Founders — заявки</h1>
        <span className="text-sm text-dark-400">
          {founders.joined ?? 0}/{founders.limit ?? 100}
          {founders.pending_applications != null ? ` · ожидают: ${founders.pending_applications}` : ''}
        </span>
        <div className="ml-auto flex gap-2">
          <Link to="/admin/assortment" className="btn-ghost text-sm">Каталог</Link>
          <Link to="/admin/disputes" className="btn-ghost text-sm">Споры</Link>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { id: 'pending', label: 'Ожидают' },
          { id: 'members', label: 'Участники' },
          { id: 'approved', label: 'Одобренные' },
          { id: 'rejected', label: 'Отклонённые' },
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
            {f.id === 'members' && founders.joined != null ? ` (${founders.joined})` : ''}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card h-40 animate-pulse" />
      ) : isError ? (
        <div className="card p-8 text-center">
          <p className="text-red-300 mb-3">
            {error?.response?.data?.error || 'Не удалось загрузить данные'}
          </p>
          <button type="button" className="btn-secondary" onClick={() => refetch()} disabled={isFetching}>
            Повторить
          </button>
        </div>
      ) : isMembers ? (
        members.length === 0 ? (
          <div className="card p-8 text-center text-dark-400">
            Нет Founding Sellers
            <button
              type="button"
              className="block mx-auto mt-3 text-sm text-[#5B8CFF] hover:underline"
              onClick={() => refetch()}
            >
              Обновить
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {members.map((m) => (
              <div key={m.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <Link to={`/users/${m.username}`} className="font-semibold hover:text-brand-400">
                      {m.username}
                    </Link>
                    <p className="text-sm text-dark-400 mt-1">
                      {m.email}
                      {m.founding_seller_at ? ` · с ${formatRelative(m.founding_seller_at)}` : ''}
                      {m.sales_count != null ? ` · продаж: ${m.sales_count}` : ''}
                    </p>
                  </div>
                  <span className="badge-green">
                    Founding #{m.founding_seller_number ?? '—'}
                  </span>
                </div>

                <textarea
                  className="input w-full min-h-[64px] mb-3"
                  placeholder="Причина снятия (необязательно, увидит продавец)"
                  value={notes[`m-${m.id}`] || ''}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [`m-${m.id}`]: e.target.value.slice(0, 1000) }))
                  }
                />
                <button
                  type="button"
                  className="btn-secondary h-10 px-4 inline-flex items-center gap-1.5 text-red-300"
                  disabled={revokeMutation.isPending}
                  onClick={() => revokeUser(m.id, `m-${m.id}`)}
                >
                  <UserMinus size={16} /> Снять статус
                </button>
              </div>
            ))}
          </div>
        )
      ) : applications.length === 0 ? (
        <div className="card p-8 text-center text-dark-400">
          Заявок нет
          <button
            type="button"
            className="block mx-auto mt-3 text-sm text-[#5B8CFF] hover:underline"
            onClick={() => refetch()}
          >
            Обновить
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {applications.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <Link to={`/users/${a.username}`} className="font-semibold hover:text-brand-400">
                    {a.username}
                  </Link>
                  <p className="text-sm text-dark-400 mt-1">
                    {a.email} · {formatRelative(a.created_at)}
                    {a.sales_count != null ? ` · продаж: ${a.sales_count}` : ''}
                  </p>
                </div>
                <span
                  className={
                    a.status === 'pending'
                      ? 'badge-yellow'
                      : a.status === 'approved'
                        ? 'badge-green'
                        : 'badge-red'
                  }
                >
                  {a.status === 'pending' ? 'Ожидает' : a.status === 'approved' ? 'Одобрена' : 'Отклонена'}
                </span>
              </div>

              {a.message && (
                <p className="text-sm text-dark-200 mb-3 whitespace-pre-wrap bg-dark-950/50 rounded-xl p-3 border border-dark-800">
                  {a.message}
                </p>
              )}

              <div className="grid sm:grid-cols-3 gap-2 text-xs text-dark-500 mb-3">
                <div>email_norm: {a.email_norm || '—'}</div>
                <div className="truncate" title={a.device_fingerprint || ''}>
                  fp: {a.device_fingerprint ? `${a.device_fingerprint.slice(0, 12)}…` : '—'}
                </div>
                <div>ip: {a.ip || '—'}</div>
              </div>

              {a.status === 'pending' ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    className="input w-full min-h-[72px]"
                    placeholder="Комментарий модератора (необязательно)"
                    value={notes[a.id] || ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [a.id]: e.target.value.slice(0, 1000) }))}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-primary h-10 px-4 inline-flex items-center gap-1.5"
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() =>
                        approveMutation.mutate({ id: a.id, admin_note: notes[a.id] || undefined })
                      }
                    >
                      <CheckCircle size={16} /> Одобрить
                    </button>
                    <button
                      type="button"
                      className="btn-secondary h-10 px-4 inline-flex items-center gap-1.5 text-red-300"
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() =>
                        rejectMutation.mutate({ id: a.id, admin_note: notes[a.id] || undefined })
                      }
                    >
                      <XCircle size={16} /> Отклонить
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="text-sm text-dark-400">
                    {a.reviewer_username ? `Рассмотрел: ${a.reviewer_username}` : null}
                    {a.admin_note ? ` · ${a.admin_note}` : ''}
                    {a.is_founding_seller && a.founding_seller_number
                      ? ` · Founding #${a.founding_seller_number}`
                      : ''}
                  </div>
                  {a.is_founding_seller && a.user_id ? (
                    <button
                      type="button"
                      className="btn-secondary h-10 px-4 inline-flex items-center gap-1.5 text-red-300 self-start"
                      disabled={revokeMutation.isPending}
                      onClick={() => revokeUser(a.user_id, a.id)}
                    >
                      <UserMinus size={16} /> Снять статус
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
