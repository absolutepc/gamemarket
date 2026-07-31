import { Link } from 'react-router-dom';
import { Star, Zap } from 'lucide-react';
import { formatPrice, formatReviewsCount } from '../utils/format';
import { resolveAssortmentIcon } from '../utils/assortmentIcons';

const PLACEHOLDER = '/placeholder-listing.svg';

function filledStarsCount(rating) {
  const value = parseFloat(rating) || 0;
  if (value <= 0) return 0;
  return Math.min(5, Math.round(value));
}

export default function ListingCard({ listing, showOwnerActions = false, onEdit, onDelete }) {
  const image = listing.images?.[0] || PLACEHOLDER;
  const hasDiscount = listing.discount_percent > 0 && listing.original_price;
  const isAuto = listing.delivery_method === 'auto';
  const gameLabel = listing.game || listing.category_name || 'Товар';
  const gameIcon = resolveAssortmentIcon(listing.game || listing.title || listing.category_name);

  return (
    <div className="rounded-2xl bg-dark-900 border border-dark-800 flex flex-col overflow-hidden
                    hover:border-dark-600 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)]
                    transition-all duration-200 group animate-fade-in relative">
      <Link to={`/listings/${listing.id}`} className="flex flex-col flex-1">
        {/* Playerok-style card header: game icon + name/category */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden bg-dark-800 shrink-0 ring-1 ring-white/10">
            <img
              src={gameIcon}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/assortment/other-apps.png';
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-white truncate leading-tight">{gameLabel}</div>
            {listing.category_name && listing.game && (
              <div className="text-[10px] text-dark-400 truncate leading-tight mt-0.5">
                {listing.category_name}
              </div>
            )}
          </div>
        </div>

        <div className="relative mx-1.5 aspect-[4/3] overflow-hidden rounded-xl bg-dark-800">
          <img
            src={image}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.src = PLACEHOLDER; }}
            loading="lazy"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {listing.is_featured && (
              <span className="badge bg-[#2B71F3]/95 text-white text-[10px] font-semibold">ТОП</span>
            )}
            {isAuto && (
              <span className="badge bg-violet-500/95 text-white text-[10px] font-semibold flex items-center gap-0.5">
                <Zap size={10} /> Автовыдача
              </span>
            )}
          </div>
        </div>

        <div className="px-3 py-3 flex flex-col gap-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-bold text-emerald-400 leading-none">
              {formatPrice(listing.price)}
            </span>
            {hasDiscount && (
              <>
                <span className="badge bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5">
                  -{listing.discount_percent}%
                </span>
                <span className="text-xs text-dark-500 line-through leading-none">
                  {formatPrice(listing.original_price)}
                </span>
              </>
            )}
          </div>

          <h3 className="font-semibold text-xs sm:text-sm leading-snug line-clamp-2 text-white">
            {listing.title}
          </h3>

          {(listing.seller_rating > 0 || listing.seller_reviews > 0) && (
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-dark-800 mt-auto text-[11px]">
              <div className="flex items-center gap-0.5 text-yellow-400 shrink-0">
                {Array.from({ length: 5 }).map((_, i) => {
                  const filled = i < filledStarsCount(listing.seller_rating);
                  return (
                    <Star
                      key={i}
                      size={11}
                      fill={filled ? 'currentColor' : 'none'}
                      className={filled ? '' : 'text-dark-600'}
                    />
                  );
                })}
              </div>
              {parseFloat(listing.seller_rating) > 0 && (
                <span className="text-yellow-400 font-medium tabular-nums shrink-0">
                  {parseFloat(listing.seller_rating).toFixed(1)}
                </span>
              )}
              <span className="text-dark-400 truncate">
                {formatReviewsCount(listing.seller_reviews)}
              </span>
            </div>
          )}
        </div>
      </Link>

      {showOwnerActions && (
        <div className="px-3 pb-3 flex gap-2">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onEdit?.(listing); }}
            className="btn-secondary flex-1 text-xs py-1.5"
          >
            Изменить
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onDelete?.(listing); }}
            className="btn-secondary flex-1 text-xs py-1.5 text-red-400 hover:border-red-500/40"
          >
            Удалить
          </button>
        </div>
      )}
    </div>
  );
}
