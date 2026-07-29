import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import Seo from '../components/Seo';
import { formatRelative } from '../utils/format';

export default function ChatPage() {
  const { id } = useParams();
  const { user, accessToken } = useAuthStore();
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const msgEndRef = useRef(null);
  const socketRef = useRef(null);

  const { data: chat, isLoading } = useQuery({
    queryKey: ['chat', id],
    queryFn: () => api.get(`/chats/${id}`).then((r) => r.data),
  });

  useEffect(() => {
    if (chat?.messages) setMessages(chat.messages);
  }, [chat?.messages]);

  useEffect(() => {
    if (!accessToken) return;
    const socket = io('/', { auth: { token: accessToken } });
    socketRef.current = socket;
    socket.emit('join_conversation', id);
    socket.on('new_chat_message', (m) => {
      setMessages((prev) => {
        if (prev.find((p) => p.id === m.id)) return prev;
        return [...prev, m];
      });
    });
    return () => socket.disconnect();
  }, [id, accessToken]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!msg.trim() || !socketRef.current) return;
    socketRef.current.emit('send_chat_message', {
      conversation_id: id,
      content: msg.trim(),
    });
    setMsg('');
  };

  if (isLoading) return <div className="max-w-2xl mx-auto px-4 py-8"><div className="card h-96 animate-pulse" /></div>;
  if (!chat) return <div className="text-center py-20 text-dark-400">Чат не найден</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Seo title={`Чат с ${chat.partner_username}`} path={`/chats/${id}`} noindex />
      <div className="card flex flex-col" style={{ height: '70vh' }}>
        <div className="p-4 border-b border-dark-800 flex items-center gap-3">
          <Link to="/chats" className="btn-ghost p-1.5"><ArrowLeft size={18} /></Link>
          <div className="w-9 h-9 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-semibold">
            {chat.partner_username?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{chat.partner_username}</p>
            {chat.listing_title && (
              <p className="text-xs text-dark-400 truncate">{chat.listing_title}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.map((m) => {
            const isMe = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  isMe ? 'bg-brand-500 text-white rounded-tr-sm' : 'bg-dark-800 text-dark-100 rounded-tl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={msgEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-3 border-t border-dark-800 flex gap-2">
          <input
            className="input flex-1 text-sm"
            placeholder="Написать сообщение..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            maxLength={2000}
          />
          <button type="submit" disabled={!msg.trim()} className="btn-primary p-2.5">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
