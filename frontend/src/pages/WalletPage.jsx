import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Wallet, Lock, ArrowDownToLine } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import Seo from '../components/Seo';
import { formatPrice, formatRelative } from '../utils/format';

const AMOUNTS = [500, 1000, 2000, 5000];

export default function WalletPage() {
  const { user, setUser } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [method, setMethod] = useState('sbp');
  const [details, setDetails] = useState('');

  const { data: history } = useQuery({
    queryKey: ['wallet-history'],
    queryFn: () => api.get('/users/me/wallet-history').then((r) => r.data),
  });

  const depositMutation = useMutation({
    mutationFn: (amt) => api.post('/users/me/deposit', { amount: amt }),
    onSuccess: (res) => {
      toast.success('Баланс пополнен!');
      setUser({ ...user, balance: res.data.balance, frozen_balance: res.data.frozen_balance });
      setAmount('');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const withdrawMutation = useMutation({
    mutationFn: (payload) => api.post('/users/me/withdraw', payload),
    onSuccess: (res) => {
      toast.success('Заявка на вывод создана');
      setUser({ ...user, balance: res.data.balance, frozen_balance: res.data.frozen_balance });
      setWithdrawAmount('');
      setDetails('');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const handleDeposit = (e) => {
    e.preventDefault();
    const a = parseFloat(amount);
    if (isNaN(a) || a < 100) return toast.error('Минимальная сумма 100₽');
    depositMutation.mutate(a);
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    const a = parseFloat(withdrawAmount);
    if (isNaN(a) || a < 100) return toast.error('Минимальная сумма 100₽');
    if (!details.trim()) return toast.error('Укажите реквизиты');
    withdrawMutation.mutate({ amount: a, method, details: details.trim() });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Seo title="Кошелёк" path="/wallet" noindex />
      <h1 className="text-2xl font-bold mb-6">Кошелёк</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-dark-400 text-sm mb-2">
            <Wallet size={15} /> Доступный баланс
          </div>
          <p className="text-2xl font-bold">{formatPrice(user?.balance || 0)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-dark-400 text-sm mb-2">
            <Lock size={15} /> В эскроу
          </div>
          <p className="text-2xl font-bold text-yellow-400">{formatPrice(user?.frozen_balance || 0)}</p>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold mb-4">Пополнить баланс</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(String(a))}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                amount === String(a)
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'bg-dark-800 border-dark-700 text-dark-300 hover:border-dark-500'
              }`}
            >
              {formatPrice(a)}
            </button>
          ))}
        </div>
        <form onSubmit={handleDeposit} className="flex gap-3">
          <input
            className="input flex-1"
            type="number"
            placeholder="Другая сумма (мин. 100₽)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="100"
            max="100000"
          />
          <button type="submit" disabled={depositMutation.isPending} className="btn-primary px-6">
            {depositMutation.isPending ? '...' : 'Пополнить'}
          </button>
        </form>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <ArrowDownToLine size={18} /> Вывод средств
        </h2>
        <form onSubmit={handleWithdraw} className="flex flex-col gap-3">
          <input
            className="input"
            type="number"
            placeholder="Сумма вывода (мин. 100₽)"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            min="100"
          />
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="sbp">СБП</option>
            <option value="card">Банковская карта</option>
            <option value="crypto">Криптовалюта</option>
          </select>
          <input
            className="input"
            placeholder="Реквизиты (номер карты / телефон / кошелёк)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <button type="submit" disabled={withdrawMutation.isPending} className="btn-secondary">
            {withdrawMutation.isPending ? '...' : 'Вывести средства'}
          </button>
        </form>
        <p className="text-xs text-dark-500 mt-3">
          * В демо-режиме вывод списывает баланс сразу. В продакшне — заявка + ручная/авто обработка.
        </p>
      </div>

      {history?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold mb-4">История операций</h2>
          <div className="flex flex-col gap-3">
            {history.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-sm border-b border-dark-800 pb-2">
                <div>
                  <p className="font-medium">{tx.description || tx.type}</p>
                  <p className="text-xs text-dark-500">{formatRelative(tx.created_at)}</p>
                </div>
                <span className={parseFloat(tx.amount) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {parseFloat(tx.amount) >= 0 ? '+' : ''}{formatPrice(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
