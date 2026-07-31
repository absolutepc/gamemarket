import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Check } from 'lucide-react';
import { ASSORTMENT, ASSORTMENT_TABS, assortmentByTab } from '../data/assortment';
import { resolveAssortmentItem } from '../utils/assortmentIcons';

/**
 * Required picker: user must select a concrete game / app / service from assortment.
 * Stores the exact assortment `name` so listing cards can resolve the logo.
 */
export default function AssortmentPicker({ value, onChange, required = true }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('games');
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const selected = useMemo(() => resolveAssortmentItem(value), [value]);

  const tabItems = useMemo(() => assortmentByTab(tab), [tab]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const source = query ? ASSORTMENT : tabItems;
    if (!query) return source;
    return source.filter(
      (item) =>
        item.name.toLowerCase().includes(query) || item.search.toLowerCase().includes(query)
    );
  }, [q, tabItems]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQ('');
    }
  }, [open]);

  const pick = (item) => {
    onChange(item.name);
    setOpen(false);
    setQ('');
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={rootRef} className="relative">
      <label className="text-sm font-medium mb-1.5 block">
        Игра / приложение / сервис{required ? ' *' : ''}
      </label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full input flex items-center gap-3 text-left min-h-[48px] ${
          open ? 'border-[#2B71F3] ring-1 ring-[#2B71F3]/40' : ''
        }`}
      >
        {selected ? (
          <>
            <img
              src={selected.icon}
              alt=""
              className="w-8 h-8 rounded-lg object-cover shrink-0 ring-1 ring-white/10"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/assortment/other-apps.png';
              }}
            />
            <span className="flex-1 truncate text-white font-medium">{selected.name}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={clear}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') clear(e); }}
              className="p-1 rounded-md text-dark-400 hover:text-white hover:bg-dark-700"
              aria-label="Очистить"
            >
              <X size={16} />
            </span>
          </>
        ) : value ? (
          <>
            <span className="w-8 h-8 rounded-lg bg-dark-700 shrink-0" />
            <span className="flex-1 truncate text-amber-300">{value}</span>
            <span className="text-[10px] text-amber-400/80 shrink-0">выберите из списка</span>
          </>
        ) : (
          <>
            <Search size={16} className="text-dark-500 shrink-0" />
            <span className="flex-1 text-dark-500">Выберите игру, приложение или сервис</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-2xl border border-dark-700 bg-dark-900 shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-dark-800 space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
              <input
                ref={inputRef}
                className="input pl-9 py-2.5 text-sm"
                placeholder="Поиск: Steam, Standoff 2, ChatGPT..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            {!q.trim() && (
              <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {ASSORTMENT_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      tab === t.id
                        ? 'bg-[#2B71F3] text-white'
                        : 'bg-dark-800 text-dark-300 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="text-center text-dark-400 text-sm py-8">Ничего не найдено</div>
            ) : (
              <ul className="space-y-0.5">
                {filtered.slice(0, 80).map((item) => {
                  const active = selected?.name === item.name;
                  return (
                    <li key={`${item.kind}-${item.name}`}>
                      <button
                        type="button"
                        onClick={() => pick(item)}
                        className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors ${
                          active
                            ? 'bg-[#2B71F3]/20 ring-1 ring-[#2B71F3]/40'
                            : 'hover:bg-dark-800'
                        }`}
                      >
                        <img
                          src={item.icon}
                          alt=""
                          className="w-9 h-9 rounded-xl object-cover shrink-0 ring-1 ring-white/10"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/assortment/other-apps.png';
                          }}
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-white truncate">{item.name}</span>
                          <span className="block text-[10px] text-dark-500 truncate">
                            {item.kind === 'app'
                              ? 'Приложение'
                              : item.kind === 'mobile'
                                ? 'Мобильная игра'
                                : 'Игра'}
                          </span>
                        </span>
                        {active && <Check size={16} className="text-[#2B71F3] shrink-0" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {filtered.length > 80 && (
              <p className="text-[11px] text-dark-500 text-center py-2">
                Показаны первые 80 · уточните поиск
              </p>
            )}
          </div>
        </div>
      )}

      <p className="text-[11px] text-dark-500 mt-1.5">
        Нужно выбрать из списка — так на карточке лота появится правильный логотип
      </p>
    </div>
  );
}
