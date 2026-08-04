import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Crown,
  CheckCircle,
  XCircle,
  UserMinus,
  Hash,
  Clock,
  Users,
  BadgeCheck,
  Ban,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatRelative } from '../utils/format';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';
import { getFoundersInviteUrl } from '../utils/foundersInvite';
import { GlassModalShell } from '../components/GlassModalShell';

const SECTIONS = [
  {
    id: 'pending',
    title: 'Ожидают',
    hint: 'Заявки на рассмотрении',
    icon: Clock,
    accent: 'text-amber-300',
    ring: 'ring-amber-500/20',
    kind: 'applications',
  },
  {
    id: 'members',
    title: 'Участники',
    hint: 'Активные Founding Sellers',
    icon: Users,
    accent: 'text-sky-300',
    ring: 'ring-sky-500/20',
    kind: 'members',
  },
  {
    id: 'approved',
    title: 'Одобренные',
    hint: 'История одобренных заявок',
    icon: BadgeCheck,
    accent: 'text-emerald-300',
    ring: 'ring-emerald-500/20',
    kind: 'applications',
  },
  {
    id: 'rejected',
    title: 'Отклонённые',
    hint: 'Отклонённые заявки',
    icon: Ban,
    accent: 'text-rose-300',
    ring: 'ring-rose-500/20',
    kind: 'applications',
  },
];

function formatNum(n) {
  return new Intl.NumberFormat('ru-RU').format(Number(n) || 0);
}

