import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Star, Eye, Clock, AlertCircle, MessageCircle, Pencil, Trash2, Zap } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import Seo from '../components/Seo';
import { formatPrice, formatDate } from '../utils/format';

const PLACEHOLDER = 'https://placehold.co/600x450/1a1a27/6083ff?text=GameMarket';

export default function ListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [imgIdx, setImgIdx] = useState(0);
  const [showBuyConfirm, setShowBuyConfirm] = useState(false);
  const [buyerData, setBuyerData] = useState({});

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.get(`/listings/${id}`).then((r) => r.data),
  });

  const buyerFields = listing?.delivery_method === 'auto'
    ? (Array.isArray(listing.buyer_fields) && listing.buyer_fields.length
      ? listing.buyer_fields
      : [{ key: 'player_id', label: 'ID / ник', required: true }])
    : [];

  const buyMutation = useMutation({
    mutationFn: () => api.post('/transactions', {
      listing_id: id,
      buyer_data: listing.delivery_method === 'auto' ? buyerData : undefined,
    }),
    onSuccess: (res) => {
      toast.success('Сделка создана!');
      navigate(`/transactions/${res.data.id}`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка при создании сделки'),
  });

  const canSubmitBuy = () => {
    if (!listing || listing.delivery_method !== 'auto') return true;
    return buyerFields.every((f) => {
      if (f.required === false) return true;
      return String(buyerData[f.key] || '').trim().length > 0;
    });
  };

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/listings/${id}`),
    onSuccess: () => {
      toast.success('Лот удалён');
      navigate(`/users/${user.username}`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const startChat = async () => {
    if (!user) return navigate('/login');
    try {
      const { data } = await api.post('/chats', {
        partner_id: listing.seller_id,
        listing_id: listing.id,
        message: `Здравствуйте! Вопрос по лоту «${listing.title}»`,
      });
      navigate(`/chats/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Не удалось открыть чат');
    }
  };

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-[4/3] rounded-2xl bg-dark-800 animate-pulse" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-6 bg-dark-800 rounded animate-pulse ${i === 0 ? 'w-3/4' : 'w-full'}`} />
          ))}
        </div>
      </div>
    </div>
  );

  if (!listing) return <div className="text-center py-20 text-dark-400">Лот не найден</div>;

  const images = listing.images?.length ? listing.images : [PLACEHOLDER];
  const isOwner = user?.id === listing.seller_id;
  const canBuy = user && !isOwner && listing.status === 'active';
  const hasDiscount = listing.discount_percent > 0 && listing.original_price;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Seo title={listing.title} description={listing.description?.replace(/<[^>]+>/g, '').slice(0, 160)} path={`/listings/${id}`} />

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-dark-800 mb-3">
            <img
              src={images[imgIdx]}
              className="w-full h-full object-cover"
              alt={listing.title}
              onError={(e) => { e.target.src = PLACEHOLDER; }}
            />
            {hasDiscount && (
              <span className="absolute top-3 right-3 badge bg-rose-500 text-white font-bold">
                -{listing.discount_percent}%
              </span>
            )}
            {listing.delivery_method === 'auto' && (
              <span className="absolute top-3 left-3 badge bg-violet-500/90 text-white flex items-center gap-1">
                <Zap size={12} /> Автовыдача
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {listing.game && (
            <span className="text-brand-400 text-sm font-medium uppercase tracking-wide">{listing.game}</span>
          )}
          <h1 className="text-2xl font-bold leading-snug">{listing.title}</h1>

          <div className="flex items-center gap-3 text-sm text-dark-400 flex-wrap">
            <span className="flex items-center gap-1"><Eye size={14} />{listing.views_count} просмотров</span>
            <span className="flex items-center gap-1"><Clock size={14} />{formatDate(listing.created_at)}</span>
            {listing.category_name && <span className="badge-blue">{listing.category_name}</span>}
          </div>

          <div className="flex items-end gap-3">
            <div className="text-3xl font-extrabold text-white">{formatPrice(listing.price)}</div>
            {hasDiscount && (
              <div className="text-lg text-dark-500 line-through pb-1">{formatPrice(listing.original_price)}</div>
            )}
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm">
            <Shield size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-300">Защищено эскроу</p>
              <p className="text-dark-400 text-xs mt-0.5">Средства передаются продавцу только после вашего подтверждения</p>
            </div>
          </div>

          {isOwner ? (
            <div className="flex gap-2">
              <button onClick={() => navigate(`/listings/${id}/edit`)} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <Pencil size={16} /> Редактировать
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Удалить лот?')) deleteMutation.mutate();
                }}
                className="btn-secondary flex items-center justify-center gap-2 text-red-400"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : canBuy ? (
            showBuyConfirm ? (
              <div className="card p-4 border-brand-500/40">
                <p className="font-medium mb-2">Подтвердите покупку</p>
                <p className="text-sm text-dark-300 mb-1">Сумма: <span className="text-white font-semibold">{formatPrice(listing.price)}</span></p>
                <p className="text-sm text-dark-300 mb-4">Ваш баланс: <span className="text-white font-semibold">{formatPrice(user.balance)}</span></p>
                {listing.delivery_method === 'auto' && (
                  <div className="mb-4 space-y-3">
                    <p className="text-sm text-dark-400">Для автовыдачи укажите данные:</p>
                    {buyerFields.map((field) => (
                      <div key={field.key}>
                        <label className="text-sm font-medium mb-1.5 block">
                          {field.label}{field.required !== false ? ' *' : ''}
                        </label>
                        <input
                          className="input"
                          placeholder={field.placeholder || field.label}
                          value={buyerData[field.key] || ''}
                          onChange={(e) => setBuyerData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                          maxLength={200}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {parseFloat(user.balance) < parseFloat(listing.price) && (
                  <p className="text-red-400 text-sm mb-3 flex items-center gap-1.5">
                    <AlertCircle size={14} /> Недостаточно средств.{' '}
                    <Link to="/wallet" className="underline">Пополнить</Link>
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (!canSubmitBuy()) {
                        toast.error('Заполните обязательные поля');
                        return;
                      }
                      buyMutation.mutate();
                    }}
                    disabled={buyMutation.isPending || parseFloat(user.balance) < parseFloat(listing.price)}
                    className="btn-primary flex-1"
                  >
                    {buyMutation.isPending ? 'Обработка...' : 'Купить'}
                  </button>
                  <button onClick={() => setShowBuyConfirm(false)} className="btn-secondary">Отмена</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setShowBuyConfirm(true)} className="btn-primary h-12 text-base flex-1">
                  Купить за {formatPrice(listing.price)}
                </button>
                <button onClick={startChat} className="btn-secondary h-12 px-4" title="Написать продавцу">
                  <MessageCircle size={18} />
                </button>
              </div>
            )
          ) : !user ? (
            <Link to="/login" className="btn-primary h-12 text-base text-center flex items-center justify-center">
              Войдите для покупки
            </Link>
          ) : listing.status !== 'active' ? (
            <div className="badge-gray text-sm px-4 py-2.5 w-fit">Лот недоступен</div>
          ) : null}

          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              {listing.seller_username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <Link to={`/users/${listing.seller_username}`} className="font-medium hover:text-brand-300 transition-colors">
                {listing.seller_username}
              </Link>
              <div className="flex items-center gap-3 text-xs text-dark-400 mt-0.5">
                <span className="flex items-center gap-0.5 text-yellow-400">
                  <Star size={11} fill="currentColor" />
                  {parseFloat(listing.seller_rating || 0).toFixed(1)}
                </span>
                <span>{listing.seller_reviews || 0} отзывов</span>
                <span>{listing.seller_sales} продаж</span>
              </div>
            </div>
            {!isOwner && user && (
              <button onClick={startChat} className="btn-ghost p-2">
                <MessageCircle size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 card p-6">
        <h2 className="font-semibold text-lg mb-4">Описание</h2>
        <div className="text-dark-300 leading-relaxed whitespace-pre-wrap text-sm">
          {listing.description?.replace(/<[^>]+>/g, '')}
        </div>
      </div>
    </div>
  );
}
