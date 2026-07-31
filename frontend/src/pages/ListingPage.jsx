import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, Star, Eye, Clock, MessageCircle, Pencil, Trash2, Zap,
  ChevronLeft, ChevronRight, Lock, CheckSquare,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import Seo from '../components/Seo';
import BuyCheckoutModal from '../components/BuyCheckoutModal';
import { formatPrice, formatDate, formatReviewsCount } from '../utils/format';
import { resolveAssortmentIcon, resolveAssortmentItem } from '../utils/assortmentIcons';
import { LISTING_TYPE_OPTIONS } from '../utils/listingTypes';

const PLACEHOLDER = '/placeholder-listing.svg';

function filledStarsCount(rating) {
  const value = parseFloat(rating) || 0;
  if (value <= 0) return 0;
  return Math.min(5, Math.round(value));
}

export default function ListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [imgIdx, setImgIdx] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

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
    mutationFn: ({ buyerData, comment }) => api.post('/transactions', {
      listing_id: id,
      buyer_data: listing.delivery_method === 'auto' ? buyerData : undefined,
      buyer_comment: comment || undefined,
    }),
    onSuccess: async (res) => {
      toast.success('Оплата прошла, сделка создана!');
      setCheckoutOpen(false);
      try {
        const { data: me } = await api.get('/auth/me');
        setUser(me);
      } catch {
        /* balance refresh best-effort */
      }
      qc.invalidateQueries({ queryKey: ['listing', id] });
      navigate(`/transactions/${res.data.id}`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка при создании сделки'),
  });

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

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/catalog');
  };

  if (isLoading) {
    return (
      <div>
        <div className="sticky top-0 z-40 h-14 bg-dark-950 border-b border-dark-800" />
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <div className="aspect-[4/3] rounded-2xl bg-dark-800 animate-pulse" />
          <div className="h-8 w-40 bg-dark-800 rounded animate-pulse" />
          <div className="h-6 w-full bg-dark-800 rounded animate-pulse" />
          <div className="h-12 w-full bg-dark-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return <div className="text-center py-20 text-dark-400">Лот не найден</div>;
  }

  const images = listing.images?.length ? listing.images : [PLACEHOLDER];
  const isOwner = user?.id === listing.seller_id;
  const canBuy = user && !isOwner && listing.status === 'active';
  const hasDiscount = listing.discount_percent > 0 && listing.original_price;
  const matched = resolveAssortmentItem(listing.game || listing.title);
  const gameLabel = matched?.name || listing.game || listing.category_name || 'Товар';
  const gameIcon = matched?.icon || resolveAssortmentIcon(listing.game || listing.title);
  const typeLabel =
    LISTING_TYPE_OPTIONS.find((o) => o.value === listing.listing_type)?.label ||
    listing.category_name ||
    '';
  const plainDesc = (listing.description || '').replace(/<[^>]+>/g, '').trim();
  const descLong = plainDesc.length > 220;
  const descShown = descExpanded || !descLong ? plainDesc : `${plainDesc.slice(0, 220).trimEnd()}…`;
  const attrEntries = listing.attributes && typeof listing.attributes === 'object'
    ? Object.entries(listing.attributes).filter(([, v]) => v != null && String(v).trim() !== '')
    : [];
  const sellerRating = parseFloat(listing.seller_rating || 0);
  const deliveryLabel = listing.delivery_method === 'auto' ? 'Автоматическая выдача' : 'Вручную через чат сделки';
  const deliveryHint = listing.delivery_method === 'auto'
    ? 'После оплаты товар придёт сразу по указанным данным.'
    : 'Продавец передаст товар в чате сделки после оплаты.';

  return (
    <div className="min-h-full bg-dark-950">
      <Seo
        title={listing.title}
        description={plainDesc.slice(0, 160)}
        path={`/listings/${id}`}
      />

      {/* Playerok-style product header — replaces global nav */}
      <header className="sticky top-0 z-40 bg-dark-950/95 backdrop-blur-xl border-b border-dark-800/80">
        <div className="max-w-lg mx-auto px-2 sm:px-3 h-14 flex items-center gap-1.5">
          <button
            type="button"
            onClick={goBack}
            className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-dark-800 transition-colors shrink-0"
            aria-label="Назад"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>

          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-dark-800 ring-1 ring-white/10 shrink-0">
              <img
                src={gameIcon}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assortment/other-apps.png';
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate leading-tight">{gameLabel}</div>
              {typeLabel && (
                <div className="text-[11px] text-dark-400 truncate leading-tight mt-0.5">{typeLabel}</div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-3 pb-6">
        {/* Gallery */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-dark-800 mb-3">
          <img
            src={images[imgIdx]}
            className="w-full h-full object-cover"
            alt={listing.title}
            onError={(e) => { e.target.src = PLACEHOLDER; }}
          />
          {listing.delivery_method === 'auto' && (
            <span className="absolute top-3 left-3 badge bg-violet-500/95 text-white flex items-center gap-1">
              <Zap size={12} /> Автовыдача
            </span>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setImgIdx(i)}
                className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 ${
                  imgIdx === i ? 'border-[#2B71F3]' : 'border-transparent'
                }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 leading-none">
            {formatPrice(listing.price)}
          </span>
          {hasDiscount && (
            <>
              <span className="inline-flex items-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5">
                -{listing.discount_percent}%
              </span>
              <span className="text-base text-dark-500 line-through">
                {formatPrice(listing.original_price)}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="text-lg sm:text-xl font-bold leading-snug text-white mb-2">
          {listing.title}
        </h1>

        {/* Rating / meta */}
        <div className="flex items-center gap-2 flex-wrap text-sm mb-4">
          {(sellerRating > 0 || listing.seller_reviews > 0) && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 text-[#5B8CFF]">
                {Array.from({ length: 5 }).map((_, i) => {
                  const filled = i < filledStarsCount(sellerRating);
                  return (
                    <Star
                      key={i}
                      size={14}
                      fill={filled ? 'currentColor' : 'none'}
                      className={filled ? '' : 'text-dark-600'}
                    />
                  );
                })}
              </div>
              {sellerRating > 0 && (
                <span className="text-[#5B8CFF] font-medium tabular-nums text-xs">
                  {sellerRating.toFixed(1)}
                </span>
              )}
              <span className="text-dark-400 text-xs">
                {formatReviewsCount(listing.seller_reviews)}
              </span>
            </div>
          )}
          <span className="flex items-center gap-1 text-dark-500 text-xs">
            <Eye size={12} />{listing.views_count}
          </span>
          <span className="flex items-center gap-1 text-dark-500 text-xs">
            <Clock size={12} />{formatDate(listing.created_at)}
          </span>
        </div>

        {/* Delivery method */}
        <div className="rounded-2xl bg-dark-900 border border-dark-800 px-4 py-3.5 mb-4">
          <div className="font-semibold text-sm text-white mb-1">
            📦 Способ получения
          </div>
          <p className="text-sm text-dark-300 leading-relaxed">
            <span className="text-white font-medium">{deliveryLabel}.</span>{' '}
            {deliveryHint}
          </p>
        </div>

        {/* Buy / owner actions */}
        <div className="mb-3">
          {isOwner ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate(`/listings/${id}/edit`)}
                className="btn-secondary flex-1 flex items-center justify-center gap-2 h-12"
              >
                <Pencil size={16} /> Редактировать
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Удалить лот?')) deleteMutation.mutate();
                }}
                className="btn-secondary h-12 px-4 flex items-center justify-center text-red-400"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : canBuy ? (
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99]
                         text-white font-bold text-base transition-colors"
            >
              Купить
            </button>
          ) : !user ? (
            <Link
              to="/login"
              className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400
                         text-white font-bold text-base flex items-center justify-center transition-colors"
            >
              Войдите для покупки
            </Link>
          ) : listing.status !== 'active' ? (
            <div className="badge-gray text-sm px-4 py-2.5 w-fit">Лот недоступен</div>
          ) : null}
        </div>

        {isOwner && listing.platform_fee_percent != null && (
          <div className="text-sm text-dark-400 mb-4">
            Комиссия {(listing.platform_fee_percent * 100).toFixed(1).replace(/\.0$/, '')}% ·
            вы получите{' '}
            <span className="text-emerald-400 font-medium">
              {formatPrice(listing.seller_receives)}
            </span>
          </div>
        )}

        {/* Warranty row */}
        <Link
          to="/faq"
          className="flex items-center gap-2.5 py-3 mb-5 border-b border-dark-800/80 group"
        >
          <Shield size={18} className="text-[#5B8CFF] shrink-0" />
          <span className="flex-1 text-sm text-white font-medium">Гарантия Lootz</span>
          <ChevronRight size={18} className="text-dark-500 group-hover:text-white transition-colors" />
        </Link>

        {/* Description */}
        <section className="mb-6">
          <h2 className="font-bold text-base text-white mb-3">Описание</h2>
          {attrEntries.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              {attrEntries.map(([key, value]) => (
                <div key={key} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-dark-400 shrink-0">{key}</span>
                  <span className="text-white text-right">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
          {plainDesc ? (
            <p className="text-sm text-dark-300 leading-relaxed whitespace-pre-wrap">
              {descShown}
              {descLong && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  className="ml-1 text-[#5B8CFF] font-medium hover:underline"
                >
                  {descExpanded ? 'свернуть' : 'ещё'}
                </button>
              )}
            </p>
          ) : (
            <p className="text-sm text-dark-500">Без описания</p>
          )}
        </section>

        {/* Seller */}
        <section className="mb-4">
          <h2 className="font-bold text-base text-white mb-3">Продавец</h2>
          <Link
            to={`/users/${listing.seller_username}`}
            className="flex items-center gap-3 mb-4 group"
          >
            <div className="w-12 h-12 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden ring-1 ring-white/10">
              {listing.seller_avatar ? (
                <img src={listing.seller_avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                listing.seller_username?.[0]?.toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-white group-hover:text-[#5B8CFF] transition-colors truncate">
                {listing.seller_username}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs flex-wrap">
                <div className="flex items-center gap-0.5 text-[#5B8CFF]">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const filled = i < filledStarsCount(sellerRating);
                    return (
                      <Star
                        key={i}
                        size={12}
                        fill={filled ? 'currentColor' : 'none'}
                        className={filled ? '' : 'text-dark-600'}
                      />
                    );
                  })}
                </div>
                {sellerRating > 0 && (
                  <span className="text-[#5B8CFF] font-medium tabular-nums">
                    {sellerRating.toFixed(1)}
                  </span>
                )}
                <span className="text-dark-400">
                  {formatReviewsCount(listing.seller_reviews)}
                </span>
              </div>
            </div>
            {!isOwner && user && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  startChat();
                }}
                className="btn-ghost p-2 shrink-0"
                title="Написать продавцу"
              >
                <MessageCircle size={18} />
              </button>
            )}
          </Link>

          <div className="flex items-center gap-2 mb-3 text-sm">
            <Lock size={15} className="text-amber-400 shrink-0" />
            <span className="text-dark-200">Безопасная оплата</span>
          </div>

          <ul className="flex flex-col gap-2.5">
            <li className="flex items-start gap-2.5 text-sm text-dark-300">
              <CheckSquare size={16} className="text-[#5B8CFF] shrink-0 mt-0.5" />
              <span>Возврат средств, если вы не получили товар</span>
            </li>
            <li className="flex items-start gap-2.5 text-sm text-dark-300">
              <CheckSquare size={16} className="text-[#5B8CFF] shrink-0 mt-0.5" />
              <span>Возврат средств, если товар не соответствует описанию</span>
            </li>
          </ul>
        </section>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm mt-5">
          <Shield size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-emerald-300">Защищено эскроу</p>
            <p className="text-dark-400 text-xs mt-0.5">
              Средства передаются продавцу только после вашего подтверждения
            </p>
          </div>
        </div>
      </div>

      <BuyCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        listing={listing}
        buyerFields={buyerFields}
        user={user}
        isPending={buyMutation.isPending}
        onConfirm={({ buyerData, comment }) => buyMutation.mutate({ buyerData, comment })}
      />
    </div>
  );
}
