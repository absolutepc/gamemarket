import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Star, Package, Calendar, ShoppingBag, MessageCircle, BadgeCheck, Pencil, Wallet, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import ListingCard, { LISTING_GRID_CLASS, PAGE_WIDTH_CLASS } from '../components/ListingCard';
import Seo from '../components/Seo';
import ProfileMenuModal from '../components/ProfileMenuModal';
import useAuthStore from '../store/authStore';
import { formatDate, formatPrice } from '../utils/format';
import { compressImageFile } from '../utils/imageCompress';
import { labelsForCriteria } from '../utils/reviewCriteria';

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

function CriteriaTags({ criteria }) {
  const labels = labelsForCriteria(criteria);
  if (!labels.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {labels.map((label) => (
        <span
          key={label}
          className="px-2 py-0.5 rounded-lg text-[11px] bg-dark-800 border border-dark-700 text-dark-300"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isOwn = currentUser?.username === username;
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileRef = useRef(null);

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => api.get(`/users/${username}`).then((r) => r.data),
    enabled: Boolean(username),
  });

  const { data: myListings, isLoading: myListingsLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => api.get('/users/me/listings').then((r) => r.data),
    enabled: isOwn,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/listings/${id}`),
    onSuccess: () => {
      toast.success('Лот удалён');
      qc.invalidateQueries(['profile', username]);
      qc.invalidateQueries(['my-listings']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка удаления'),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id) => api.post(`/listings/${id}/reactivate`),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Лот активирован на 30 дней');
      qc.invalidateQueries(['profile', username]);
      qc.invalidateQueries(['my-listings']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Не удалось активировать'),
  });

  const ownListings = isOwn && !myListingsLoading ? (myListings || []) : null;
  const activeListings = ownListings
    ? ownListings.filter((l) => l.status === 'active')
    : (profile?.listings || []);
  const inactiveListings = ownListings
    ? ownListings.filter((l) => l.status === 'inactive')
    : [];

  const startChat = async () => {
    if (!currentUser) return navigate('/login');
    try {
      const { data } = await api.post('/chats', { partner_id: profile.id });
      navigate(`/chats/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Не удалось открыть чат');
    }
  };

  const onAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !isOwn) return;
    setAvatarBusy(true);
    try {
      const dataUrl = await compressImageFile(file, { maxSide: 320, quality: 0.78 });
      const { data } = await api.put('/users/me/profile', { avatar_url: dataUrl });
      setUser({ ...currentUser, avatar_url: data.avatar_url });
      qc.invalidateQueries(['profile', username]);
      toast.success('Аватар обновлён');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Не удалось загрузить аватар');
    } finally {
      setAvatarBusy(false);
    }
  };

  if (!username) {
    return <Navigate to="/users" replace />;
  }

  if (isLoading) return (
    <div className={`${PAGE_WIDTH_CLASS} py-8 animate-pulse`}>
      <div className="flex gap-5 mb-8">
        <div className="w-24 h-24 rounded-2xl bg-dark-800" />
        <div className="flex flex-col gap-3 pt-2">
          <div className="h-6 w-48 bg-dark-800 rounded" />
          <div className="h-4 w-32 bg-dark-800 rounded" />
        </div>
      </div>
    </div>
  );

  if (isError || !profile) return <div className="text-center py-20 text-dark-400">Пользователь не найден</div>;

  const rating = parseFloat(profile.rating) || 0;
  const avatarUrl = isOwn ? (currentUser?.avatar_url || profile.avatar_url) : profile.avatar_url;

  return (
    <div className={`${PAGE_WIDTH_CLASS} py-8`}>
      <Seo title={profile.username} description={`Профиль продавца ${profile.username} на Lootz`} path={`/users/${profile.username}`} />

      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-[#2B71F3]/40 ring-offset-2 ring-offset-dark-900 bg-dark-800 border border-dark-700">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-3xl font-bold">
                  {(profile.username?.[0] || '?').toUpperCase()}
                </div>
              )}
            </div>
            {isOwn && (
              <>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarBusy}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#2B71F3] text-white
                             flex items-center justify-center border-2 border-dark-900 shadow-md
                             hover:bg-blue-500 disabled:opacity-60"
                  aria-label="Загрузить аватар"
                >
                  <Camera size={14} />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatarFile}
                />
              </>
            )}
          </div>
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
        <h2 className="font-bold text-lg mb-4">Активные лоты ({activeListings.length})</h2>
        {isOwn && (
          <p className="text-xs text-dark-400 mb-3">
            Лоты висят на витрине 30 дней, затем их нужно снова активировать.
          </p>
        )}
        {activeListings.length > 0 ? (
          <div className={LISTING_GRID_CLASS}>
            {activeListings.map((l) => (
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
                onReactivate={(listing) => reactivateMutation.mutate(listing.id)}
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

      {isOwn && inactiveListings.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-lg mb-4">
            Сняты с витрины ({inactiveListings.length})
          </h2>
          <p className="text-xs text-dark-400 mb-3">
            Срок 30 дней истёк — нажмите «Активировать», чтобы снова показать лот в каталоге.
          </p>
          <div className={LISTING_GRID_CLASS}>
            {inactiveListings.map((l) => (
              <ListingCard
                key={l.id}
                listing={{
                  ...l,
                  seller_username: profile.username,
                  seller_rating: profile.rating,
                  seller_reviews: profile.reviews_count,
                }}
                showOwnerActions
                onEdit={(listing) => navigate(`/listings/${listing.id}/edit`)}
                onDelete={(listing) => {
                  if (window.confirm('Удалить лот?')) deleteMutation.mutate(listing.id);
                }}
                onReactivate={(listing) => reactivateMutation.mutate(listing.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-bold text-lg mb-4">Отзывы ({profile.reviews_count || 0})</h2>
        {profile.reviews?.length > 0 ? (
          <div className="flex flex-col gap-3">
            {profile.reviews.map((r, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-semibold">
                    {(r.reviewer_username?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{r.reviewer_username}</p>
                    <StarRow rating={r.rating} />
                  </div>
                  <span className="ml-auto text-xs text-dark-400">{formatDate(r.created_at)}</span>
                </div>
                {r.comment && <p className="text-dark-300 text-sm">{r.comment}</p>}
                <CriteriaTags criteria={r.criteria} />
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
