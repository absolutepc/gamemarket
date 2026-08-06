import { useEffect, useRef, useState } from 'react';
import { X, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { lockBodyScroll, unlockBodyScroll } from '../utils/bodyScrollLock';

export default function VerifyEmailModal({ open, onClose }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!open) return;
    setDigits(['', '', '', '', '', '']);
    lockBodyScroll();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => inputsRef.current[0]?.focus(), 50);
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockBodyScroll();
      clearTimeout(t);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  if (!open) return null;

  const code = digits.join('');

  const onDigit = (idx, raw) => {
    const v = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const onKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const onPaste = (e) => {
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (text.length < 2) return;
    e.preventDefault();
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < text.length; i += 1) next[i] = text[i];
    setDigits(next);
    inputsRef.current[Math.min(text.length, 5)]?.focus();
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (code.length !== 6 || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/verify-email', { code });
      if (data.user) setUser(data.user);
      toast.success('Email подтверждён');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Неверный код');
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (resending || cooldown > 0) return;
    setResending(true);
    try {
      await api.post('/auth/resend-verification');
      toast.success('Код отправлен на почту');
      setCooldown(60);
    } catch (err) {
      const ms = err.response?.data?.cooldown_ms;
      if (ms) setCooldown(Math.ceil(ms / 1000));
      toast.error(err.response?.data?.error || 'Не удалось отправить код');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Закрыть" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-dark-900 border border-dark-700 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 p-2 rounded-lg hover:bg-dark-800 text-dark-400" aria-label="Закрыть"><X size={18} /></button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center"><Mail size={20} /></div>
          <div>
            <h2 className="font-semibold text-lg text-white">Подтверждение email</h2>
            <p className="text-xs text-dark-400 mt-0.5">Код отправлен на {user?.email || 'вашу почту'}</p>
          </div>
        </div>
        <form onSubmit={submit}>
          <div className="flex justify-between gap-2 mb-5" onPaste={onPaste}>
            {digits.map((d, i) => (
              <input key={i} ref={(el) => { inputsRef.current[i] = el; }} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={1} value={d} onChange={(e) => onDigit(i, e.target.value)} onKeyDown={(e) => onKeyDown(i, e)} className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl bg-dark-800 border border-dark-600 text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" />
            ))}
          </div>
          <button type="submit" disabled={code.length !== 6 || submitting} className="btn-primary w-full h-11 disabled:opacity-50">{submitting ? 'Проверка…' : 'Подтвердить'}</button>
        </form>
        <p className="text-center text-sm text-dark-400 mt-4">Не пришло письмо?{' '}<button type="button" onClick={resend} disabled={resending || cooldown > 0} className="text-brand-400 hover:text-brand-300 font-medium disabled:opacity-50">{cooldown > 0 ? `Повторить через ${cooldown} с` : resending ? 'Отправка…' : 'Отправить снова'}</button></p>
      </div>
    </div>
  );
}
