import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, Star, Eye, Clock, MessageCircle, Pencil, Trash2, Zap,
  ChevronLeft, ChevronRight, Lock, CheckSquare, Package, Crown,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import Seo from '../components/Seo';
import BuyCheckoutModal from '../components/BuyCheckoutModal';
import GuaranteeModal from '../components/GuaranteeModal';
import ListingStatusModal, { resolveListingStatus } from '../components/ListingStatusModal';
import ListingCard, { LISTING_GRID_CLASS, PAGE_WIDTH_CLASS } from '../components/ListingCard';
import { formatPrice, formatDate, formatReviewsCount } from '../utils/format';
import { resolveAssortmentIcon, resolveAssortmentItem } from '../utils/assortmentIcons';
import { LISTING_TYPE_OPTIONS } from '../utils/listingTypes';
import { labelsForCriteria } from '../utils/reviewCriteria';
import { getAttributeLabel, sortAttributeEntries } from '../utils/listingAttributes';

const PLACEHOLDER = '/placeholder-listing.svg';

function filledStarsCount(rating) {
  const value = parseFloat(rating) || 0;
  if (value <= 0) return 0;
  return Math.min(5, Math.round(value));
}

function BuyActions({
  isOwner,
  canBuy,
  user,
  listing,
  id,
  navigate,
  deleteMutation,
  reactivateMutation,
  setCheckoutOpen,
}) {
  if (isOwner) {
    return (
      <div className="flex flex-col gap-2">
        {listing.status === 'inactive' && (
          <button
            type="button"
            onClick={() => reactivateMutation?.mutate()}
            disabled={reactivateMutation?.isPending}
            className="btn-primary w-full h-12 flex items-center justify-center gap-2"
          >
            Активировать на 30 дней
          </button>
        )}
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
      </div>
    );
  }
  if (canBuy) {
    return (
      <button
        type="button"
        onClick={() => setCheckoutOpen(true)}
        className="w-full h-12 lg:h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500
                   hover:from-emerald-400 hover:to-teal-400 active:scale-[0.99]
                   text-white font-bold text-base lg:text-lg transition-colors"
      >
        Купить
      </button>
    );
  }
  if (!user) {
    return (
      <Link
        to="/login"
        className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500
                   hover:from-emerald-400 hover:to-teal-400
                   text-white font-bold text-base flex items-center justify-center transition-colors"
      >
        Войдите для покупки
      </Link>
    );
  }
  if (listing.status !== 'active') {
    return <div className="badge-gray text-sm px-4 py-2.5 w-fit">Лот недоступен</div>;
  }
  return null;
}

