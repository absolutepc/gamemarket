import { useState } from 'react';
import toast from 'react-hot-toast';
import Seo from '../components/Seo';

export default function SupportPage() {
  const [form, setForm] = useState({ email: '', topic: 'deal', message: '' });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.email.trim() || form.message.trim().length < 20) {
      toast.error('Укажите email и сообщение от 20 символов');
      return;
    }
    toast.success('Запрос принят. Мы ответим на email.');
    setForm({ email: '', topic: 'deal', message: '' });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Seo
        title="Поддержка"
        description="Служба поддержки GameMarket: помощь по сделкам, спорам, аккаунту и безопасности."
        path="/support"
      />
      <h1 className="text-3xl font-bold mb-2">Поддержка</h1>
      <p className="text-dark-400 mb-8">
        Поможем со сделками, спорами и вопросами по аккаунту
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="card p-5">
          <h2 className="font-semibold mb-2">По сделке</h2>
          <p className="text-sm text-dark-300">
            Откройте спор в карточке сделки и приложите доказательства: скриншоты, переписку, данные передачи.
          </p>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold mb-2">Время ответа</h2>
          <p className="text-sm text-dark-300">
            Обычно отвечаем в течение 24 часов. По активным спорам приоритет выше.
          </p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-lg mb-4">Написать в поддержку</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Тема</label>
            <select
              className="input"
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
            >
              <option value="deal">Проблема со сделкой</option>
              <option value="account">Аккаунт и вход</option>
              <option value="payment">Баланс и платежи</option>
              <option value="other">Другое</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Сообщение</label>
            <textarea
              className="input min-h-[140px] resize-none"
              placeholder="Опишите ситуацию подробнее..."
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn-primary h-11 w-full sm:w-auto">
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
}
