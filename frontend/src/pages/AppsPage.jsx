import { Link, useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Seo from '../components/Seo';
import { ASSORTMENT_TABS, assortmentByTab } from '../data/assortment';

const FALLBACK_ICON = '/assortment/other-apps.png';

export default function AppsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = ASSORTMENT_TABS.some((t) => t.id === tabParam) ? tabParam : 'games';
  const [q, setQ] = useState('');

  const tabItems = useMemo(() => assortmentByTab(activeTab), [activeTab]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return tabItems;
    return tabItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) || item.search.toLowerCase().includes(query)
    );
  }, [q, tabItems]);

  const setTab = (id) => {
    setSearchParams(id === 'games' ? {} : { tab: id }, { replace: true });
    setQ('');
  };

  const activeLabel = ASSORTMENT_TABS.find((t) => t.id === activeTab)?.label || 'Игры';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Seo
        title="Игры и сервисы"
        description="Все игры, мобильные игры и приложения Lootz — выберите направление и перейдите к лотам."
        path="/apps"
      />

      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Игры и сервисы</h1>
      <p className="text-dark-400 text-sm mb-5">
        {tabItems.length.toLocaleString('ru-RU')} в разделе «{activeLabel}» · выберите игру или сервис
      </p>

      {/* Tabs: Игры / Мобильные игры / Приложения */}
      <div
        className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-dark-900 p-1 ring-1 ring-dark-800"
        style={{ scrollbarWidth: 'none' }}
        role="tablist"
        aria-label="Разделы"
      >
        {ASSORTMENT_TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(tab.id)}
              className={`shrink-0 flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#2B71F3] text-white shadow-sm'
                  : 'text-dark-300 hover:text-white hover:bg-dark-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="relative mb-6 max-w-xl">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
        <input
          className="input pl-10"
          placeholder={
            activeTab === 'apps'
              ? 'Поиск приложений...'
              : activeTab === 'mobile'
                ? 'Поиск мобильных игр...'
                : 'Поиск игр...'
          }
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-3 gap-y-5">
        {filtered.map((item) => (
          <Link
            key={`${item.kind}-${item.name}-${item.search}`}
            to={`/catalog?search=${encodeURIComponent(item.search)}`}
            className="group flex flex-col items-center gap-2"
          >
            <div
              className="w-full aspect-square max-w-[88px] mx-auto rounded-2xl overflow-hidden bg-dark-800 ring-1 ring-white/10
                            group-hover:ring-[#2B71F3]/50 group-hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <img
                src={item.icon}
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_ICON;
                }}
              />
            </div>
            <span className="text-[11px] sm:text-xs text-dark-300 group-hover:text-white text-center leading-tight line-clamp-2 w-full">
              {item.name}
            </span>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-dark-400 py-16 text-sm">Ничего не найдено</div>
      )}
    </div>
  );
}
