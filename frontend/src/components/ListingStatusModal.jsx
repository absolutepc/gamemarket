import { Crown } from 'lucide-react';
import { GlassModalShell } from './GlassModalShell';

/** Playerok-style listing visibility status for the seller's own lot */
export function resolveListingStatus(listing) {
  if (listing?.is_featured) {
    return {
      key: 'premium',
      label: 'Премиум',
      title: 'Статус Премиум',
      description: 'Чем выше статус, тем быстрее и дороже вы продадите свой товар. Премиум повышает заметность лота в каталоге.',
      dotClass: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.55)]',
      iconClass: 'bg-amber-400',
    };
  }
  if (listing?.seller_is_founding) {
    return {
      key: 'founders',
      label: 'Founders',
      title: 'Статус Founders',
      description: 'Чем выше статус, тем быстрее и дороже вы продадите свой товар. Founders даёт сниженную комиссию и приоритет в выдаче.',
      dotClass: 'bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.5)]',
      iconClass: 'bg-gradient-to-br from-amber-300 to-amber-500',
      showCrown: true,
    };
  }
  return {
    key: 'normal',
    label: 'Обычный',
    title: 'Статус Обычный',
    description: 'Чем выше статус, тем быстрее и дороже вы продадите свой товар',
    dotClass: 'bg-[#2B71F3] shadow-[0_0_10px_rgba(43,113,243,0.55)]',
    iconClass: 'bg-[#2B71F3]',
  };
}

export default function ListingStatusModal({ open, onClose, listing }) {
  const status = resolveListingStatus(listing);

  return (
    <GlassModalShell open={open} onClose={onClose} labelledBy="listing-status-modal-title">
      <div className="flex flex-col items-center text-center">
        <div
          className={`w-14 h-14 rounded-full ${status.iconClass}
                      flex items-center justify-center mb-4
                      shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_24px_rgba(0,0,0,0.35)]`}
        >
          {status.showCrown ? (
            <Crown size={26} className="text-dark-950" strokeWidth={2.2} />
          ) : (
            <span className="sr-only">{status.label}</span>
          )}
        </div>

        <h2 id="listing-status-modal-title" className="text-xl sm:text-2xl font-bold text-white mb-3">
          {status.title}
        </h2>

        <p className="text-sm sm:text-base text-white/75 leading-relaxed mb-6 max-w-sm">
          {status.description}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-[#2B71F3] hover:bg-[#2563eb] text-white font-semibold
                     text-base transition-colors shadow-[0_8px_24px_rgba(43,113,243,0.35)]"
        >
          Понятно, спасибо
        </button>
      </div>
    </GlassModalShell>
  );
}
