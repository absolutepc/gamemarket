import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Crown, BadgeCheck, CheckCircle2, Clock, XCircle, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import Seo from '../components/Seo';
import { isSellerAccount } from '../utils/accountTypes';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';
import { getDeviceFingerprint } from '../utils/deviceFingerprint';

const STATUS_UI = {
  pending: {
    icon: Clock,
    label: 'На рассмотрении',
    className: 'text-amber-200',
    hint: 'Модераторы проверят заявку и сообщат о решении. Статус Founding Seller выдаётся только после одобрения.',
  },
  approved: {
    icon: CheckCircle2,
    label: 'Одобрена',
    className: 'text-emerald-400',
    hint: 'Вы Founding Seller — льготная комиссия 5%/13% и вывод через 24 ч после сделки.',
  },
  rejected: {
    icon: XCircle,
    label: 'Отклонена',
    className: 'text-red-400',
    hint: 'Можно подать новую заявку позже, если места ещё есть.',
  },
};

export default function FoundersPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [message, setMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['founders-my-application'],
    queryFn: () => api.get('/founders/my-application').then((r) => r.data),
    enabled: !!user,
    staleTime: 15_000,
  });

  const { data: publicStats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => api.get('/stats/platform').then((r) => r.data),
    staleTime: 60_000,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const device_fingerprint = await getDeviceFingerprint();
      return api.post('/founders/apply', {
        message: message.trim() || undefined,
        device_fingerprint: device_fingerprint || undefined,
      }).then((r) => r.data);
    },
    onSuccess: (res) => {
      if (res.already_pending) {
        toast.success('Заявка уже на рассмотрении');
      } else {
        toast.success('Заявка отправлена на рассмотрение');
      }
      qc.invalidateQueries({ queryKey: ['founders-my-application'] });
      qc.invalidateQueries({ queryKey: ['platform-stats'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Не удалось подать заявку'),
  });

  const founders = data?.founders || publicStats?.founders || {};
  const joined = founders.joined ?? 0;
  const limit = founders.limit ?? 100;
  const open = founders.open !== false;
  const application = data?.application;
  const isFounder = data?.is_founding_seller || user?.is_founding_seller;
  const seller = isSellerAccount(user);
  const statusMeta = application ? STATUS_UI[application.status] : null;
  const StatusIcon = statusMeta?.icon;

  return (
    <div className={`${PAGE_WIDTH_CLASS} py-10 max-w-2xl`}>
      <Seo
        title="Программа Founders"
        description="Первые 100 продавцов Lootz — льготная комиссия по заявке после рассмотрения."
        path="/founders"
      />

      <div className="flex items-center gap-3 mb-6">
        <Crown className="text-amber-300" size={28} />
        <div>
          <h1 className="text-2xl font-bold">Программа Founders</h1>
          <p className="text-dark-400 text-sm">Вход только по заявке — после рассмотрения модерацией</p>
        </div>
      </div>

      <div className="card p-6 mb-5 border border-amber-500/30 bg-amber-500/5">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <div>
            <div className="text-xs text-dark-400 mb-1">Места Founders</div>
            <div className="text-2xl font-extrabold text-amber-100 tabular-nums">
              {joined}/{limit}
            </div>
          </div>
          {!open && (
            <span className="text-sm text-dark-400">Все места заняты</span>
          )}
        </div>
        <p className="text-sm text-dark-300 mb-3">
          Комиссия{' '}
          <span className="line-through text-dark-500">7.5%</span>{' '}
          <span className="text-amber-200 font-semibold">5%</span>
          {' / '}
          <span className="line-through text-dark-500">17.5%</span>{' '}
          <span className="text-amber-200 font-semibold">13%</span>
          , вывод через{' '}
          <span className="text-amber-200 font-semibold">24 ч</span>
          {' '}после сделки (обычно 48 ч), золотая галочка, приоритет в поиске и бейдж Founding Seller.
        </p>
        <ul className="space-y-1.5 text-sm text-dark-200">
          <li className="flex items-start gap-2">
            <BadgeCheck size={15} className="text-amber-300 mt-0.5 shrink-0" />
            Заявка → рассмотрение → решение. Автоматического входа нет.
          </li>
          <li className="flex items-start gap-2">
            <BadgeCheck size={15} className="text-amber-300 mt-0.5 shrink-0" />
            Выше в поиске и каталоге (тайбрейкер после платного ТОП)
          </li>
          <li className="flex items-start gap-2">
            <BadgeCheck size={15} className="text-amber-300 mt-0.5 shrink-0" />
            Вывод средств через 24 часа после продажи (у остальных продавцов — 48 часов)
          </li>
          <li className="flex items-start gap-2">
            <BadgeCheck size={15} className="text-amber-300 mt-0.5 shrink-0" />
            Один слот на человека (по email)
          </li>
        </ul>
      </div>

      {!user && (
        <div className="card p-6 text-center">
          <p className="text-dark-300 mb-4">Войдите, чтобы подать заявку в Founders</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/login?next=/founders" className="btn-primary">Войти</Link>
            <Link to="/invite/founders" className="btn-secondary">Регистрация продавца</Link>
          </div>
        </div>
      )}

      {user && isFounder && (
        <div className="card p-6 text-center">
          <Crown className="mx-auto text-amber-300 mb-2" size={32} />
          <h2 className="text-xl font-bold mb-1">Вы Founding Seller</h2>
          {user.founding_seller_number || data?.founding_seller_number ? (
            <p className="text-amber-200 mb-4">#{user.founding_seller_number || data.founding_seller_number}</p>
          ) : null}
          <Link to="/listings/create" className="btn-primary inline-flex">Выставить лот</Link>
        </div>
      )}

      {user && !isFounder && !seller && (
        <div className="card p-6 text-center">
          <Store className="mx-auto text-[#5B8CFF] mb-2" size={32} />
          <h2 className="text-lg font-bold mb-2">Сначала станьте продавцом</h2>
          <p className="text-sm text-dark-400 mb-4">
            Founders доступен только продавцам. После активации продавца подайте заявку здесь.
          </p>
          <Link to="/become-seller" className="btn-primary inline-flex">Стать продавцом</Link>
        </div>
      )}

      {user && !isFounder && seller && (
        <div className="card p-6">
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-xl bg-dark-800" />
          ) : application && application.status !== 'rejected' ? (
            <div>
              <div className={`flex items-center gap-2 mb-2 ${statusMeta?.className || ''}`}>
                {StatusIcon ? <StatusIcon size={18} /> : null}
                <h2 className="font-semibold">{statusMeta?.label || application.status}</h2>
              </div>
              <p className="text-sm text-dark-400 mb-3">{statusMeta?.hint}</p>
              {application.message && (
                <p className="text-sm text-dark-300 bg-dark-950/60 rounded-xl p-3 border border-dark-800">
                  {application.message}
                </p>
              )}
              {application.admin_note && application.status === 'rejected' && (
                <p className="text-sm text-dark-400 mt-3">Комментарий: {application.admin_note}</p>
              )}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!open) {
                  toast.error('Все места Founders заняты');
                  return;
                }
                applyMutation.mutate();
              }}
              className="flex flex-col gap-4"
            >
              {application?.status === 'rejected' && (
                <p className="text-sm text-red-300/90">
                  Предыдущая заявка отклонена{application.admin_note ? `: ${application.admin_note}` : ''}.
                  Можно подать снова.
                </p>
              )}
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">
                  Коротко о себе и опыте продажи (необязательно)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                  rows={4}
                  className="input w-full min-h-[100px]"
                  placeholder="Чем торгуете, на каких площадках работали…"
                />
                <div className="text-xs text-dark-500 mt-1 text-right">{message.length}/1000</div>
              </div>
              <p className="text-xs text-dark-500">
                Решение принимается после ручного рассмотрения. Подача заявки не гарантирует место.
              </p>
              <button
                type="submit"
                disabled={applyMutation.isPending || !open}
                className="btn-primary h-11"
              >
                {applyMutation.isPending ? 'Отправка…' : open ? 'Подать заявку' : 'Места закончились'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
