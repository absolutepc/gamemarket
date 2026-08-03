import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/format';

/**
 * Playerok-style product chip under a review — image, price, title → listing page.
 */
export default function ReviewListingChip({ review }) {
  const listingId = review?.listing_id;
  if (!listingId) return null;

  const title = review.listing_title || 'Лот';
  const price = review.listing_price;
  const original = review.listing_original_price;
  const discount = review.listing_discount_percent;
  const image = review.listing_image;
  const gone = review.listing_status && review.listing_status !== 'active';

  const inner = (
    <div
      className={`flex items-center gap-3 rounded-xl bg-dark-950/80 border border-dark-800 px-2.5 py-2
                  ${listingId && !gone ? 'hover:border-dark-600 transition-colors' : 'opacity-70'}`}
    >
      <div className="w-11 h-11 rounded-lg bg-dark-800 overflow-hidden shrink-0 ring-1 ring-white/10">
        {image ? (
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-dark-800" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-white tabular-nums">
            {formatPrice(price)}
          </span>
          {discount > 0 && original != null ? (
            <>
              <span className="text-[10px] font-semibold text-rose-300 bg-rose-500/15 px-1.5 py-0.5 rounded">
                −{discount}%
              </span>
              <span className="text-xs text-dark-500 line-through tabular-nums">
                {formatPrice(original)}
              </span>
            </>
          ) : null}
        </div>
        <p className="text-xs text-dark-400 truncate mt-0.5">{title}</p>
        {gone ? <p className="text-[10px] text-dark-500 mt-0.5">Лот недоступен</p> : null}
      </div>
    </div>
  );

  if (!listingId || gone) return <div className="mt-3">{inner}</div>;

  return (
    <Link to={`/listings/${listingId}`} className="block mt-3 no-underline">
      {inner}
    </Link>
  );
}
