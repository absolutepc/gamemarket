import { useEffect } from 'react';
import { X } from 'lucide-react';

/** Frosted / mirror-glass shell shared by listing info modals */
export function GlassModalShell({
  open,
  onClose,
  labelledBy,
  children,
}) {
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
      aria-labelledby={labelledBy}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
        aria-label="Закрыть"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md">
        {/* Mirror reflection under the card */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-6 right-6 -bottom-10 h-14 rounded-2xl
                     bg-gradient-to-b from-white/12 to-transparent opacity-40 blur-[1px]
                     [transform:scaleY(-0.55)] origin-top"
        />

        <div
          className="relative overflow-hidden rounded-2xl
                     bg-dark-900/65 backdrop-blur-2xl
                     border border-white/15
                     shadow-[0_24px_64px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]
                     px-6 pt-7 pb-6 sm:px-8 sm:pt-8 sm:pb-7"
        >
          {/* Specular highlight */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-24
                       bg-gradient-to-b from-white/18 via-white/5 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 left-1/2 h-40 w-[140%] -translate-x-1/2
                       rotate-[-8deg] bg-gradient-to-r from-transparent via-white/10 to-transparent"
          />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full flex items-center justify-center
                       text-dark-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>

          <div className="relative z-[1]">{children}</div>
        </div>
      </div>
    </div>
  );
}
