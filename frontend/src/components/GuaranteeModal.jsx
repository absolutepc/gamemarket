import { Shield } from 'lucide-react';
import { GlassModalShell } from './GlassModalShell';

export default function GuaranteeModal({ open, onClose }) {
  return (
    <GlassModalShell open={open} onClose={onClose} labelledBy="guarantee-modal-title">
      <div className="flex flex-col items-center text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4
                     border border-white/25"
          style={{
            background: 'linear-gradient(160deg, rgba(91,140,255,0.35), rgba(43,113,243,0.18))',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 24px rgba(43,113,243,0.25)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <Shield size={32} className="text-[#8EB6FF]" strokeWidth={2} />
        </div>

        <h2 id="guarantee-modal-title" className="text-xl sm:text-2xl font-bold text-white mb-3 drop-shadow-sm">
          Гарантия <span className="text-[#8EB6FF]">Lootz</span>
        </h2>

        <p className="text-sm sm:text-base text-white/90 leading-relaxed mb-6 max-w-sm">
          Сделка защищена. Продавец не получит оплату, пока вы не подтвердите получение товара
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-[#2B71F3] hover:bg-[#2563eb] text-white font-semibold
                     text-base transition-colors shadow-[0_8px_24px_rgba(43,113,243,0.45)]"
        >
          Понятно, спасибо
        </button>
      </div>
    </GlassModalShell>
  );
}
