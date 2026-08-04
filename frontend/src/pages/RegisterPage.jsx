import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle2, Crown, ShoppingBag, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import SocialLoginButtons from '../components/SocialLoginButtons';
import { ACCOUNT_TYPE_OPTIONS, ACCOUNT_TYPES } from '../utils/accountTypes';
import { getDeviceFingerprint } from '../utils/deviceFingerprint';
import {
  clearFoundersInvite,
  isFoundersInviteParam,
  saveFoundersInvite,
} from '../utils/foundersInvite';

const TYPE_ICONS = {
  buyer: ShoppingBag,
  seller: Store,
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const foundersInvite = isFoundersInviteParam(searchParams.get('invite'));
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      account_type: foundersInvite ? ACCOUNT_TYPES.seller : ACCOUNT_TYPES.buyer,
      accept_seller_terms: false,
    },
  });
  const password = watch('password');
  const accountType = watch('account_type');

  useEffect(() => {
    if (foundersInvite) {
      saveFoundersInvite();
      setValue('account_type', ACCOUNT_TYPES.seller, { shouldValidate: true });
    } else {
      clearFoundersInvite();
    }
  }, [foundersInvite, setValue]);

  // Already logged in + invite → go apply for Founders
  useEffect(() => {
    if (user && foundersInvite) {
      saveFoundersInvite();
      navigate('/founders', { replace: true });
    }
  }, [user, foundersInvite, navigate]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
        account_type: data.account_type,
      };
      if (data.account_type === ACCOUNT_TYPES.seller) {
        payload.accept_seller_terms = true;
        payload.device_fingerprint = (await getDeviceFingerprint()) || undefined;
      }
      const res = await api.post('/auth/register', payload);
      setAuth(res.data.user, res.data.accessToken);
      if (foundersInvite || data.account_type === ACCOUNT_TYPES.seller) {
        clearFoundersInvite();
        toast.success(
          foundersInvite
            ? 'Аккаунт продавца создан! Оформите заявку Founders'
            : 'Аккаунт продавца создан!'
        );
        navigate('/founders');
      } else {
        toast.success('Аккаунт покупателя создан!');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка регистрации');
    }
  };

  const typeOptions = foundersInvite
    ? ACCOUNT_TYPE_OPTIONS.filter((o) => o.value === ACCOUNT_TYPES.seller)
    : ACCOUNT_TYPE_OPTIONS;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            {foundersInvite ? 'Регистрация Founding Seller' : 'Регистрация'}
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            {foundersInvite
              ? 'Создайте аккаунт продавца и подайте заявку в программу Founders'
              : 'Выберите тип аккаунта и создайте профиль на Lootz'}
          </p>
        </div>

        {foundersInvite && (
          <div className="card p-4 mb-4 border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <Crown className="text-amber-300 shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-dark-200 leading-relaxed">
                <p className="font-semibold text-amber-100 mb-1">Приглашение в программу Founders</p>
                <p className="text-dark-300">
                  Регистрация как <span className="text-white font-medium">продавец</span>.
                  После создания аккаунта откроется форма заявки на статус Founding Seller
                  (льготная комиссия 5%/13%, вывод за 24 ч).
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Тип аккаунта</label>
              <div className={`grid grid-cols-1 ${foundersInvite ? '' : 'sm:grid-cols-2'} gap-3`}>
                {typeOptions.map((opt) => {
                  const active = accountType === opt.value;
                  const Icon = TYPE_ICONS[opt.value] || ShoppingBag;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (foundersInvite) return;
                        setValue('account_type', opt.value, { shouldValidate: true });
                      }}
                      className={`text-left rounded-2xl border p-3.5 transition-colors ${
                        active
                          ? foundersInvite
                            ? 'border-amber-500/50 bg-amber-500/10'
                            : 'border-[#2B71F3] bg-[#2B71F3]/10'
                          : 'border-dark-700 bg-dark-900/60 hover:border-dark-500'
                      } ${foundersInvite ? 'cursor-default' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon
                          size={18}
                          className={
                            active
                              ? foundersInvite
                                ? 'text-amber-300'
                                : 'text-[#5B8CFF]'
                              : 'text-dark-300'
                          }
                        />
                        <span className="font-semibold text-white">{opt.label}</span>
                        {foundersInvite && (
                          <span className="ml-auto text-[10px] uppercase tracking-wide text-amber-200/90 font-semibold">
                            Founders
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-dark-400 mb-2.5">{opt.description}</p>
                      <ul className="space-y-1">
                        {(foundersInvite
                          ? [
                              'Комиссия 5% / 13% после одобрения заявки',
                              'Вывод через 24 ч после сделки',
                              'Золотая галочка и приоритет в поиске',
                              ...opt.criteria.slice(0, 1),
                            ]
                          : opt.criteria
                        ).map((c) => (
                          <li key={c} className="flex items-start gap-1.5 text-[11px] text-dark-300 leading-snug">
                            <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
              <input type="hidden" {...register('account_type', { required: true })} />
            </div>

            {accountType === ACCOUNT_TYPES.seller && (
              <label className="flex items-start gap-2.5 text-sm text-dark-300 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-dark-600"
                  {...register('accept_seller_terms', {
                    validate: (v) => accountType !== ACCOUNT_TYPES.seller || v === true
                      || 'Нужно принять правила продавца',
                  })}
                />
                <span>
                  Принимаю критерии продавца: выставление лотов, комиссия Lootz
                  {foundersInvite ? ' (льготная 5%/13% после одобрения Founders)' : ' 7.5%/17.5%'}
                  {' '}и правила споров.{' '}
                  <Link to="/rules" className="text-[#5B8CFF] hover:underline">Правила</Link>
                </span>
              </label>
            )}
            {errors.accept_seller_terms && (
              <p className="text-red-400 text-xs -mt-2">{errors.accept_seller_terms.message}</p>
            )}

            <SocialLoginButtons
              className="mb-0"
              dividerLabel="или создать через email"
              passAccountType
              accountType={accountType}
              acceptSellerTerms={Boolean(watch('accept_seller_terms'))}
            />

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
              {isSubmitting
                ? 'Создание...'
                : foundersInvite
                  ? 'Создать аккаунт и перейти к заявке'
                  : accountType === ACCOUNT_TYPES.seller
                    ? 'Создать аккаунт продавца'
                    : 'Создать аккаунт покупателя'}
            </button>
          </form>

          <div className="border-t border-dark-700 mt-5 pt-5 text-center text-sm text-dark-400">
            Уже есть аккаунт?{' '}
            <Link
              to={foundersInvite ? '/login?next=/founders' : '/login'}
              className="text-brand-400 hover:text-brand-300 font-medium"
            >
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
