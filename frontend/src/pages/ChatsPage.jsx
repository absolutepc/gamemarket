import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import api from '../utils/api';
import Seo from '../components/Seo';
import { formatRelative } from '../utils/format';

export default function ChatsPage() {
  const navigate = useNavigate();
  const { data: chats, isLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: () => api.get('/chats').then((r) => r.data),
    refetchInterval: 15000,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Seo title="Чаты" path="/chats" noindex />
      <h1 className="text-2xl font-bold mb-6">Чаты</h1>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-20 animate-pulse" />
          ))}
        </div>
      ) : chats?.length === 0 ? (
        <div className="card p-12 text-center text-dark-400">
          <MessageCircle size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Пока нет чатов</p>
          <p className="text-sm mt-1">Напишите продавцу со страницы лота или профиля</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {chats.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate(`/chats/${c.id}`)}
              className="card p-4 flex items-center gap-3 text-left hover:border-dark-600 transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-semibold shrink-0">
                {c.partner_username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">{c.partner_username}</p>
                  <span className="text-xs text-dark-500 shrink-0">
                    {c.last_message_at ? formatRelative(c.last_message_at) : ''}
                  </span>
                </div>
                <p className="text-sm text-dark-400 truncate mt-0.5">
                  {c.listing_title ? `${c.listing_title} · ` : ''}
                  {c.last_message || 'Нет сообщений'}
                </p>
              </div>
              {c.unread_count > 0 && (
                <span className="badge bg-brand-500 text-white text-xs shrink-0">{c.unread_count}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
