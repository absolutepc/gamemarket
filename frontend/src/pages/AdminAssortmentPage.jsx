import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { EyeOff, Eye, Search, Layers, Gamepad2, Smartphone, Scale } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { ASSORTMENT } from '../data/assortment';
import { normalizeAssortmentKey } from '../utils/assortmentIcons';
import { useHiddenAssortmentKeys } from '../hooks/useAssortmentCatalog';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';

const KIND_LABEL = {
  app: 'Приложение',
  mobile: 'Мобильная',
  pc: 'Игра',
};

const TAB_FILTERS = [
  { id: 'all', label: 'Все', icon: Layers },
  { id: 'games', label: 'Игры', icon: Gamepad2 },
  { id: 'mobile', label: 'Мобильные', icon: Smartphone },
  { id: 'apps', label: 'Приложения', icon: Layers },
  { id: 'hidden', label: 'Скрытые', icon: EyeOff },
];

export default function AdminAssortmentPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const { hiddenKeys, isLoading: hiddenLoading } = useHiddenAssortmentKeys();

  const { data: hiddenMeta = [] } = useQuery({
    queryKey: ['admin-assortment-hidden'],
    queryFn: () => api.get('/admin/assortment/hidden').then((r) => r.data),
  });

  const hideMutation = useMutation({
    mutationFn: (name) => api.post('/admin/assortment/hide', { name }),
    onSuccess: (_data, name) => {
      toast.success(`Скрыто: ${name}`);
      qc.invalidateQueries({ queryKey: ['assortment-hidden'] });
      qc.invalidateQueries({ queryKey: ['admin-assortment-hidden'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const unhideMutation = useMutation({
    mutationFn: (name) => api.post('/admin/assortment/unhide', { name }),
    onSuccess: (_data, name) => {
      toast.success(`Восстановлено: ${name}`);
      qc.invalidateQueries({ queryKey: ['assortment-hidden'] });
      qc.invalidateQueries({ queryKey: ['admin-assortment-hidden'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Ошибка'),
  });

  const hiddenMetaByKey = useMemo(() => {
    const map = new Map();
    for (const row of hiddenMeta) {
      map.set(normalizeAssortmentKey(row.item_key || row.name), row);
    }
    return map;
  }, [hiddenMeta]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return ASSORTMENT.filter((item) => {
      const key = normalizeAssortmentKey(item.name);
      const isHidden = hiddenKeys.has(key);

      if (tab === 'hidden' && !isHidden) return false;
      if (tab === 'apps' && item.kind !== 'app') return false;
      if (tab === 'mobile' && item.kind !== 'mobile') return false;
      if (tab === 'games' && item.kind === 'app') return false;

      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.search.toLowerCase().includes(query)
      );
    });
  }, [q, tab, hiddenKeys]);

  const busy = hideMutation.isPending || unhideMutation.isPending;

  return (
    <div className={`${PAGE_WIDTH_CLASS} py-8`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <EyeOff className="text-brand-400" size={22} />
          <h1 className="text-2xl font-bold">Каталог</h1>
        </div>
        <Link to="/admin" className="btn-ghost text-sm">← Админ-панель</Link>
      </div>
      <p className="text-sm text-dark-400 mb-6 max-w-3xl">
        Скрывайте лишние позиции — они пропадут из выбора при создании лота, с главной и страницы приложений.
        Старые лоты сохранят иконки. Можно восстановить в любой момент.
      </p>

      <div className="flex flex-wrap gap-3 text-sm mb-4">
        <span className="px-3 py-1.5 rounded-xl bg-dark-800 text-dark-300">
          Всего: <span className="text-white font-medium">{ASSORTMENT.length}</span>
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-dark-800 text-dark-300">
          Скрыто:{' '}
          <span className="text-amber-300 font-medium">
            {hiddenLoading ? '…' : hiddenKeys.size}
          </span>
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-dark-800 text-dark-300">
          Видимо:{' '}
          <span className="text-emerald-400 font-medium">
            {hiddenLoading ? '…' : ASSORTMENT.length - hiddenKeys.size}
          </span>
        </span>
      </div>

      <div className="relative mb-4 max-w-xl">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
        <input
          className="input pl-9"
          placeholder="Поиск: Claude, PUBG, Telegram…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto mb-5" style={{ scrollbarWidth: 'none' }}>
        {TAB_FILTERS.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setTab(f.id)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${
                tab === f.id ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-300 hover:text-white'
              }`}
            >
              <Icon size={14} />
              {f.label}
              {f.id === 'hidden' && hiddenKeys.size > 0 ? ` (${hiddenKeys.size})` : ''}
            </button>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-dark-400">Ничего не найдено</div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-[70vh] overflow-y-auto divide-y sm:divide-y-0 divide-dark-800 sm:gap-px sm:bg-dark-800">
            {filtered.map((item) => {
              const key = normalizeAssortmentKey(item.name);
              const isHidden = hiddenKeys.has(key);
              const meta = hiddenMetaByKey.get(key);
              return (
                <li
                  key={`${item.kind}-${item.name}`}
                  className={`flex items-center gap-2.5 px-3 py-2.5 min-w-0 ${
                    isHidden ? 'bg-amber-500/5' : 'bg-dark-900'
                  }`}
                >
                  <img
                    src={item.icon}
                    alt=""
                    className={`w-9 h-9 rounded-xl object-cover shrink-0 ring-1 ring-white/10 ${
                      isHidden ? 'opacity-50' : ''
                    }`}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assortment/other-apps.png';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isHidden ? 'text-dark-400 line-through' : 'text-white'}`}>
                      {item.name}
                    </p>
                    <p className="text-[11px] text-dark-500 truncate">
                      {KIND_LABEL[item.kind] || item.kind}
                      {isHidden && meta?.hidden_by_username
                        ? ` · скрыл ${meta.hidden_by_username}`
                        : ''}
                    </p>
                  </div>
                  {isHidden ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => unhideMutation.mutate(item.name)}
                      className="btn-secondary text-xs px-2 py-1.5 inline-flex items-center gap-1 shrink-0"
                    >
                      <Eye size={14} />
                      <span className="hidden sm:inline">Вернуть</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => hideMutation.mutate(item.name)}
                      className="btn-ghost text-xs px-2 py-1.5 text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 shrink-0"
                    >
                      <EyeOff size={14} />
                      <span className="hidden sm:inline">Скрыть</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-dark-800 text-[11px] text-dark-500">
            Показано {filtered.length}
            {tab !== 'all' || q ? ` из ${ASSORTMENT.length}` : ''}
          </div>
        )}
      </div>
    </div>
  );
}
