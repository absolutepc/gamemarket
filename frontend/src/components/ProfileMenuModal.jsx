import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, MessageCircle, LogOut, ChevronRight, Wallet, Camera, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import NotificationsModal from './NotificationsModal';
import { formatPrice } from '../utils/format';
import { compressImageFile } from '../utils/imageCompress';
import { lockBodyScroll, unlockBodyScroll } from '../utils/bodyScrollLock';

const SOCIALS = [
  { label: 'Telegram', href: 'https://t.me/lootz_io', color: '#2AABEE', path: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' },
  { label: 'VK', href: 'https://vk.com/', color: '#0077FF', path: 'M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.714-1.033-1.01-1.49-1.147-1.744-1.147-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.12-5.339-3.202-2.17-3.088-2.763-5.406-2.763-5.88 0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.474-.085.72-.576.72z' },
  { label: 'YouTube', href: 'https://youtube.com/', color: '#FF0000', path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  { label: 'TikTok', href: 'https://tiktok.com/', color: '#111111', path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
];

function prefsSummary() {
  try {
    const p = JSON.parse(localStorage.getItem('gm_notification_prefs') || '{}');
    if (p.telegram || p.push || p.vk || p.email) return 'Вкл.';
    return 'Выкл.';
  } catch {
    return 'Выкл.';
  }
}

export default function ProfileMenuModal({ open, onClose }) {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifLabel, setNotifLabel] = useState(prefsSummary);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameBusy, setNameBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setShowNotifications(false);
      setEditingName(false);
      return undefined;
    }
    setNotifLabel(prefsSummary());
    setNameDraft(user?.username || '');
    const onKey = (e) => { if (e.key === 'Escape' && !showNotifications) onClose(); };
    document.addEventListener('keydown', onKey);
    lockBodyScroll();
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockBodyScroll();
    };
  }, [open, onClose, showNotifications, user?.username]);

  if (!open || !user) return null;

  const saveAvatar = async (avatar_url) => {
    setAvatarBusy(true);
    try {
      const { data } = await api.put('/users/me/profile', { avatar_url });
      setUser({ ...user, avatar_url: data.avatar_url });
      toast.success(avatar_url ? 'Аватар обновлён' : 'Аватар удалён');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Не удалось обновить аватар');
    } finally {
      setAvatarBusy(false);
    }
  };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarBusy(true);
    try {
      const dataUrl = await compressImageFile(file, { maxSide: 320, quality: 0.78 });
      await saveAvatar(dataUrl);
    } catch (err) {
      toast.error(err.message || 'Не удалось загрузить фото');
      setAvatarBusy(false);
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/');
  };

  const saveUsername = async () => {
    const next = nameDraft.trim();
    if (!next || next === user.username) {
      setEditingName(false);
      setNameDraft(user.username || '');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(next)) {
      toast.error('Имя: 3–30 символов, латиница, цифры и _');
      return;
    }
    setNameBusy(true);
    try {
      const { data } = await api.put('/users/me/profile', { username: next });
      setUser({ ...user, username: data.username });
      toast.success('Имя обновлено');
      setEditingName(false);
      onClose();
      navigate(`/users/${data.username}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Не удалось сменить имя');
    } finally {
      setNameBusy(false);
    }
  };

  const authLabel = user.auth_provider === 'vk'
    ? 'Вы вошли с VK ID'
    : user.auth_provider === 'apple'
      ? 'Вы вошли с Apple ID'
      : user.auth_provider === 'google'
        ? 'Вы вошли с Google'
        : 'Вы вошли по email';

  const closeAll = () => {
    setShowNotifications(false);
    onClose();
  };

  return (
    <>
      {!showNotifications && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Закрыть" onClick={onClose} />
          <div className="relative w-full max-w-sm rounded-2xl bg-dark-900 border border-dark-800 shadow-2xl animate-slide-up overflow-hidden">
            <div className="flex items-center justify-center relative px-4 py-4 border-b border-dark-800">
              <h2 className="font-semibold text-lg">Меню</h2>
              <button type="button" onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden ring-2 ring-[#2B71F3]/50 ring-offset-2 ring-offset-dark-900 bg-dark-800">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-3xl font-bold">
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarBusy}
                  className="absolute bottom-0.5 right-0.5 w-9 h-9 rounded-full bg-[#2B71F3] text-white
                             flex items-center justify-center shadow-lg border-2 border-dark-900
                             hover:bg-blue-500 disabled:opacity-60"
                  aria-label="Загрузить аватар"
                >
                  <Camera size={16} />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickFile}
                />
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={avatarBusy}
                className="mt-3 text-sm text-brand-400 hover:text-brand-300 font-medium"
              >
                {avatarBusy ? 'Загрузка…' : 'Добавить аватар'}
              </button>
              {user.avatar_url && (
                <button
                  type="button"
                  onClick={() => saveAvatar(null)}
                  disabled={avatarBusy}
                  className="mt-1 text-xs text-dark-500 hover:text-dark-300"
                >
                  Удалить фото
                </button>
              )}
              <p className="mt-2 text-sm text-dark-300">{authLabel}</p>

              <div className="mt-4 w-full text-left">
                <label className="text-xs text-dark-500 mb-1.5 block">Имя на сайте</label>
                {editingName ? (
                  <div className="space-y-2">
                    <input
                      className="input py-2.5 text-sm"
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30))}
                      placeholder="username"
                      autoFocus
                      disabled={nameBusy}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveUsername();
                        if (e.key === 'Escape') {
                          setEditingName(false);
                          setNameDraft(user.username || '');
                        }
                      }}
                    />
                    <p className="text-[11px] text-dark-500">Латиница, цифры и _ · 3–30 символов</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveUsername}
                        disabled={nameBusy}
                        className="btn-primary flex-1 text-sm py-2"
                      >
                        {nameBusy ? 'Сохранение…' : 'Сохранить'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingName(false);
                          setNameDraft(user.username || '');
                        }}
                        disabled={nameBusy}
                        className="btn-secondary text-sm py-2"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setNameDraft(user.username || '');
                      setEditingName(true);
                    }}
                    className="w-full flex items-center justify-between gap-2 rounded-xl bg-dark-800/80 border border-dark-700 px-3.5 py-2.5
                               hover:border-dark-600 transition-colors"
                  >
                    <span className="font-medium text-white truncate">{user.username}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-brand-400 shrink-0">
                      <Pencil size={12} /> Изменить
                    </span>
                  </button>
                )}
              </div>

              <Link
                to="/wallet"
                onClick={onClose}
                className="mt-4 w-full flex items-center justify-between gap-3 rounded-xl bg-brand-500/15 border border-brand-500/30 px-4 py-3 hover:bg-brand-500/25 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-brand-300">
                  <Wallet size={16} />
                  Кошелёк
                </span>
                <span className="font-semibold text-white">{formatPrice(user.balance)}</span>
              </Link>
            </div>

            <div className="mx-4 border-y border-dark-800">
              <button
                type="button"
                onClick={() => setShowNotifications(true)}
                className="w-full flex items-center justify-between gap-3 py-4 px-1 text-left hover:bg-dark-800/40 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-white">Уведомления</div>
                  <div className="text-xs text-dark-400 mt-0.5">Новые сообщения</div>
                </div>
                <span className="flex items-center gap-1 text-sm text-dark-300">
                  {notifLabel}
                  <ChevronRight size={16} className="text-dark-500" />
                </span>
              </button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-3">
              <Link
                to="/support"
                onClick={onClose}
                className="flex items-center gap-2.5 text-brand-400 hover:text-brand-300 text-sm font-medium"
              >
                <MessageCircle size={18} />
                Написать в поддержку
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2.5 text-red-400 hover:text-red-300 text-sm font-medium"
              >
                <LogOut size={18} />
                Выйти из профиля
              </button>
            </div>

            <div className="px-5 pb-6 pt-2 border-t border-dark-800">
              <p className="text-xs text-dark-500 mb-3">Наши социальные сети</p>
              <div className="flex items-center gap-2.5">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: s.color }}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
                      <path d={s.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <NotificationsModal
        open={showNotifications}
        onBack={() => {
          setShowNotifications(false);
          setNotifLabel(prefsSummary());
        }}
        onClose={closeAll}
      />
    </>
  );
}
