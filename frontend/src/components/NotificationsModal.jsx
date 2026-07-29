import { useEffect, useState } from 'react';
import { ArrowLeft, X, Bell, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const STORAGE_KEY = 'gm_notification_prefs';

function loadPrefs() {
  try {
    return {
      telegram: false,
      email: true,
      push: false,
      vk: false,
      ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'),
    };
  } catch {
    return { telegram: false, email: true, push: false, vk: false };
  }
}

function Toggle({ on, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-40 ${
        on ? 'bg-brand-500' : 'bg-dark-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function ChannelIcon({ children, className = 'bg-[#2AABEE]' }) {
  return (
    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 ${className}`}>
      {children}
    </div>
  );
}

export default function NotificationsModal({ open, onBack, onClose }) {
  const user = useAuthStore((s) => s.user);
  const [prefs, setPrefs] = useState(loadPrefs);

  useEffect(() => {
    if (!open) return;
    setPrefs(loadPrefs());
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const setPref = (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    toast.success(value ? 'Уведомления включены' : 'Уведомления выключены');
  };

  const hasEmail = user?.auth_provider !== 'vk' || (user?.email && !String(user.email).endsWith('@vk.users.local'));

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Закрыть" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-dark-900 border border-dark-800 shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-center relative px-4 py-4 border-b border-dark-800">
          <button
            type="button"
            onClick={onBack}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white"
            aria-label="Назад"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="font-semibold text-lg">Уведомления</h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 rounded-xl bg-dark-800/80 border border-dark-700 px-4 py-3 mb-4">
            <Bell size={18} className="text-yellow-400 shrink-0" />
            <p className="text-sm text-dark-200">Будем уведомлять о новых сообщениях</p>
          </div>

          <div className="flex flex-col gap-1">
            {/* Telegram */}
            <div className="flex items-start gap-3 py-3 px-1">
              <ChannelIcon>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </ChannelIcon>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-medium text-sm text-white">Telegram</p>
                <p className="text-xs text-dark-400 mt-0.5 leading-relaxed">
                  Уведомления присылает телеграм-бот GameMarket
                </p>
              </div>
              <Toggle on={prefs.telegram} onChange={(v) => setPref('telegram', v)} />
            </div>

            {/* Email */}
            <div className="flex items-start gap-3 py-3 px-1">
              <ChannelIcon className="bg-brand-500 relative">
                <Mail size={18} />
                {!hasEmail && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-dark-900" />
                )}
              </ChannelIcon>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-medium text-sm text-white">Уведомления по почте</p>
                {!hasEmail ? (
                  <p className="text-xs text-red-400 mt-0.5 font-medium">Не выполнен вход через почту</p>
                ) : null}
                <p className="text-xs text-dark-400 mt-0.5 leading-relaxed">Приходят на почту</p>
              </div>
              {hasEmail ? (
                <Toggle
                  on={!!prefs.email}
                  onChange={(v) => setPref('email', v)}
                />
              ) : null}
            </div>

            {/* Push */}
            <div className="flex items-start gap-3 py-3 px-1">
              <ChannelIcon className="bg-brand-500">
                <Bell size={18} />
              </ChannelIcon>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-medium text-sm text-white">Push-уведомления</p>
                <p className="text-xs text-dark-400 mt-0.5 leading-relaxed">
                  Работают в Chrome, Firefox, Opera и Яндекс.Браузер на компьютерах и Android-устройствах.
                  Войдите на телефоне, чтобы получать уведомления.
                </p>
              </div>
              <Toggle on={prefs.push} onChange={(v) => setPref('push', v)} />
            </div>

            {/* VK */}
            <div className="flex items-start gap-3 py-3 px-1">
              <ChannelIcon className="bg-[#0077FF]">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
                  <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.714-1.033-1.01-1.49-1.147-1.744-1.147-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.12-5.339-3.202-2.17-3.088-2.763-5.406-2.763-5.88 0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.474-.085.72-.576.72z" />
                </svg>
              </ChannelIcon>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-medium text-sm text-white">Вконтакте</p>
                <p className="text-xs text-dark-400 mt-0.5 leading-relaxed">
                  Приходят в личные сообщения от сообщества GameMarket
                </p>
              </div>
              <Toggle on={prefs.vk} onChange={(v) => setPref('vk', v)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
