import { Link } from 'react-router-dom';
import { Star, Zap } from 'lucide-react';
import { formatPrice, formatReviewsCount } from '../utils/format';
import { resolveAssortmentIcon, resolveAssortmentItem } from '../utils/assortmentIcons';
import { LISTING_TYPE_OPTIONS } from '../utils/listingTypes';

const PLACEHOLDER = '/placeholder-listing.svg';

/** Wide page shell — fits 5 listing columns like Playerok */
export const PAGE_WIDTH_CLASS = 'max-w-[1440px] mx-auto px-4 sm:px-6';

/** Same listing grid in home / catalog / profile */
export const LISTING_GRID_CLASS =
  'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3';

function filledStarsCount(rating) {
  const value = parseFloat(rating) || 0;
  if (value <= 0) return 0;
  return Math.min(5, Math.round(value));
}

export default function ListingCard({ listing, showOwnerActions = false, onEdit, onDelete }) {
  const image = listing.images?.[0] || PLACEHOLDER;
  const hasDiscount = listing.discount_percent > 0 && listing.original_price;
  const isAuto = listing.delivery_method === 'auto';
  const matched = resolveAssortmentItem(listing.game || listing.title);
  const gameLabel = matched?.name || listing.game || listing.category_name || 'Товар';
  const gameIcon = matched?.icon || resolveAssortmentIcon(listing.game || listing.title);
  const typeLabel =
    LISTING_TYPE_OPTIONS.find((o) => o.value === listing.listing_type)?.label ||
    listing.category_name;

  return (
    <div className="rounded-2xl bg-dark-900 border border-dark-800 flex flex-col overflow-hidden w-full min-w-0
                    hover:border-dark-600 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)]
                    transition-all duration-200 group animate-fade-in relative">
      <Link to={`/listings/${listing.id}`} className="flex flex-col flex-1 min-w-0">
        {/* Playerok-style card header: game icon + name/category */}
        <div className="flex items-center gap-2 px-2.5 sm:px-3 pt-2.5 sm:pt-3 pb-2 min-w-0">
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
            {typeLabel && listing.game && (
              <div className="text-[10px] text-dark-400 truncate leading-tight mt-0.5">
                {typeLabel}
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

        <div className="px-2.5 sm:px-3 py-2.5 sm:py-3 flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-base sm:text-lg font-bold text-emerald-400 leading-none">
              {formatPrice(listing.price)}
            </span>
            {hasDiscount && (
              <>
                <span className="badge bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 shrink-0">
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
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-dark-800 mt-auto text-[11px] min-w-0">
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
        <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 grid grid-cols-2 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onEdit?.(listing); }}
            className="min-w-0 inline-flex items-center justify-center rounded-xl border border-dark-700
                       bg-dark-800 hover:bg-dark-700 text-white text-[11px] sm:text-xs font-medium
                       px-1.5 sm:px-2 py-1.5 transition-colors active:scale-95"
          >
            Изменить
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onDelete?.(listing); }}
            className="min-w-0 inline-flex items-center justify-center rounded-xl border border-dark-700
                       bg-dark-800 hover:bg-dark-700 hover:border-red-500/40 text-red-400
                       text-[11px] sm:text-xs font-medium px-1.5 sm:px-2 py-1.5 transition-colors active:scale-95"
          >
            Удалить
          </button>
        </div>
      )}
    </div>
  );
}
