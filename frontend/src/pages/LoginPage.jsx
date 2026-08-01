import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import SocialLoginButtons from '../components/SocialLoginButtons';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/auth/login', data);
      setAuth(res.data.user, res.data.accessToken);
      toast.success('Добро пожаловать!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка входа');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Вход в Lootz</h1>
          <p className="text-dark-400 text-sm mt-1">Безопасная торговая площадка</p>
        </div>

        <div className="card p-6">
          <SocialLoginButtons dividerLabel="или по email" />

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email или никнейм</label>
              <input
                className="input"
                placeholder="user@example.com"
                {...register('login', { required: 'Обязательное поле' })}
              />
              {errors.login && <p className="text-red-400 text-xs mt-1">{errors.login.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Пароль</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                {...register('password', { required: 'Обязательное поле' })}
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary h-11">
              {isSubmitting ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="border-t border-dark-700 mt-5 pt-5 text-center text-sm text-dark-400">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
              Зарегистрируйтесь
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
