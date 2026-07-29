import { Link } from 'react-router-dom';
import { Star, Eye, Zap } from 'lucide-react';
import { formatPrice } from '../utils/format';

const PLACEHOLDER = 'https://placehold.co/400x300/1a1a27/6083ff?text=GameMarket';

export default function ListingCard({ listing, showOwnerActions = false, onEdit, onDelete }) {
  const image = listing.images?.[0] || PLACEHOLDER;
  const hasDiscount = listing.discount_percent > 0 && listing.original_price;
  const isAuto = listing.delivery_method === 'auto';

  return (
    <div className="card flex flex-col overflow-hidden hover:border-dark-600 hover:-translate-y-0.5
                    transition-all duration-200 group animate-fade-in relative">
      <Link to={`/listings/${listing.id}`} className="flex flex-col flex-1">
        <div className="relative aspect-[4/3] overflow-hidden bg-dark-800">
          <img
            src={image}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.src = PLACEHOLDER; }}
            loading="lazy"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {listing.is_featured && (
              <span className="badge bg-brand-500/90 text-white text-xs font-semibold">ТОП</span>
            )}
            {isAuto && (
              <span className="badge bg-violet-500/90 text-white text-xs font-semibold flex items-center gap-0.5">
                <Zap size={10} /> Автовыдача
              </span>
            )}
          </div>
          {hasDiscount && (
            <span className="absolute top-2 right-2 badge bg-rose-500 text-white text-xs font-bold">
              -{listing.discount_percent}%
            </span>
          )}
        </div>

        <div className="p-3 flex flex-col gap-2 flex-1">
          {listing.game && (
            <span className="text-xs text-brand-400 font-medium uppercase tracking-wide truncate">
              {listing.game}
            </span>
          )}
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-brand-300 transition-colors">
            {listing.title}
          </h3>

          <div className="mt-auto pt-2">
            <div className="flex items-end justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-none">{formatPrice(listing.price)}</span>
                {hasDiscount && (
                  <span className="text-xs text-dark-500 line-through mt-0.5">
                    {formatPrice(listing.original_price)}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-0.5 text-xs text-dark-400">
                <Eye size={12} />{listing.views_count || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-dark-800">
            <div className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-semibold">
              {listing.seller_username?.[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-dark-400 flex-1 truncate">{listing.seller_username}</span>
            {(listing.seller_rating > 0 || listing.seller_reviews > 0) && (
              <span className="flex items-center gap-0.5 text-xs text-yellow-400">
                <Star size={11} fill="currentColor" />
                {parseFloat(listing.seller_rating || 0).toFixed(1)}
                {listing.seller_reviews > 0 && (
                  <span className="text-dark-500">({listing.seller_reviews})</span>
                )}
              </span>
            )}
          </div>
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