export default function ListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const hydrateUser = useAuthStore((s) => s.hydrateUser);
  const [imgIdx, setImgIdx] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [guaranteeOpen, setGuaranteeOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setImgIdx(0);
    setDescExpanded(false);
  }, [id]);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.get(`/listings/${id}`).then((r) => r.data),
  });

  // Content loads after navigation — pin to top again once the lot is ready
  useEffect(() => {
    if (!listing || isLoading) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [listing?.id, isLoading]);

  const { data: sellerReviews = [] } = useQuery({
    queryKey: ['listing-seller-reviews', listing?.seller_username],
    queryFn: () => api.get(`/users/${listing.seller_username}`).then((r) => r.data?.reviews || []),
    enabled: Boolean(listing?.seller_username),
  });

  const { data: sellerOther } = useQuery({
    queryKey: ['listing-seller-other', listing?.seller_id, id],
    queryFn: () =>
      api
        .get(`/listings?seller_id=${listing.seller_id}&limit=10`)
        .then((r) => (r.data?.listings || []).filter((l) => String(l.id) !== String(id)).slice(0, 5)),
    enabled: Boolean(listing?.seller_id),
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
      // Refresh balance/profile; must use data.user (not the whole { user } envelope)
      try {
        await hydrateUser();
      } catch {
        /* balance refresh best-effort — never clear session here */
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
      navigate(user.username ? `/users/${user.username}` : '/login');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const reactivateMutation = useMutation({
    mutationFn: () => api.post(`/listings/${id}/reactivate`),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Лот активирован на 30 дней');
      qc.invalidateQueries({ queryKey: ['listing', id] });
      qc.invalidateQueries({ queryKey: ['my-listings'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Не удалось активировать'),
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
        <div className="lg:hidden sticky top-0 z-40 h-14 bg-dark-950 border-b border-dark-800" />
        <div className={`${PAGE_WIDTH_CLASS} py-4`}>
          <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)] gap-6 lg:gap-10">
            <div className="aspect-[4/3] rounded-2xl bg-dark-800 animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 w-40 bg-dark-800 rounded animate-pulse" />
              <div className="h-6 w-full bg-dark-800 rounded animate-pulse" />
              <div className="h-12 w-full bg-dark-800 rounded-xl animate-pulse" />
            </div>
          </div>
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
  const descLong = plainDesc.length > 280;
  const descShown = descExpanded || !descLong ? plainDesc : `${plainDesc.slice(0, 280).trimEnd()}…`;
  const attrEntries = listing.attributes && typeof listing.attributes === 'object'
    ? sortAttributeEntries(
      listing.listing_type,
      Object.entries(listing.attributes).filter(([key, v]) => {
        // Hide import bookkeeping — never show on storefront
        if (
          key === 'imported_from'
          || key === 'source_seller'
          || key === 'source_url'
          || key === 'external_id'
          || key === '_import'
          || String(key).startsWith('_')
        ) return false;
        return v != null && String(v).trim() !== '';
      }),
    )
    : [];
  const sellerRating = parseFloat(listing.seller_rating || 0);
  const deliveryLabel = listing.delivery_method === 'auto' ? 'Автоматическая выдача' : 'Вручную через чат сделки';
  const deliveryHint = listing.delivery_method === 'auto'
    ? 'После оплаты товар придёт сразу по указанным данным.'
    : 'Продавец передаст товар в чате сделки после оплаты.';
  const listingStatus = resolveListingStatus(listing);

  const buyProps = {
    isOwner,
    canBuy,
    user,
    listing,
    id,
    navigate,
    deleteMutation,
    reactivateMutation,
    setCheckoutOpen,
  };

  const gallery = (
    <div>
      <div className="relative aspect-[4/3] lg:aspect-[5/4] rounded-2xl overflow-hidden bg-dark-800">
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
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
              className="hidden lg:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                         bg-dark-950/70 border border-white/10 items-center justify-center text-white
                         hover:bg-dark-900 transition-colors"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => setImgIdx((i) => (i + 1) % images.length)}
              className="hidden lg:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                         bg-dark-950/70 border border-white/10 items-center justify-center text-white
                         hover:bg-dark-900 transition-colors"
              aria-label="Следующее фото"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setImgIdx(i)}
              className={`w-14 h-14 lg:w-16 lg:h-16 rounded-xl overflow-hidden shrink-0 border-2 ${
                imgIdx === i ? 'border-[#2B71F3]' : 'border-transparent'
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const purchasePanel = (
    <div className="lg:sticky lg:top-24 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-3xl lg:text-4xl font-extrabold text-emerald-400 leading-none">
          {formatPrice(listing.price)}
        </span>
        {hasDiscount && (
          <>
            <span className="inline-flex items-center rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold px-2.5 py-0.5">
              -{listing.discount_percent}%
            </span>
            <span className="text-lg text-dark-500 line-through">
              {formatPrice(listing.original_price)}
            </span>
          </>
        )}
      </div>

      <h1 className="text-xl lg:text-2xl font-bold leading-snug text-white">
        {listing.title}
      </h1>

      <div className="flex items-center gap-2 flex-wrap text-sm lg:text-base">
        {(sellerRating > 0 || listing.seller_reviews > 0) && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 text-[#5B8CFF]">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < filledStarsCount(sellerRating);
                return (
                  <Star
                    key={i}
                    size={15}
                    fill={filled ? 'currentColor' : 'none'}
                    className={filled ? '' : 'text-dark-600'}
                  />
                );
              })}
            </div>
            {sellerRating > 0 && (
              <span className="text-[#5B8CFF] font-medium tabular-nums text-sm">
                {sellerRating.toFixed(1)}
              </span>
            )}
            <Link
              to={`/users/${listing.seller_username}`}
              className="text-[#5B8CFF] text-sm hover:underline"
            >
              {formatReviewsCount(listing.seller_reviews)}
            </Link>
          </div>
        )}
        <span className="flex items-center gap-1 text-dark-500 text-sm">
          <Eye size={14} />{listing.views_count}
        </span>
        <span className="flex items-center gap-1 text-dark-500 text-sm">
          <Clock size={14} />{formatDate(listing.created_at)}
        </span>
      </div>

      <div className="rounded-2xl bg-dark-900 border border-dark-800 px-4 py-4">
        <div className="font-semibold text-base text-white mb-1.5 flex items-center gap-2">
          <Package size={18} className="text-dark-300" />
          Способ получения
        </div>
        <p className="text-base text-dark-300 leading-relaxed">
          <span className="text-white font-medium">{deliveryLabel}.</span>{' '}
          {deliveryHint}
        </p>
      </div>

      <BuyActions {...buyProps} />

      {isOwner && listing.status === 'inactive' && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
          Лот снят с витрины после 30 дней. Активируйте снова, чтобы он появился в каталоге.
        </div>
      )}
      {isOwner && listing.status === 'active' && typeof listing.showcase_days_left === 'number' && (
        <div className="text-sm text-dark-400">
          На витрине ещё {listing.showcase_days_left} дн. из {listing.showcase_days || 30}
        </div>
      )}

      {isOwner && listing.platform_fee_percent != null && (
        <div className="text-sm text-dark-400">
          Комиссия {(listing.platform_fee_percent * 100).toFixed(1).replace(/\.0$/, '')}%
          {listing.seller_is_founding ? (
            <span className="text-amber-300"> (Founders)</span>
          ) : null}
          {' · '}
          вы получите{' '}
          <span className="text-emerald-400 font-medium">
            {formatPrice(listing.seller_receives)}
          </span>
        </div>
      )}

      {isOwner ? (
        <button
          type="button"
          onClick={() => setStatusOpen(true)}
          className="flex items-center gap-2.5 py-1 group w-full text-left"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${listingStatus.dotClass}`}
            aria-hidden
          />
          <span className="flex-1 text-sm text-white font-medium">{listingStatus.label}</span>
          <ChevronRight size={18} className="text-dark-500 group-hover:text-white transition-colors" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setGuaranteeOpen(true)}
          className="flex items-center gap-2.5 py-1 group w-full text-left"
        >
          <Shield size={18} className="text-[#5B8CFF] shrink-0" />
          <span className="flex-1 text-sm text-white font-medium">Гарантия Lootz</span>
          <ChevronRight size={18} className="text-dark-500 group-hover:text-white transition-colors" />
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-dark-950 min-h-full">
      <Seo
        title={listing.title}
        description={plainDesc.slice(0, 160)}
        path={`/listings/${id}`}
      />

      {/* Mobile product bar — desktop uses global header + crumb row */}
      <header className="lg:hidden sticky top-0 z-40 bg-dark-950/95 backdrop-blur-xl border-b border-dark-800/80">
        <div className="px-2 sm:px-3 h-14 flex items-center gap-1.5">
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

      <div className={`${PAGE_WIDTH_CLASS} pt-3 lg:pt-5 pb-8 lg:pb-12`}>
        {/* Desktop crumb: back + game */}
        <div className="hidden lg:flex items-center gap-2 mb-5">
          <button
            type="button"
            onClick={goBack}
            className="w-9 h-9 flex items-center justify-center rounded-full text-white hover:bg-dark-800 transition-colors shrink-0"
            aria-label="Назад"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-dark-800 ring-1 ring-white/10 shrink-0">
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
          <div className="min-w-0 text-sm">
            <span className="font-semibold text-white">{gameLabel}</span>
            {typeLabel && <span className="text-dark-400"> · {typeLabel}</span>}
          </div>
        </div>

        {/* Hero: stacked on mobile, 2 columns on desktop (Playerok) */}
        <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)] gap-5 lg:gap-10 items-start mb-8 lg:mb-10">
          {gallery}
          {purchasePanel}
        </div>

        {/* Description */}
        <section className="mb-8 lg:mb-10 max-w-4xl">
          <h2 className="font-bold text-xl lg:text-2xl text-white mb-4 lg:mb-5">Описание</h2>
          {attrEntries.length > 0 && (
            <div className="flex flex-col gap-3.5 mb-5">
              {attrEntries.map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-dark-400 text-sm">
                    {getAttributeLabel(listing.listing_type, key)}
                  </span>
                  <span className="text-white text-base lg:text-lg">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
          {plainDesc ? (
            <p className="text-base text-dark-300 leading-relaxed whitespace-pre-wrap">
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
            <p className="text-base text-dark-500">Без описания</p>
          )}
        </section>

        {/* Seller */}
        <section className="mb-8 lg:mb-10 max-w-4xl">
          <h2 className="font-bold text-xl lg:text-2xl text-white mb-4 lg:mb-5">Продавец</h2>
          <Link
            to={`/users/${listing.seller_username}`}
            className="flex items-center gap-3.5 mb-5 group"
          >
            <div className="w-14 h-14 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xl shrink-0 overflow-hidden ring-1 ring-white/10">
              {listing.seller_avatar ? (
                <img src={listing.seller_avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                listing.seller_username?.[0]?.toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-lg text-white group-hover:text-[#5B8CFF] transition-colors truncate flex items-center gap-2">
                {listing.seller_username}
                {listing.seller_is_founding && (
                  <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-200 text-[11px] font-semibold px-2 py-0.5">
                    <Crown size={11} />
                    Founders
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-sm flex-wrap">
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
                className="btn-ghost p-2.5 shrink-0"
                title="Написать продавцу"
              >
                <MessageCircle size={20} />
              </button>
            )}
          </Link>

          <div className="flex items-center gap-2.5 mb-3.5 text-base">
            <Lock size={17} className="text-amber-400 shrink-0" />
            <span className="text-dark-200">Безопасная оплата</span>
          </div>

          <ul className="flex flex-col gap-3 mb-5">
            <li className="flex items-start gap-2.5 text-base text-dark-300">
              <CheckSquare size={18} className="text-[#5B8CFF] shrink-0 mt-0.5" />
              <span>Возврат средств, если вы не получили товар</span>
            </li>
            <li className="flex items-start gap-2.5 text-base text-dark-300">
              <CheckSquare size={18} className="text-[#5B8CFF] shrink-0 mt-0.5" />
              <span>Возврат средств, если товар не соответствует описанию</span>
            </li>
          </ul>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Shield size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-base text-emerald-300">Защищено эскроу</p>
              <p className="text-dark-400 text-sm mt-1">
                Средства передаются продавцу только после вашего подтверждения
              </p>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="mb-10 lg:mb-12">
          <div className="flex items-center justify-between gap-3 mb-4 lg:mb-5">
            <h2 className="font-bold text-xl lg:text-2xl text-white">
              Отзывы о {listing.seller_username}
              {listing.seller_reviews ? ` (${listing.seller_reviews})` : ''}
            </h2>
            {listing.seller_username && (
              <Link
                to={`/users/${listing.seller_username}`}
                className="text-sm lg:text-base text-[#5B8CFF] hover:underline shrink-0 flex items-center gap-0.5"
              >
                Все отзывы
                <ChevronRight size={18} />
              </Link>
            )}
          </div>

          {(sellerRating > 0 || listing.seller_reviews > 0) && (
            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl lg:text-4xl font-bold text-white tabular-nums">
                {sellerRating > 0 ? sellerRating.toFixed(1) : '—'}
              </span>
              <div>
                <div className="flex items-center gap-0.5 text-[#5B8CFF]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      fill={i < filledStarsCount(sellerRating) ? 'currentColor' : 'none'}
                      className={i < filledStarsCount(sellerRating) ? '' : 'text-dark-600'}
                    />
                  ))}
                </div>
                <div className="text-sm text-dark-400 mt-0.5">
                  {formatReviewsCount(listing.seller_reviews)}
                </div>
              </div>
            </div>
          )}

          {sellerReviews.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {sellerReviews.slice(0, 6).map((r, i) => (
                <div
                  key={`${r.reviewer_username}-${r.created_at}-${i}`}
                  className="rounded-2xl bg-dark-900 border border-dark-800 px-4 py-3.5"
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-9 h-9 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-semibold overflow-hidden shrink-0">
                      {r.reviewer_avatar ? (
                        <img src={r.reviewer_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (r.reviewer_username || '?')[0].toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-medium text-white truncate">
                        {r.reviewer_username}
                      </div>
                      <div className="flex items-center gap-0.5 text-[#5B8CFF] mt-0.5">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star
                            key={si}
                            size={12}
                            fill={si < (r.rating || 0) ? 'currentColor' : 'none'}
                            className={si < (r.rating || 0) ? '' : 'text-dark-600'}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-dark-500 shrink-0">
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-sm lg:text-base text-dark-300 leading-relaxed whitespace-pre-wrap line-clamp-4">
                      {r.comment}
                    </p>
                  )}
                  {labelsForCriteria(r.criteria).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {labelsForCriteria(r.criteria).map((label) => (
                        <span
                          key={label}
                          className="px-2 py-0.5 rounded-lg text-[11px] bg-dark-800 border border-dark-700 text-dark-300"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-dark-900 border border-dark-800 px-5 py-6 text-center max-w-xl">
              <p className="text-base text-dark-400">Пока нет отзывов об этом продавце</p>
              <p className="text-sm text-dark-500 mt-1.5">Оставьте отзыв после завершённой сделки</p>
            </div>
          )}
        </section>

        {/* Other listings from seller */}
        {sellerOther?.length > 0 && (
          <section>
            <div className="flex items-center justify-between gap-3 mb-4 lg:mb-5">
              <h2 className="font-bold text-xl lg:text-2xl text-white">Другие товары продавца</h2>
              <Link
                to={`/users/${listing.seller_username}`}
                className="text-sm lg:text-base text-[#5B8CFF] hover:underline flex items-center gap-0.5"
              >
                Все товары
                <ChevronRight size={18} />
              </Link>
            </div>
            <div className={LISTING_GRID_CLASS}>
              {sellerOther.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}
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
      <GuaranteeModal open={guaranteeOpen} onClose={() => setGuaranteeOpen(false)} />
      <ListingStatusModal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        listing={listing}
      />
    </div>
  );
}
