import { useEffect } from 'react';
import { Shield, X } from 'lucide-react';

export default function GuaranteeModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guarantee-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label="Закрыть"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-dark-900 border border-dark-800
                      shadow-[0_24px_64px_rgba(0,0,0,0.55)] px-6 pt-7 pb-6 sm:px-8 sm:pt-8 sm:pb-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center
                     text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
          aria-label="Закрыть"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2B71F3]/15 border border-[#2B71F3]/30
                          flex items-center justify-center mb-4">
            <Shield size={32} className="text-[#5B8CFF]" strokeWidth={2} />
          </div>

          <h2 id="guarantee-modal-title" className="text-xl sm:text-2xl font-bold text-white mb-3">
            Гарантия <span className="text-[#5B8CFF]">Lootz</span>
          </h2>

          <p className="text-sm sm:text-base text-dark-300 leading-relaxed mb-6 max-w-sm">
            Сделка защищена. Продавец не получит оплату, пока вы не подтвердите получение товара
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-[#2B71F3] hover:bg-[#2563eb] text-white font-semibold
                       text-base transition-colors"
          >
            Понятно, спасибо
          </button>
        </div>
      </div>
    </div>
  );
}
