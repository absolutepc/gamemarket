import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import Seo from '../components/Seo';
import { ACCOUNT_TYPE_OPTIONS, ACCOUNT_TYPES, isSellerAccount } from '../utils/accountTypes';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';

const sellerOption = ACCOUNT_TYPE_OPTIONS.find((o) => o.value === ACCOUNT_TYPES.seller);

export default function BecomeSellerPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isSellerAccount(user)) {
    return (
      <div className={`${PAGE_WIDTH_CLASS} py-16 text-center`}>
        <Seo title="Стать продавцом" path="/become-seller" noindex />
        <Store className="mx-auto text-[#5B8CFF] mb-3" size={36} />
        <h1 className="text-2xl font-bold mb-2">Вы уже продавец</h1>
        <p className="text-dark-400 mb-6">Можно сразу выставлять лоты</p>
        <Link to="/listings/create" className="btn-primary inline-flex">Выставить лот</Link>
      </div>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!accepted) {
      toast.error('Примите критерии и правила продавца');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/users/me/become-seller', { accept_seller_terms: true });
      if (data?.user) setUser(data.user);
      toast.success('Аккаунт продавца активирован');
      navigate('/listings/create');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Не удалось стать продавцом');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${PAGE_WIDTH_CLASS} py-10 max-w-2xl`}>
      <Seo title="Стать продавцом" path="/become-seller" noindex />
      <div className="flex items-center gap-3 mb-6">
        <Store className="text-[#5B8CFF]" size={28} />
        <div>
          <h1 className="text-2xl font-bold">Стать продавцом</h1>
          <p className="text-dark-400 text-sm">Переход по критериям продавца Lootz</p>
        </div>
      </div>

      <div className="card p-6 mb-5">
        <h2 className="font-semibold mb-3">{sellerOption?.label}</h2>
        <p className="text-sm text-dark-400 mb-4">{sellerOption?.description}</p>
        <ul className="space-y-2">
          {(sellerOption?.criteria || []).map((c) => (
            <li key={c} className="flex items-start gap-2 text-sm text-dark-200">
              <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={onSubmit} className="card p-6 flex flex-col gap-4">
        <label className="flex items-start gap-2.5 text-sm text-dark-300 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 rounded border-dark-600"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>
            Подтверждаю критерии продавца и принимаю{' '}
            <Link to="/rules" className="text-[#5B8CFF] hover:underline">правила продажи</Link>
            {' '}и комиссию площадки.
          </span>
        </label>
        <button type="submit" disabled={loading || !accepted} className="btn-primary h-11">
          {loading ? 'Активация...' : 'Стать продавцом'}
        </button>
      </form>
    </div>
  );
}
