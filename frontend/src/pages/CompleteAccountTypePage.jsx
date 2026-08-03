import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import Seo from '../components/Seo';
import { ACCOUNT_TYPE_OPTIONS, ACCOUNT_TYPES } from '../utils/accountTypes';

const TYPE_ICONS = {
  buyer: ShoppingBag,
  seller: Store,
};

export default function CompleteAccountTypePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [accountType, setAccountType] = useState(ACCOUNT_TYPES.buyer);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  const needsChoice = user.needs_account_type === true || user.account_type_chosen === false;
  if (!needsChoice) {
    return <Navigate to={user.account_type === ACCOUNT_TYPES.seller ? '/listings/create' : '/'} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (accountType === ACCOUNT_TYPES.seller && !accepted) {
      toast.error('Примите критерии и правила продавца');
      return;
    }
    setLoading(true);
    try {
      const payload = { account_type: accountType };
      if (accountType === ACCOUNT_TYPES.seller) {
        payload.accept_seller_terms = true;
      }
      const { data } = await api.post('/users/me/account-type', payload);
      if (data?.user) setUser(data.user);
      toast.success(
        accountType === ACCOUNT_TYPES.seller
          ? 'Аккаунт продавца активирован'
          : 'Аккаунт покупателя готов'
      );
      navigate(accountType === ACCOUNT_TYPES.seller ? '/listings/create' : '/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Не удалось сохранить тип аккаунта');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Seo title="Тип аккаунта" path="/complete-account-type" noindex />
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Выберите тип аккаунта</h1>
          <p className="text-dark-400 text-sm mt-1">
            {user.username ? `${user.username}, ` : ''}как вы будете пользоваться Lootz?
          </p>
        </div>

        <form onSubmit={onSubmit} className="card p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACCOUNT_TYPE_OPTIONS.map((opt) => {
              const active = accountType === opt.value;
              const Icon = TYPE_ICONS[opt.value] || ShoppingBag;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAccountType(opt.value)}
                  className={`text-left rounded-2xl border p-3.5 transition-colors ${
                    active
                      ? 'border-[#2B71F3] bg-[#2B71F3]/10'
                      : 'border-dark-700 bg-dark-900/60 hover:border-dark-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon size={18} className={active ? 'text-[#5B8CFF]' : 'text-dark-300'} />
                    <span className="font-semibold text-white">{opt.label}</span>
                  </div>
                  <p className="text-xs text-dark-400 mb-2.5">{opt.description}</p>
                  <ul className="space-y-1">
                    {opt.criteria.map((c) => (
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

          {accountType === ACCOUNT_TYPES.seller && (
            <label className="flex items-start gap-2.5 text-sm text-dark-300 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 rounded border-dark-600"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span>
                Принимаю критерии продавца и{' '}
                <Link to="/rules" className="text-[#5B8CFF] hover:underline">правила продажи</Link>
                {' '}Lootz.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading || (accountType === ACCOUNT_TYPES.seller && !accepted)}
            className="btn-primary h-11"
          >
            {loading
              ? 'Сохранение...'
              : accountType === ACCOUNT_TYPES.seller
                ? 'Продолжить как продавец'
                : 'Продолжить как покупатель'}
          </button>
        </form>
      </div>
    </div>
  );
}
