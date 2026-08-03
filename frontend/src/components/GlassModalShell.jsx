import { useEffect } from 'react';
import { X } from 'lucide-react';

/** Frosted / mirror-glass shell shared by Guarantee + Status modals */
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
      {/* Dim overlay — keep page readable so glass can show through */}
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        aria-label="Закрыть"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md">
        {/* Mirror reflection under the card */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-8 right-8 top-full mt-1 h-16 rounded-[1.25rem]
                     opacity-50"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 75%)',
            transform: 'scaleY(-1)',
            filter: 'blur(6px)',
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.55), transparent)',
            WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.55), transparent)',
          }}
        />

        <div
          className="relative overflow-hidden rounded-2xl px-6 pt-7 pb-6 sm:px-8 sm:pt-8 sm:pb-7
                     border border-white/25
                     shadow-[0_24px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.28)]"
          style={{
            background: 'linear-gradient(165deg, rgba(255,255,255,0.16) 0%, rgba(24,24,32,0.55) 42%, rgba(18,18,26,0.72) 100%)',
            backdropFilter: 'blur(28px) saturate(160%)',
            WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          }}
        >
          {/* Specular top shine */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-28"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 45%, transparent 100%)',
            }}
          />
          {/* Diagonal mirror streak */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 left-[-20%] h-44 w-[140%] rotate-[-12deg]"
            style={{
              background: 'linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.18) 50%, transparent 80%)',
            }}
          />
          {/* Soft edge glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20"
          />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full flex items-center justify-center
                       text-white/70 hover:text-white hover:bg-white/15 transition-colors"
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