export default function AdminFoundersPage() {
  const qc = useQueryClient();
  const [openSection, setOpenSection] = useState(null);
  const [notes, setNotes] = useState({});

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-founders-overview'],
    queryFn: async () => {
      const [pending, approved, rejected, members] = await Promise.all([
        api.get('/admin/founders/applications?status=pending&limit=100').then((r) => r.data),
        api.get('/admin/founders/applications?status=approved&limit=100').then((r) => r.data),
        api.get('/admin/founders/applications?status=rejected&limit=100').then((r) => r.data),
        api.get('/admin/founders/members').then((r) => r.data),
      ]);
      return {
        pending: pending?.applications || [],
        approved: approved?.applications || [],
        rejected: rejected?.applications || [],
        members: members?.members || [],
        founders: members?.founders || pending?.founders || {},
      };
    },
  });

  const founders = data?.founders || {};
  const counts = {
    pending: data?.pending?.length ?? founders.pending_applications ?? 0,
    members: data?.members?.length ?? founders.joined ?? 0,
    approved: data?.approved?.length ?? 0,
    rejected: data?.rejected?.length ?? 0,
  };

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['admin-founders-overview'] });
    qc.invalidateQueries({ queryKey: ['admin-founders'] });
    qc.invalidateQueries({ queryKey: ['platform-stats'] });
  }, [qc]);

  const approveMutation = useMutation({
    mutationFn: ({ id, admin_note }) =>
      api.post(`/admin/founders/applications/${id}/approve`, { admin_note }),
    onSuccess: (res) => {
      toast.success(res.data?.number ? `Одобрено · Founding Seller #${res.data.number}` : 'Одобрено');
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, admin_note }) =>
      api.post(`/admin/founders/applications/${id}/reject`, { admin_note }),
    onSuccess: () => {
      toast.success('Заявка отклонена');
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const revokeMutation = useMutation({
    mutationFn: ({ userId, admin_note }) =>
      api.post(`/admin/founders/members/${userId}/revoke`, { admin_note }),
    onSuccess: (res) => {
      const n = res.data?.previous_number;
      toast.success(n ? `Статус снят · было #${n}` : 'Статус Founders снят');
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка');
  });

  const renumberMutation = useMutation({
    mutationFn: () => api.post('/admin/founders/renumber'),
    onSuccess: (res) => {
      const n = res.data?.joined ?? 0;
      toast.success(n ? `Номера сжаты: 1…${n}` : 'Нет участников для нумерации');
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const revokeUser = (userId, noteKey) => {
    if (!window.confirm('Снять статус Founding Seller? Комиссия вернётся к стандартной, слот освободится.')) {
      return;
    }
    revokeMutation.mutate({ userId, admin_note: notes[noteKey] || undefined });
  };

  const renumberMembers = () => {
    if (
      !window.confirm(
        'Сжать номера Founders в 1…N по дате вступления? Пробелы (#1 пропал, есть #3) будут закрыты.'
      )
    ) {
      return;
    }
    renumberMutation.mutate();
  };

  const copyInvite = async () => {
    const url = getFoundersInviteUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Ссылка скопирована');
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const sectionMeta = SECTIONS.find((s) => s.id === openSection);
  const sectionItems =
    openSection === 'members'
      ? data?.members || []
      : openSection
        ? data?.[openSection] || []
        : [];

  return (
    <div className={`${PAGE_WIDTH_CLASS} py-8`}>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <Crown className="text-amber-300" size={22} />
        <h1 className="text-2xl font-bold">Founders</h1>
        <span className="text-sm text-dark-400">
          {founders.joined ?? 0}/{founders.limit ?? 100}
          {founders.pending_applications != null ? ` · ожидают: ${founders.pending_applications}` : ''}
        </span>
        <button
          type="button"
          className="btn-secondary h-9 px-3 text-sm"
          onClick={copyInvite}
        >
          Копировать invite-ссылку
        </button>
        <Link to="/admin" className="ml-auto btn-ghost text-sm">← Админ-панель</Link>
      </div>
      <p className="text-sm text-dark-400 mb-6 max-w-2xl">
        Нажмите на раздел, чтобы открыть список и действия. Invite-ссылка открывает регистрацию продавца
        с переходом к заявке Founders.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {SECTIONS.map((s) => (
            <div key={s.id} className="card h-36 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="card p-8 text-center">
          <p className="text-red-300 mb-3">
            {error?.response?.data?.error || 'Не удалось загрузить данные'}
          </p>
          <button type="button" className="btn-secondary" onClick={() => refetch()} disabled={isFetching}>
            Повторить
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const total = counts[s.id] ?? 0;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setOpenSection(s.id)}
                className={`card p-5 ring-1 ${s.ring} flex flex-col gap-4 text-left
                            hover:bg-dark-800/80 transition-colors focus:outline-none
                            focus-visible:ring-2 focus-visible:ring-brand-500`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-dark-400">{s.title}</p>
                    <p className="text-3xl font-extrabold tabular-nums mt-1 tracking-tight">
                      {formatNum(total)}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-dark-800 ${s.accent}`}>
                    <Icon size={20} />
                  </div>
                </div>
                <p className="text-[11px] text-dark-500 leading-snug mt-auto">{s.hint}</p>
                <span className="text-xs text-brand-300">Открыть →</span>
              </button>
            );
          })}
        </div>
      )}

      <GlassModalShell
        open={Boolean(openSection)}
        onClose={() => setOpenSection(null)}
        labelledBy="founders-section-title"
        maxWidthClass="max-w-3xl"
      >
        <div className="pr-8">
          <h2 id="founders-section-title" className="text-xl font-bold text-white mb-1">
            {sectionMeta?.title}
          </h2>
          <p className="text-sm text-white/70 mb-4">{sectionMeta?.hint}</p>
        </div>

        <div className="max-h-[65vh] overflow-y-auto space-y-3 -mx-1 px-1">
          {openSection === 'members' && (
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <p className="text-xs text-white/60">
                После снятия номер освобождается; новая выдача — наименьший свободный.
              </p>
              <button
                type="button"
                className="btn-secondary h-8 px-3 inline-flex items-center gap-1.5 text-xs"
                disabled={renumberMutation.isPending || !sectionItems.length}
                onClick={renumberMembers}
              >
                <Hash size={12} /> Сжать номера 1…N
              </button>
            </div>
          )}

          {!sectionItems.length ? (
            <div className="rounded-2xl border border-white/15 bg-black/25 px-4 py-10 text-center text-sm text-white/60">
              Пусто
            </div>
          ) : openSection === 'members' ? (
            sectionItems.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-white/15 bg-black/30 p-4 text-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <Link to={`/users/${m.username}`} className="font-semibold hover:text-brand-300">
                      {m.username}
                    </Link>
                    <p className="text-xs text-white/55 mt-1">
                      {m.email}
                      {m.founding_seller_at ? ` · с ${formatRelative(m.founding_seller_at)}` : ''}
                      {m.sales_count != null ? ` · продаж: ${m.sales_count}` : ''}
                    </p>
                  </div>
                  <span className="badge-green">Founding #{m.founding_seller_number ?? '—'}</span>
                </div>
                <textarea
                  className="input w-full min-h-[56px] mb-2 bg-black/40 border-white/15"
                  placeholder="Причина снятия (необязательно)"
                  value={notes[`m-${m.id}`] || ''}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [`m-${m.id}`]: e.target.value.slice(0, 1000) }))
                  }
                />
                <button
                  type="button"
                  className="btn-secondary h-9 px-3 inline-flex items-center gap-1.5 text-sm text-red-300"
                  disabled={revokeMutation.isPending}
                  onClick={() => revokeUser(m.id, `m-${m.id}`)}
                >
                  <UserMinus size={14} /> Снять статус
                </button>
              </div>
            ))
          ) : (
            sectionItems.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-white/15 bg-black/30 p-4 text-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <Link to={`/users/${a.username}`} className="font-semibold hover:text-brand-300">
                      {a.username}
                    </Link>
                    <p className="text-xs text-white/55 mt-1">
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

                {a.message ? (
                  <p className="text-sm text-white/80 mb-2 whitespace-pre-wrap rounded-xl bg-black/25 border border-white/10 p-3">
                    {a.message}
                  </p>
                ) : null}

                <div className="grid sm:grid-cols-3 gap-1 text-[11px] text-white/45 mb-2">
                  <div>email_norm: {a.email_norm || '—'}</div>
                  <div className="truncate" title={a.device_fingerprint || ''}>
                    fp: {a.device_fingerprint ? `${a.device_fingerprint.slice(0, 12)}…` : '—'}
                  </div>
                  <div>ip: {a.ip || '—'}</div>
                </div>

                {a.status === 'pending' ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="input w-full min-h-[56px] bg-black/40 border-white/15"
                      placeholder="Комментарий модератора"
                      value={notes[a.id] || ''}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [a.id]: e.target.value.slice(0, 1000) }))
                      }
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-primary h-9 px-3 inline-flex items-center gap-1.5 text-sm"
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        onClick={() =>
                          approveMutation.mutate({ id: a.id, admin_note: notes[a.id] || undefined })
                        }
                      >
                        <CheckCircle size={14} /> Одобрить
                      </button>
                      <button
                        type="button"
                        className="btn-secondary h-9 px-3 inline-flex items-center gap-1.5 text-sm text-red-300"
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        onClick={() =>
                          rejectMutation.mutate({ id: a.id, admin_note: notes[a.id] || undefined })
                        }
                      >
                        <XCircle size={14} /> Отклонить
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-white/55">
                      {a.reviewer_username ? `Рассмотрел: ${a.reviewer_username}` : null}
                      {a.admin_note ? ` · ${a.admin_note}` : ''}
                      {a.is_founding_seller && a.founding_seller_number
                        ? ` · Founding #${a.founding_seller_number}`
                        : ''}
                    </div>
                    {a.is_founding_seller && a.user_id ? (
                      <button
                        type="button"
                        className="btn-secondary h-9 px-3 inline-flex items-center gap-1.5 text-sm text-red-300 self-start"
                        disabled={revokeMutation.isPending}
                        onClick={() => revokeUser(a.user_id, a.id)}
                      >
                        <UserMinus size={14} /> Снять статус
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </GlassModalShell>
    </div>
  );
}
