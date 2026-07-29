import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { formatPrice, formatRelative } from '../utils/format';

const AMOUNTS = [500, 1000, 2000, 5000];

const TX_ICONS = {
  deposit: { icon: ArrowUpCircle, color: 'text-emerald-400' },
  refund: { icon: ArrowUpCircle, color: 'text-blue-400' },
  sale_credit: { icon: ArrowUpCircle, color: 'text-emerald-400' },
  escrow_hold: { icon: ArrowDownCircle, color: 'text-red-400' },
  withdrawal: { icon: ArrowDownCircle, color: 'text-red-400' },
};

export default function WalletPage() {
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');

  const depositMutation = useMutation({
    mutationFn: (amt) => api.post('/users/me/deposit', { amount: amt }),
    onSuccess: (res) => {
      toast.success('Баланс пополнен!');
      setUser({ ...user, balance: res.data.balance });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const handleDeposit = (e) => {
    e.preventDefault();
    const a = parseFloat(amount);
    if (isNaN(a) || a < 100) return toast.error('Минимальная сумма 100₽');
    depositMutation.mutate(a);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Кошелёк</h1>

      {/* Balance cards */}
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

      {/* Deposit form */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold mb-4">Пополнить баланс</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {AMOUNTS.map((a) => (
            <button
              key={a}
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
        <p className="text-xs text-dark-500 mt-3">
          * В демо-режиме пополнение моментальное. В продакшн интегрируется платёжный шлюз (ЮКасса, Stripe и др.)
        </p>
      </div>
    </div>
  );
}
