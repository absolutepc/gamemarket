import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import {
  clearOAuthAccountChoice,
  oauthAccountTypePayload,
  pathAfterOAuth,
} from '../utils/oauthAccount';

/**
 * Fallback redirect landing for Sign in with Apple (when popup is blocked).
 * Apple form_post may land here with query/hash params in some configs;
 * primary flow uses popup and posts identityToken directly.
 */
export default function AppleCallbackPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const identityToken =
          params.get('id_token') ||
          hashParams.get('id_token') ||
          sessionStorage.getItem('apple_id_token');
        if (!identityToken) {
          throw new Error('Нет данных авторизации Apple');
        }

        let user;
        const userRaw = sessionStorage.getItem('apple_user');
        if (userRaw) {
          try { user = JSON.parse(userRaw); } catch { user = undefined; }
        }

        const { data } = await api.post('/auth/apple', {
          identityToken,
          user,
          ...(await oauthAccountTypePayload()),
        });

        sessionStorage.removeItem('apple_id_token');
        sessionStorage.removeItem('apple_user');
        clearOAuthAccountChoice();
        if (cancelled) return;
        setAuth(data.user, data.accessToken);
        toast.success('Вход через Apple выполнен');
        navigate(pathAfterOAuth(data), { replace: true });
      } catch (err) {
        if (cancelled) return;
        const msg = err.response?.data?.error || err.message || 'Ошибка входа через Apple';
        setError(msg);
        toast.error(msg);
      }
    })();

    return () => { cancelled = true; };
  }, [navigate, setAuth]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="card p-8 text-center max-w-md w-full">
        {error ? (
          <>
            <h1 className="text-xl font-bold mb-2">Не удалось войти</h1>
            <p className="text-dark-400 text-sm mb-4">{error}</p>
            <button type="button" className="btn-primary" onClick={() => navigate('/login')}>
              Вернуться ко входу
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-dark-300">Вход через Apple...</p>
          </>
        )}
      </div>
    </div>
  );
}
