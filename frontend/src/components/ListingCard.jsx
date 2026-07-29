import { Link } from 'react-router-dom';
import { Star, Zap } from 'lucide-react';
import { formatPrice } from '../utils/format';

const PLACEHOLDER = 'https://placehold.co/400x300/1a1a27/6083ff?text=GameMarket';

export default function ListingCard({ listing, showOwnerActions = false, onEdit, onDelete }) {
  const image = listing.images?.[0] || PLACEHOLDER;
  const hasDiscount = listing.discount_percent > 0 && listing.original_price;
  const isAuto = listing.delivery_method === 'auto';
  const gameLabel = listing.game || listing.category_name || 'Товар';
  const gameLetter = String(gameLabel).trim().charAt(0).toUpperCase() || 'G';

  return (
    <div className="rounded-2xl bg-dark-900 border border-dark-800 flex flex-col overflow-hidden
                    hover:border-dark-600 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)]
                    transition-all duration-200 group animate-fade-in relative">
      <Link to={`/listings/${listing.id}`} className="flex flex-col flex-1">
        {/* Playerok-style card header: game icon + name/category */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-dark-700 to-dark-800
                          flex items-center justify-center text-[11px] font-bold text-white shrink-0
                          ring-1 ring-white/10">
            {gameLetter}
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

        <div className="relative mx-3 aspect-[4/3] overflow-hidden rounded-xl bg-dark-800">
          <img
            src={image}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.src = PLACEHOLDER; }}
            loading="lazy"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 pb-2.5 px-2.5">
            <h3 className="font-semibold text-xs sm:text-sm leading-snug line-clamp-2 text-white">
              {listing.title}
            </h3>
          </div>
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

          {(listing.seller_rating > 0 || listing.seller_reviews > 0) && (
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-dark-800 mt-auto">
              <div className="flex items-center gap-0.5 text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => {
                  const rating = parseFloat(listing.seller_rating || 0);
                  const filled = i < Math.round(rating);
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
              <span className="text-[11px] text-yellow-400 font-medium tabular-nums">
                {parseFloat(listing.seller_rating || 0).toFixed(1)}
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
