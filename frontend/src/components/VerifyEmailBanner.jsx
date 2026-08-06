import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import useAuthStore from '../store/authStore';
import VerifyEmailModal from './VerifyEmailModal';

/**
 * Soft banner for users who registered with email but have not verified yet.
 * No hard blocks — just a prompt.
 */
export default function VerifyEmailBanner() {
  const user = useAuthStore((s) => s.user);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);

  if (!user) return null;
  if (user.is_verified) return null;
  // OAuth accounts are considered verified by provider
  if (user.auth_provider && user.auth_provider !== 'email') return null;
  if (dismissed) return null;

  return (
    <>
      <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-100">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-3 text-sm">
          <Mail size={16} className="shrink-0 text-amber-400" />
          <p className="flex-1 min-w-0">
            Подтвердите email{' '}
            {user.email ? (
              <span className="font-medium text-white">{user.email}</span>
            ) : null}
            , чтобы получать уведомления о сделках.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-lg bg-amber-500/90 hover:bg-amber-400 text-dark-950 font-semibold text-xs px-3 py-1.5 transition-colors"
          >
            Ввести код
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 p-1 rounded-md hover:bg-amber-500/20 text-amber-200/80"
            aria-label="Скрыть"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <VerifyEmailModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
