import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Star, Eye, Clock, Package, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { formatPrice, formatDate } from '../utils/format';

const PLACEHOLDER = 'https://placehold.co/600x450/1a1a27/6083ff?text=GameMarket';

export default function ListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [imgIdx, setImgIdx] = useState(0);
  const [showBuyConfirm, setShowBuyConfirm] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.get(`/listings/${id}`).then((r) => r.data),
  });

  const buyMutation = useMutation({
    mutationFn: () => api.post('/transactions', { listing_id: id }),
    onSuccess: (res) => {
      toast.success('Сделка создана!');
      navigate(`/transactions/${res.data.id}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Ошибка при создании сделки');
    },
  });

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-[4/3] rounded-2xl bg-dark-800 animate-pulse" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-6 bg-dark-800 rounded animate-pulse ${i === 0 ? 'w-3/4' : i === 2 ? 'w-1/4' : 'w-full'}`} />
          ))}
        </div>
      </div>
    </div>
  );

  if (!listing) return <div className="text-center py-20 text-dark-400">Лот не найден</div>;

  const images = listing.images?.length ? listing.images : [PLACEHOLDER];
  const isOwner = user?.id === listing.seller_id;
  const canBuy = user && !isOwner && listing.status === 'active';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-dark-800 mb-3">
            <img
              src={images[imgIdx]}
              className="w-full h-full object-cover"
              alt={listing.title}
              onError={(e) => { e.target.src = PLACEHOLDER; }}
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? 'border-brand-500' : 'border-dark-700 hover:border-dark-500'}`}
                >
                  <img src={img} className="w-full h-full object-cover" onError={(e) => { e.target.src = PLACEHOLDER; }} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          {listing.game && (
            <span className="text-brand-400 text-sm font-medium uppercase tracking-wide">{listing.game}</span>
          )}
          <h1 className="text-2xl font-bold leading-snug">{listing.title}</h1>

          <div className="flex items-center gap-3 text-sm text-dark-400">
            <span className="flex items-center gap-1"><Eye size={14} />{listing.views_count} просмотров</span>
            <span className="flex items-center gap-1"><Clock size={14} />{formatDate(listing.created_at)}</span>
            {listing.category_name && (
              <span className="badge-blue">{listing.category_name}</span>
            )}
          </div>

          <div className="text-3xl font-extrabold text-white">{formatPrice(listing.price)}</div>

          {/* Escrow badge */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm">
            <Shield size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-300">Защищено эскроу</p>
              <p className="text-dark-400 text-xs mt-0.5">Средства будут переданы продавцу только после вашего подтверждения</p>
            </div>
          </div>

          {canBuy ? (
            showBuyConfirm ? (
              <div className="card p-4 border-brand-500/40">
                <p className="font-medium mb-2">Подтвердите покупку</p>
                <p className="text-sm text-dark-300 mb-1">Сумма: <span className="text-white font-semibold">{formatPrice(listing.price)}</span></p>
                <p className="text-sm text-dark-300 mb-4">Ваш баланс: <span className="text-white font-semibold">{formatPrice(user.balance)}</span></p>
                {parseFloat(user.balance) < parseFloat(listing.price) && (
                  <p className="text-red-400 text-sm mb-3 flex items-center gap-1.5">
                    <AlertCircle size={14} /> Недостаточно средств.{' '}
                    <a href="/wallet" className="underline">Пополнить баланс</a>
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => buyMutation.mutate()}
                    disabled={buyMutation.isPending || parseFloat(user.balance) < parseFloat(listing.price)}
                    className="btn-primary flex-1"
                  >
                    {buyMutation.isPending ? 'Обработка...' : 'Купить'}
                  </button>
                  <button onClick={() => setShowBuyConfirm(false)} className="btn-secondary">Отмена</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowBuyConfirm(true)} className="btn-primary h-12 text-base">
                Купить за {formatPrice(listing.price)}
              </button>
            )
          ) : isOwner ? (
            <button className="btn-secondary h-12 cursor-default" disabled>Это ваш лот</button>
          ) : !user ? (
            <a href="/login" className="btn-primary h-12 text-base text-center flex items-center justify-center">
              Войдите для покупки
            </a>
          ) : listing.status !== 'active' ? (
            <div className="badge-gray text-sm px-4 py-2.5 w-fit">Лот недоступен</div>
          ) : null}

          {/* Seller */}
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              {listing.seller_username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <a href={`/users/${listing.seller_username}`} className="font-medium hover:text-brand-300 transition-colors">
                {listing.seller_username}
              </a>
              <div className="flex items-center gap-3 text-xs text-dark-400 mt-0.5">
                {listing.seller_rating > 0 && (
                  <span className="flex items-center gap-0.5 text-yellow-400">
                    <Star size={11} fill="currentColor" />
                    {parseFloat(listing.seller_rating).toFixed(1)}
                  </span>
                )}
                <span>{listing.seller_sales} продаж</span>
                <span>С {formatDate(listing.seller_since)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-8 card p-6">
        <h2 className="font-semibold text-lg mb-4">Описание</h2>
        <div
          className="text-dark-300 leading-relaxed whitespace-pre-wrap text-sm"
          dangerouslySetInnerHTML={{ __html: listing.description }}
        />
      </div>
    </div>
  );
}
