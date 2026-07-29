import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, Package, Calendar } from 'lucide-react';
import api from '../utils/api';
import ListingCard from '../components/ListingCard';
import { formatDate } from '../utils/format';

function StarRow({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? 'text-yellow-400' : 'text-dark-700'}
          fill={s <= rating ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { username } = useParams();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => api.get(`/users/${username}`).then((r) => r.data),
  });

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="flex gap-5 mb-8">
        <div className="w-24 h-24 rounded-2xl bg-dark-800" />
        <div className="flex flex-col gap-3 pt-2">
          <div className="h-6 w-48 bg-dark-800 rounded" />
          <div className="h-4 w-32 bg-dark-800 rounded" />
        </div>
      </div>
    </div>
  );

  if (!profile) return <div className="text-center py-20 text-dark-400">Пользователь не найден</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center text-3xl font-bold shrink-0">
            {profile.username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.username}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-dark-400">
              {profile.rating > 0 && (
                <span className="flex items-center gap-1.5">
                  <StarRow rating={Math.round(profile.rating)} />
                  <span className="font-medium text-white">{parseFloat(profile.rating).toFixed(1)}</span>
                  <span>({profile.reviews_count} отзывов)</span>
                </span>
              )}
              <span className="flex items-center gap-1"><Package size={13} />{profile.sales_count} продаж</span>
              <span className="flex items-center gap-1"><Calendar size={13} />С {formatDate(profile.created_at)}</span>
            </div>
            {profile.bio && <p className="mt-3 text-dark-300 text-sm">{profile.bio}</p>}
          </div>
        </div>
      </div>

      {/* Active listings */}
      {profile.listings?.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-lg mb-4">Активные лоты ({profile.listings.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {profile.listings.map((l) => (
              <ListingCard key={l.id} listing={{ ...l, seller_username: profile.username, seller_rating: profile.rating }} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {profile.reviews?.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-4">Отзывы</h2>
          <div className="flex flex-col gap-3">
            {profile.reviews.map((r, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-semibold">
                    {r.reviewer_username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{r.reviewer_username}</p>
                    <StarRow rating={r.rating} />
                  </div>
                  <span className="ml-auto text-xs text-dark-400">{formatDate(r.created_at)}</span>
                </div>
                {r.comment && <p className="text-dark-300 text-sm">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
