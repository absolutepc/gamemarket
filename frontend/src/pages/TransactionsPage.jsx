import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ShoppingBag, Package } from 'lucide-react';
import api from '../utils/api';
import { formatPrice, formatRelative, TX_STATUS } from '../utils/format';

const PLACEHOLDER = '/placeholder-listing.svg';

export default function TransactionsPage() {
  const [role, setRole] = useState('buyer');

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', role],
    queryFn: () => api.get(`/transactions/my?role=${role}`).then((r) => r.data),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Мои сделки</h1>

      <div className="flex gap-2 mb-6">
        {[
          { key: 'buyer', label: 'Покупки', icon: ShoppingBag },
          { key: 'seller', label: 'Продажи', icon: Package },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setRole(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              role === key ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
      ) : data?.length === 0 ? (
        <div className="card p-12 text-center text-dark-400">
          <p className="font-medium">Сделок нет</p>
          <p className="text-sm mt-1">
            {role === 'buyer' ? 'Начните покупать в ' : 'Разместите лот в '}
            <Link to="/catalog" className="text-brand-400 hover:underline">каталоге</Link>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data?.map((tx) => {
            const status = TX_STATUS[tx.status] || { label: tx.status, color: 'badge-gray' };
            return (
              <Link
                key={tx.id}
                to={`/transactions/${tx.id}`}
                className="card p-4 flex items-center gap-4 hover:border-dark-600 transition-all"
              >
                <img
                  src={tx.listing_images?.[0] || PLACEHOLDER}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                  onError={(e) => { e.target.src = PLACEHOLDER; }}
                  alt=""
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{tx.listing_title}</p>
                  <p className="text-dark-400 text-sm mt-0.5">
                    {role === 'buyer' ? `Продавец: ${tx.seller_username}` : `Покупатель: ${tx.buyer_username}`}
                  </p>
                  <p className="text-xs text-dark-500 mt-0.5">{formatRelative(tx.created_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-lg font-bold">{formatPrice(tx.amount)}</span>
                  <span className={status.color}>{status.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
