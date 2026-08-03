import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatPrice } from '../utils/format';
import { GlassModalShell } from './GlassModalShell';
import useAuthStore from '../store/authStore';

export const PROMOTE_PACKAGES_FALLBACK = [
  { days: 3, price: 149, label: '3 дня' },
  { days: 7, price: 299, label: '7 дней' },
  { days: 14, price: 499, label: '14 дней' },
];

export default function PromoteListingModal({
  open,
  onClose,
  listing,
  packages: packagesProp,
  onPromoted,
}) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [packages, setPackages] = useState(packagesProp?.length ? packagesProp : PROMOTE_PACKAGES_FALLBACK);
  const [selectedDays, setSelectedDays] = useState(7);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedDays(7);
    if (packagesProp?.length) {
      setPackages(packagesProp);
      return;
    }
    api.get('/listings/promote/packages')
      .then((r) => {
        if (r.data?.packages?.length) setPackages(r.data.packages);
      })
      .catch(() => {});
  }, [open, packagesProp]);

  const selected = packages.find((p) => p.days === selectedDays) || packages[0];
  const balance = parseFloat(user?.balance || 0);
  const canPay = selected && balance >= selected.price;

  const submit = async () => {
    if (!listing?.id || !selected) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/listings/${listing.id}/promote`, { days: selected.days });
      if (data.balance != null && user) {
        setUser({ ...user, balance: data.balance });
      }
      toast.success(data.message || 'Лот продвигается');
      onPromoted?.(data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Не удалось продвинуть лот';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModalShell open={open} onClose={onClose} labelledBy="promote-listing-title">
      <div className="flex flex-col text-center">
        <div
          className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4
                     border border-white/25 bg-[#2B71F3]/25"
        >
          <Zap size={26} className="text-[#8EB6FF]" />
        </div>
        <h2 id="promote-listing-title" className="text-xl sm:text-2xl font-bold text-white mb-2">
          Продвинуть лот
        </h2>
        <p className="text-sm text-white/70 mb-5 max-w-sm mx-auto leading-relaxed">
          ТОП поднимает объявление выше в каталоге — выше обычных лотов и Founders.
          Срок можно продлить повторной покупкой.
        </p>

        <div className="flex flex-col gap-2 mb-4 text-left">
          {packages.map((pkg) => {
            const active = pkg.days === selected?.days;
            return (
              <button
                key={pkg.days}
                type="button"
                onClick={() => setSelectedDays(pkg.days)}
                className={`rounded-xl border px-4 py-3 flex items-center justify-between transition-colors ${
                  active
                    ? 'border-[#2B71F3] bg-[#2B71F3]/15 text-white'
                    : 'border-white/15 bg-white/5 text-dark-200 hover:border-white/30'
                }`}
              >
                <span className="font-medium">{pkg.label}</span>
                <span className="font-semibold text-emerald-400">{formatPrice(pkg.price)}</span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-white/50 mb-4">
          Баланс: {formatPrice(balance)}
          {!canPay && selected ? (
            <>
              {' · '}
              <Link to="/wallet" className="text-[#8EB6FF] hover:underline" onClick={onClose}>
                Пополнить
              </Link>
            </>
          ) : null}
        </p>

        {listing?.featured_until && new Date(listing.featured_until) > new Date() && (
          <p className="text-xs text-amber-200/90 mb-3">
            Сейчас в ТОП до {new Date(listing.featured_until).toLocaleString('ru-RU')} — покупка продлит срок.
          </p>
        )}

        <button
          type="button"
          disabled={loading || !canPay || !selected}
          onClick={submit}
          className="w-full h-12 rounded-xl bg-[#2B71F3] hover:bg-[#2563eb] disabled:opacity-50
                     text-white font-semibold text-base transition-colors"
        >
          {loading ? 'Оплата…' : `Оплатить ${selected ? formatPrice(selected.price) : ''}`}
        </button>
      </div>
    </GlassModalShell>
  );
}
