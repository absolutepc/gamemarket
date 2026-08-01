import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import SocialLoginButtons from '../components/SocialLoginButtons';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/auth/register', {
        username: data.username,
        email: data.email,
        password: data.password,
      });
      setAuth(res.data.user, res.data.accessToken);
      toast.success('Аккаунт создан!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Регистрация</h1>
          <p className="text-dark-400 text-sm mt-1">Создайте аккаунт на Lootz</p>
        </div>

        <div className="card p-6">
          <SocialLoginButtons dividerLabel="или создать аккаунт" />
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Никнейм</label>
              <input
                className="input"
                placeholder="cooltrader123"
                {...register('username', {
                  required: 'Обязательное поле',
                  minLength: { value: 3, message: 'Минимум 3 символа' },
                  maxLength: { value: 50, message: 'Максимум 50 символов' },
                  pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Только латиница, цифры и _' },
                })}
              />
              {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <input
                className="input"
                type="email"
                placeholder="user@example.com"
                {...register('email', { required: 'Обязательное поле', pattern: { value: /\S+@\S+\.\S+/, message: 'Некорректный email' } })}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Пароль</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                {...register('password', {
                  required: 'Обязательное поле',
                  minLength: { value: 8, message: 'Минимум 8 символов' },
                  pattern: { value: /(?=.*[A-Za-z])(?=.*\d)/, message: 'Должен содержать буквы и цифры' },
                })}
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Подтвердите пароль</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword', {
                  required: 'Обязательное поле',
                  validate: (v) => v === password || 'Пароли не совпадают',
                })}
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5 text-xs text-dark-400 mt-1">
              {['Минимум 8 символов', 'Буквы и цифры', 'Только латинские буквы для никнейма'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-400" /> {t}
                </span>
              ))}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary h-11">
              {isSubmitting ? 'Создание...' : 'Создать аккаунт'}
            </button>
          </form>

          <div className="border-t border-dark-700 mt-5 pt-5 text-center text-sm text-dark-400">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Войти</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
