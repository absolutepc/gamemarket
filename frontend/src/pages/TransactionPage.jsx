import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { Shield, Send, AlertTriangle, CheckCircle, Package, X } from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { formatPrice, formatRelative, formatDate, TX_STATUS } from '../utils/format';
import {
  REVIEW_CRITERIA,
  ratingFromCriteria,
  labelsForCriteria,
} from '../utils/reviewCriteria';

export default function TransactionPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { user, accessToken } = useAuthStore();
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [dispute, setDispute] = useState({ reason: 'not_received', description: '' });
  const [review, setReview] = useState({ criteria: [], comment: '' });
  const msgEndRef = useRef(null);
  const socketRef = useRef(null);

  const reviewRating = ratingFromCriteria(review.criteria);

  const { data: tx, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => api.get(`/transactions/${id}`).then((r) => r.data),
  });

  useEffect(() => {
    if (tx?.messages) setMessages(tx.messages);
  }, [tx?.messages]);

  useEffect(() => {
    if (!accessToken) return;
    const socket = io('/', { auth: { token: accessToken } });
    socketRef.current = socket;
    socket.emit('join_transaction', id);
    socket.on('new_message', (m) => {
      setMessages((prev) => {
        if (prev.find((p) => p.id === m.id)) return prev;
        return [...prev, m];
      });
    });
    return () => socket.disconnect();
  }, [id, accessToken]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!msg.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { transaction_id: id, content: msg.trim() });
    setMsg('');
  };

  const deliverMutation = useMutation({
    mutationFn: () => api.post(`/transactions/${id}/deliver`, {}),
    onSuccess: () => { toast.success('Передача отмечена!'); qc.invalidateQueries(['transaction', id]); },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.post(`/transactions/${id}/confirm`),
    onSuccess: () => { toast.success('Сделка завершена!'); qc.invalidateQueries(['transaction', id]); },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason) => api.post(`/transactions/${id}/cancel`, { reason }),
    onSuccess: () => { toast.success('Сделка отменена, средства возвращены'); qc.invalidateQueries(['transaction', id]); },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const disputeMutation = useMutation({
    mutationFn: () => api.post(`/transactions/${id}/dispute`, dispute),
    onSuccess: () => {
      toast.success('Спор открыт');
      setShowDisputeForm(false);
      qc.invalidateQueries(['transaction', id]);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const reviewMutation = useMutation({
    mutationFn: () => api.post('/users/reviews', {
      transaction_id: id,
      criteria: review.criteria,
      rating: ratingFromCriteria(review.criteria),
      comment: review.comment || undefined,
    }),
    onSuccess: () => {
      toast.success('Отзыв отправлен!');
      qc.invalidateQueries(['transaction', id]);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const toggleCriterion = (key) => {
    setReview((r) => {
      const has = r.criteria.includes(key);
      const criteria = has
        ? r.criteria.filter((k) => k !== key)
        : [...r.criteria, key];
      return { ...r, criteria };
    });
  };

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="card h-96 animate-pulse" />
    </div>
  );

  if (!tx) return <div className="text-center py-20 text-dark-400">Сделка не найдена</div>;

  // Prefer server-side role flags (JWT) — localStorage user.id can be missing/stale
  const isBuyer = tx.is_buyer ?? String(user?.id) === String(tx.buyer_id);
  const isSeller = tx.is_seller ?? String(user?.id) === String(tx.seller_id);
  const canConfirm = tx.can_confirm ?? (isBuyer && tx.status === 'awaiting_confirmation');
  const status = TX_STATUS[tx.status] || { label: tx.status, color: 'badge-gray' };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="card p-5 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-dark-400 text-xs mb-1">Сделка #{tx.id.slice(0, 8)}</p>
            <h1 className="font-bold text-lg leading-snug">{tx.listing_title}</h1>
          </div>
          <span className={status.color + ' shrink-0'}>{status.label}</span>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-dark-400">Покупатель:</span>
            <span className="font-medium">{tx.buyer_username}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-dark-400">Продавец:</span>
            <span className="font-medium">{tx.seller_username}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-dark-400">Сумма:</span>
            <span className="font-bold text-white">{formatPrice(tx.amount)}</span>
          </div>
        </div>

        {tx.buyer_data && Object.keys(tx.buyer_data).filter((k) => k !== '_comment').length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-dark-800/80 border border-dark-700 text-sm">
            <p className="font-medium text-white mb-2">Данные для автовыдачи</p>
            <div className="space-y-1.5">
              {(tx.listing_buyer_fields
                || Object.keys(tx.buyer_data)
                  .filter((key) => key !== '_comment')
                  .map((key) => ({ key, label: key }))
              ).map((field) => (
                <div key={field.key} className="flex gap-2">
                  <span className="text-dark-400">{field.label}:</span>
                  <span className="text-white font-medium break-all">{tx.buyer_data[field.key] || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tx.buyer_data?._comment && (
          <div className="mt-3 p-3 rounded-xl bg-dark-800/80 border border-dark-700 text-sm">
            <p className="font-medium text-white mb-1">Комментарий покупателя</p>
            <p className="text-dark-300 whitespace-pre-wrap break-words">{tx.buyer_data._comment}</p>
          </div>
        )}

        {/* Escrow info */}
        <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm">
          <Shield size={15} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-dark-300 space-y-1">
            <p>
              Средства <strong className="text-white">{formatPrice(tx.amount)}</strong> заморожены в эскроу.
              Продавец получит <strong className="text-white">{formatPrice(tx.seller_receives)}</strong> только после
              подтверждения получения покупателем.
            </p>
            {tx.status === 'awaiting_confirmation' && tx.confirm_deadline_at && (
              <p>
                Срок подтверждения: до <strong className="text-white">{formatDate(tx.confirm_deadline_at)}</strong>
                {' '}({tx.buyer_confirm_hours || 48} ч с момента передачи продавцом). Иначе средства уйдут продавцу автоматически.
              </p>
            )}
            {tx.status === 'awaiting_delivery' && isBuyer && (
              <p>
                Отмена доступна, если продавец не появится в сети в течение 24 часов с момента оформления сделки.
              </p>
            )}
          </div>
        </div>

        {tx.status === 'disputed' && tx.dispute && (
          <div className="mt-4 p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-sm text-yellow-200">
            Открыт спор. Ожидается решение администрации.
            {tx.dispute.resolution && (
              <p className="mt-1 text-dark-300">Решение: {tx.dispute.resolution}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {isSeller && tx.status === 'awaiting_delivery' && (
            <>
              <button
                onClick={() => deliverMutation.mutate()}
                disabled={deliverMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                <Package size={15} /> Отметить передачу
              </button>
              {tx.can_seller_cancel && (
                <button
                  onClick={() => {
                    if (window.confirm('Товар закончился? Сделка будет отменена, деньги вернутся покупателю.')) {
                      cancelMutation.mutate('Cancelled by seller: out of stock');
                    }
                  }}
                  disabled={cancelMutation.isPending}
                  className="btn-secondary flex items-center gap-2 hover:border-red-500/50 hover:text-red-400"
                >
                  <X size={15} /> Отменить (нет товара)
                </button>
              )}
            </>
          )}
          {isSeller && tx.status === 'awaiting_confirmation' && (
            <p className="text-sm text-dark-400 w-full">
              Ожидаем подтверждения от покупателя
              {tx.confirm_deadline_at ? ` до ${formatDate(tx.confirm_deadline_at)}` : ''}.
            </p>
          )}
          {canConfirm && (
            <button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle size={15} /> Подтвердить получение
            </button>
          )}
          {isBuyer && tx.status === 'awaiting_delivery' && tx.can_cancel && (
            <button
              onClick={() => {
                if (window.confirm('Отменить сделку и вернуть средства?')) {
                  cancelMutation.mutate('Cancelled by buyer (seller offline 24h)');
                }
              }}
              disabled={cancelMutation.isPending}
              className="btn-secondary flex items-center gap-2 hover:border-red-500/50 hover:text-red-400"
            >
              <X size={15} /> Отменить
            </button>
          )}
          {isBuyer && tx.status === 'awaiting_delivery' && !tx.can_cancel && (
            <p className="text-xs text-dark-500 w-full">
              {tx.cancel_info?.reason === 'seller_was_online'
                ? 'Отмена недоступна: продавец был в сети после оформления. При проблемах откройте спор.'
                : tx.cancel_info?.available_at
                  ? `Отмена станет доступна после ${formatDate(tx.cancel_info.available_at)}, если продавец не появится в сети.`
                  : 'Отмена пока недоступна.'}
            </p>
          )}
          {(isBuyer || isSeller) && ['awaiting_delivery', 'awaiting_confirmation'].includes(tx.status) && (
            <button
              onClick={() => setShowDisputeForm(!showDisputeForm)}
              className="btn-secondary flex items-center gap-2 hover:border-yellow-500/50 hover:text-yellow-400"
            >
              <AlertTriangle size={15} /> Открыть спор
            </button>
          )}
        </div>

        {/* Dispute form */}
        {showDisputeForm && (
          <div className="mt-4 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 animate-slide-up">
            <h3 className="font-semibold mb-3 text-yellow-300">Открытие спора</h3>
            <select
              className="input mb-3 text-sm"
              value={dispute.reason}
              onChange={(e) => setDispute((d) => ({ ...d, reason: e.target.value }))}
            >
              <option value="not_received">Товар не получен</option>
              <option value="not_as_described">Не соответствует описанию</option>
              <option value="fraud">Мошенничество</option>
              <option value="other">Другое</option>
            </select>
            <textarea
              className="input text-sm resize-none mb-3"
              rows={3}
              placeholder="Подробно опишите проблему..."
              value={dispute.description}
              onChange={(e) => setDispute((d) => ({ ...d, description: e.target.value }))}
            />
            <div className="flex gap-2">
              <button
                onClick={() => disputeMutation.mutate()}
                disabled={disputeMutation.isPending || dispute.description.length < 20}
                className="btn-primary text-sm bg-yellow-600 hover:bg-yellow-700"
              >
                Отправить
              </button>
              <button onClick={() => setShowDisputeForm(false)} className="btn-ghost text-sm">Отмена</button>
            </div>
          </div>
        )}
      </div>

      {isBuyer && tx.status === 'completed' && tx.escrow_released_at && !tx.has_review && (
        <div className="card p-5 mb-4">
          <h3 className="font-semibold mb-1">Оставить отзыв продавцу</h3>
          <p className="text-xs text-dark-400 mb-4">
            Отметьте, что понравилось — итоговая оценка = число выбранных пунктов (1–5)
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {REVIEW_CRITERIA.map((c) => {
              const selected = review.criteria.includes(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => toggleCriterion(c.key)}
                  className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                    selected
                      ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                      : 'bg-dark-800/60 border-dark-700 text-dark-300 hover:border-dark-500'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-dark-400">Итого:</span>
            <div className="flex gap-0.5" aria-label={`Оценка ${reviewRating} из 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={`text-xl leading-none ${n <= reviewRating ? 'text-yellow-400' : 'text-dark-600'}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-dark-300">{reviewRating}/5</span>
          </div>
          <textarea
            className="input text-sm resize-none mb-3"
            rows={3}
            placeholder="Комментарий (необязательно)"
            value={review.comment}
            onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))}
          />
          <button
            onClick={() => reviewMutation.mutate()}
            disabled={reviewMutation.isPending || reviewRating < 1}
            className="btn-primary text-sm"
          >
            Отправить отзыв
          </button>
        </div>
      )}
      {isBuyer && tx.status === 'completed' && tx.has_review && (
        <div className="card p-5 mb-4 text-sm text-dark-300">
          <p>
            Вы уже оставили отзыв по этой сделке
            {tx.review?.rating ? ` — ${tx.review.rating}/5` : ''}
          </p>
          {labelsForCriteria(tx.review?.criteria).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {labelsForCriteria(tx.review.criteria).map((label) => (
                <span
                  key={label}
                  className="px-2.5 py-1 rounded-lg text-xs bg-dark-800 border border-dark-700 text-dark-200"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      <div className="card flex flex-col" style={{ height: '420px' }}>
        <div className="p-4 border-b border-dark-800 font-medium text-sm">Чат сделки</div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.map((m) => {
            const isMe = m.sender_id === user?.id;
            if (m.is_system) {
              return (
                <div key={m.id} className="text-center">
                  <span className="text-xs text-dark-500 bg-dark-800 px-3 py-1 rounded-full">{m.content}</span>
                </div>
              );
            }
            return (
              <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-semibold shrink-0">
                  {m.sender_username?.[0]?.toUpperCase()}
                </div>
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  {!isMe && <span className="text-xs text-dark-400">{m.sender_username}</span>}
                  <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-brand-500 text-white rounded-tr-sm' : 'bg-dark-800 text-dark-100 rounded-tl-sm'}`}>
                    {m.content}
                  </div>
                  <span className="text-xs text-dark-500">{formatRelative(m.created_at)}</span>
                </div>
              </div>
            );
          })}
          <div ref={msgEndRef} />
        </div>
        {['awaiting_delivery', 'awaiting_confirmation', 'disputed'].includes(tx.status) && (
          <form onSubmit={sendMessage} className="p-3 border-t border-dark-800 flex gap-2">
            <input
              className="input flex-1 text-sm"
              placeholder="Написать сообщение..."
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              maxLength={2000}
            />
            <button type="submit" disabled={!msg.trim()} className="btn-primary p-2.5">
              <Send size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
