import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Star, Package, Calendar, ShoppingBag, MessageCircle, BadgeCheck, Pencil, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import ListingCard from '../components/ListingCard';
import Seo from '../components/Seo';
import ProfileMenuModal from '../components/ProfileMenuModal';
import useAuthStore from '../store/authStore';
import { formatDate, formatPrice } from '../utils/format';

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
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isOwn = currentUser?.username === username;
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => api.get(`/users/${username}`).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/listings/${id}`),
    onSuccess: () => {
      toast.success('Лот удалён');
      qc.invalidateQueries(['profile', username]);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка удаления'),
  });

  const startChat = async () => {
    if (!currentUser) return navigate('/login');
    try {
      const { data } = await api.post('/chats', { partner_id: profile.id });
      navigate(`/chats/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Не удалось открыть чат');
    }
  };

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

  const rating = parseFloat(profile.rating) || 0;
  const avatarUrl = isOwn ? (currentUser?.avatar_url || profile.avatar_url) : profile.avatar_url;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Seo title={profile.username} description={`Профиль продавца ${profile.username} на GameMarket`} path={`/users/${profile.username}`} />

      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-dark-700" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center text-3xl font-bold shrink-0">
              {profile.username[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              {profile.is_verified && <BadgeCheck size={18} className="text-brand-400" />}
              {isOwn && (
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 font-medium ml-1"
                >
                  <Pencil size={14} />
                  Редактировать
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-dark-400">
              <span className="flex items-center gap-1.5">
                <StarRow rating={Math.round(rating) || 0} />
                <span className="font-medium text-white">{rating.toFixed(1)}</span>
                <span>({profile.reviews_count || 0} отзывов)</span>
              </span>
              <span className="flex items-center gap-1">
                <ShoppingBag size={13} />{profile.deals_count || 0} сделок
              </span>
              <span className="flex items-center gap-1">
                <Package size={13} />{profile.sales_count || 0} продаж
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={13} />С {formatDate(profile.created_at)}
              </span>
            </div>
            {profile.bio && <p className="mt-3 text-dark-300 text-sm">{profile.bio}</p>}
          </div>
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            {isOwn && currentUser && (
              <Link
                to="/wallet"
                className="rounded-xl bg-brand-500/15 border border-brand-500/30 px-4 py-3 text-brand-300 font-semibold text-sm hover:bg-brand-500/25 transition-colors inline-flex items-center gap-2"
              >
                <Wallet size={16} />
                {formatPrice(currentUser.balance)}
              </Link>
            )}
            {!isOwn && currentUser && (
              <button onClick={startChat} className="btn-secondary flex items-center gap-2">
                <MessageCircle size={16} /> Написать
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="font-bold text-lg mb-4">Активные лоты ({profile.listings?.length || 0})</h2>
        {profile.listings?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {profile.listings.map((l) => (
              <ListingCard
                key={l.id}
                listing={{
                  ...l,
                  seller_username: profile.username,
                  seller_rating: profile.rating,
                  seller_reviews: profile.reviews_count,
                }}
                showOwnerActions={isOwn}
                onEdit={(listing) => navigate(`/listings/${listing.id}/edit`)}
                onDelete={(listing) => {
                  if (window.confirm('Удалить лот?')) deleteMutation.mutate(listing.id);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-dark-400 text-sm">
            Нет активных лотов
            {isOwn && (
              <div className="mt-3">
                <Link to="/listings/create" className="btn-primary text-sm">Создать лот</Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-bold text-lg mb-4">Отзывы ({profile.reviews_count || 0})</h2>
        {profile.reviews?.length > 0 ? (
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
        ) : (
          <div className="card p-8 text-center text-dark-400 text-sm">Пока нет отзывов</div>
        )}
      </div>

      {isOwn && (
        <ProfileMenuModal open={menuOpen} onClose={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
