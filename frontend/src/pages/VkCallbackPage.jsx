import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { parseVkCallbackPayload } from '../utils/vkAuth';

export default function VkCallbackPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const payload = parseVkCallbackPayload(window.location.search, window.location.hash);
        const savedRaw = sessionStorage.getItem('vk_oauth');
        if (!payload?.code || !savedRaw) {
          throw new Error('Нет данных авторизации VK');
        }
        const saved = JSON.parse(savedRaw);
        if (payload.state && saved.state && payload.state !== saved.state) {
          throw new Error('Неверный state — попробуйте войти снова');
        }

        const { data } = await api.post('/auth/vk', {
          code: payload.code,
          code_verifier: saved.codeVerifier,
          device_id: payload.device_id || payload.deviceId,
          redirect_uri: saved.redirectUri,
          state: payload.state || saved.state,
        });

        sessionStorage.removeItem('vk_oauth');
        if (cancelled) return;
        setAuth(data.user, data.accessToken);
        toast.success('Вход через VK ID выполнен');
        navigate('/', { replace: true });
      } catch (err) {
        if (cancelled) return;
        const msg = err.response?.data?.error || err.message || 'Ошибка входа через VK';
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
            <p className="text-dark-300">Вход через VK ID...</p>
          </>
        )}
      </div>
    </div>
  );
}
