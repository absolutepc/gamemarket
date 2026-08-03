import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Glassmorphism shell (Guarantee / Status / Promote):
 * sharp page behind the overlay, heavy blur only through the frosted pane —
 * like classic glass panels over a busy background.
 */
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
      {/* Dim only — no blur, so the page outside the glass stays sharp */}
      <button
        type="button"
        className="absolute inset-0 bg-black/25"
        aria-label="Закрыть"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md">
        <div
          className="relative overflow-hidden rounded-[22px] px-6 pt-7 pb-6 sm:px-8 sm:pt-8 sm:pb-7"
          style={{
            // Light frosted tint so listing/page colors show through (ref-style glass)
            background: 'linear-gradient(160deg, rgba(200, 230, 255, 0.22) 0%, rgba(255,255,255,0.12) 45%, rgba(180, 210, 255, 0.16) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.45)',
            boxShadow: [
              '0 24px 80px rgba(0,0,0,0.35)',
              'inset 0 1px 0 rgba(255,255,255,0.55)',
              'inset 0 -1px 0 rgba(255,255,255,0.08)',
            ].join(', '),
          }}
        >
          {/* Soft inner sheen — glass edge, not a heavy dark fill */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[22px]"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.04) 35%, transparent 70%)',
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
