import { Link } from 'react-router-dom';
import { Star, Eye } from 'lucide-react';
import { formatPrice, formatRelative } from '../utils/format';

const PLACEHOLDER = 'https://placehold.co/400x300/1a1a27/6083ff?text=GameMarket';

export default function ListingCard({ listing }) {
  const image = listing.images?.[0] || PLACEHOLDER;

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="card flex flex-col overflow-hidden hover:border-dark-600 hover:-translate-y-0.5
                 transition-all duration-200 group animate-fade-in"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-dark-800">
        <img
          src={image}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = PLACEHOLDER; }}
          loading="lazy"
        />
        {listing.is_featured && (
          <span className="absolute top-2 left-2 badge bg-brand-500/90 text-white text-xs font-semibold">
            ТОП
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        {listing.game && (
          <span className="text-xs text-brand-400 font-medium uppercase tracking-wide">{listing.game}</span>
        )}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-brand-300 transition-colors">
          {listing.title}
        </h3>

        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-white">{formatPrice(listing.price)}</span>
          <div className="flex items-center gap-3 text-xs text-dark-400">
            <span className="flex items-center gap-0.5"><Eye size={12} />{listing.views_count}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-dark-800">
          <div className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-semibold">
            {listing.seller_username?.[0]?.toUpperCase()}
          </div>
          <span className="text-xs text-dark-400 flex-1">{listing.seller_username}</span>
          {listing.seller_rating > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-yellow-400">
              <Star size={11} fill="currentColor" />
              {parseFloat(listing.seller_rating).toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
