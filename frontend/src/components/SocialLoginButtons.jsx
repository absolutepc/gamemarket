import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { startVkLogin } from '../utils/vkAuth';
import { startAppleLogin } from '../utils/appleAuth';
import { startGoogleLogin } from '../utils/googleAuth';
import { ACCOUNT_TYPES } from '../utils/accountTypes';
import {
  clearOAuthAccountChoice,
  oauthAccountTypePayload,
  pathAfterOAuth,
  saveOAuthAccountChoice,
} from '../utils/oauthAccount';

function VkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.714-1.033-1.01-1.49-1.147-1.744-1.147-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.12-5.339-3.202-2.17-3.088-2.763-5.406-2.763-5.88 0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.474-.085.72-.576.72z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.42 2.21-1.18 3.05-.9.99-2.4 1.75-3.66 1.65-.15-1.1.4-2.25 1.15-3.05.9-.98 2.45-1.7 3.69-1.65zM20.7 17.4c-.55 1.27-.81 1.83-1.52 2.95-1 1.55-2.4 3.48-4.15 3.5-1.55.02-1.95-1.01-4.06-1-2.1.01-2.55 1.02-4.1 1.04-1.75.03-3.09-1.75-4.1-3.3C.9 17.6-.55 12.3 1.55 8.85c1.3-2.15 3.35-3.4 5.25-3.4 1.95 0 3.18 1.05 4.8 1.05 1.55 0 2.5-1.06 4.8-1.06 1.7 0 3.5 1.05 4.8 2.85-4.2 2.3-3.5 8.3-.5 9.11z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.9 2.2 2.7 6.4 2.7 11.5S6.9 20.8 12 20.8c5.4 0 9-3.8 9-9.1 0-.6-.1-1.1-.2-1.5H12z" />
      <path fill="#34A853" d="M3.9 7.3l3.2 2.3C8 7.4 9.9 6.1 12 6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 8.3 2.2 5.1 4.3 3.9 7.3z" />
      <path fill="#FBBC05" d="M12 20.8c2.5 0 4.7-.8 6.2-2.3l-3-2.5c-.8.6-1.9 1-3.2 1-2.5 0-4.6-1.7-5.4-3.9l-3.2 2.5c1.3 2.7 4.1 5.2 8.6 5.2z" />
      <path fill="#4285F4" d="M21 11.5c0-.6-.1-1.1-.2-1.5H12v3.9h5.5c-.3 1.4-1.1 2.4-2.2 3.1l3 2.5c1.8-1.6 2.7-4 2.7-8z" />
    </svg>
  );
}

/**
 * @param {object} props
 * @param {string} [props.accountType] — from register form (buyer|seller)
 * @param {boolean} [props.acceptSellerTerms]
 * @param {boolean} [props.passAccountType] — save choice before OAuth (register page)
 */
export default function SocialLoginButtons({
  className = '',
  dividerLabel = 'или по email',
  accountType,
  acceptSellerTerms = false,
  passAccountType = false,
}) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [providers, setProviders] = useState(null);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    api.get('/auth/providers')
      .then((r) => setProviders(r.data))
      .catch(() => setProviders({
        vk: { enabled: false },
        apple: { enabled: false },
        google: { enabled: false },
      }));
  }, []);

  const vkEnabled = Boolean(providers?.vk?.enabled);
  const appleEnabled = Boolean(providers?.apple?.enabled);
  const googleEnabled = Boolean(providers?.google?.enabled);
  const anyEnabled = vkEnabled || appleEnabled || googleEnabled;

  if (providers === null) {
    return (
      <div className={`space-y-3 mb-4 ${className}`}>
        <div className="h-11 rounded-xl bg-dark-800 animate-pulse" />
      </div>
    );
  }

  if (!anyEnabled) return null;

  const prepareChoice = () => {
    if (!passAccountType) {
      clearOAuthAccountChoice();
      return true;
    }
    if (accountType === ACCOUNT_TYPES.seller && !acceptSellerTerms) {
      toast.error('Примите правила продавца перед входом через соцсеть');
      return false;
    }
    saveOAuthAccountChoice({
      accountType: accountType || ACCOUNT_TYPES.buyer,
      acceptSellerTerms,
    });
    return true;
  };

  const finishSocial = (data, successMsg) => {
    clearOAuthAccountChoice();
    setAuth(data.user, data.accessToken);
    toast.success(successMsg);
    navigate(pathAfterOAuth(data), { replace: true });
  };

  const onVk = async () => {
    if (!prepareChoice()) return;
    setBusy('vk');
    try {
      await startVkLogin(providers.vk);
    } catch (err) {
      toast.error(err.message || 'VK ID недоступен');
      setBusy(null);
    }
  };

  const onGoogle = async () => {
    if (!prepareChoice()) return;
    setBusy('google');
    try {
      await startGoogleLogin(providers.google);
    } catch (err) {
      toast.error(err.message || 'Google недоступен');
      setBusy(null);
    }
  };

  const onApple = async () => {
    if (!prepareChoice()) return;
    setBusy('apple');
    try {
      const result = await startAppleLogin(providers.apple);
      const { data } = await api.post('/auth/apple', {
        identityToken: result.identityToken,
        user: result.user || undefined,
        ...oauthAccountTypePayload(),
      });
      finishSocial(data, 'Вход через Apple выполнен');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Apple ID недоступен';
      if (!/popup|cancel|закрыт|closed/i.test(String(msg))) {
        toast.error(msg);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex flex-col gap-2.5">
        {googleEnabled && (
          <button
            type="button"
            onClick={onGoogle}
            disabled={Boolean(busy)}
            className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2
                       bg-white hover:bg-gray-100 text-black transition-colors disabled:opacity-50
                       ring-1 ring-dark-700"
          >
            <GoogleIcon />
            {busy === 'google' ? 'Переход...' : 'Войти через Google'}
          </button>
        )}
        {vkEnabled && (
          <button
            type="button"
            onClick={onVk}
            disabled={Boolean(busy)}
            className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2
                       bg-[#0077FF] hover:bg-[#0066DD] text-white transition-colors disabled:opacity-50"
          >
            <VkIcon />
            {busy === 'vk' ? 'Переход...' : 'Войти через VK ID'}
          </button>
        )}
        {appleEnabled && (
          <button
            type="button"
            onClick={onApple}
            disabled={Boolean(busy)}
            className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2
                       bg-white hover:bg-gray-100 text-black transition-colors disabled:opacity-50"
          >
            <AppleIcon />
            {busy === 'apple' ? 'Вход...' : 'Войти через Apple'}
          </button>
        )}
      </div>
      <div className="relative mt-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dark-700" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-dark-900 text-dark-500">{dividerLabel}</span>
        </div>
      </div>
    </div>
  );
}
