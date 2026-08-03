import { useEffect } from 'react';
import { X } from 'lucide-react';
import { lockBodyScroll, unlockBodyScroll } from '../utils/bodyScrollLock';

/**
 * Soft frosted glass (Guarantee / Status / Promote):
 * page stays sharp outside; light blur through the pane so the listing behind remains visible.
 */
export function GlassModalShell({
  open,
  onClose,
  labelledBy,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;
    lockBodyScroll();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      unlockBodyScroll();
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
      {/* Light dim only — page outside the glass stays sharp */}
      <button
        type="button"
        className="absolute inset-0 bg-black/20"
        aria-label="Закрыть"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md">
        <div
          className="relative overflow-hidden rounded-[22px] px-6 pt-7 pb-6 sm:px-8 sm:pt-8 sm:pb-7"
          style={{
            // Light tint + soft frost — background behind the frame stays recognizable
            background: 'linear-gradient(160deg, rgba(210, 235, 255, 0.18) 0%, rgba(255,255,255,0.08) 50%, rgba(190, 220, 255, 0.12) 100%)',
            backdropFilter: 'blur(10px) saturate(140%)',
            WebkitBackdropFilter: 'blur(10px) saturate(140%)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: [
              '0 24px 80px rgba(0,0,0,0.3)',
              'inset 0 1px 0 rgba(255,255,255,0.55)',
              'inset 0 -1px 0 rgba(255,255,255,0.08)',
            ].join(', '),
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[22px]"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.03) 40%, transparent 75%)',
            }}
          />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full flex items-center justify-center
                       text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>

          <div className="relative z-[1] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
