import { Link, useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Search, Layers, Plus } from 'lucide-react';
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
  const suggestTopic = activeTab === 'apps' ? 'suggest_app' : activeTab === 'mobile' ? 'suggest_mobile' : 'suggest_game';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-28">
      <Seo
        title="Игры и сервисы"
        description="Все игры, мобильные игры и приложения Lootz — выберите направление и перейдите к лотам."
        path="/apps"
      />

      <div className="flex items-center gap-2.5 mb-4">
        <Layers size={22} className="text-[#2B71F3] shrink-0" />
        <h1 className="text-xl sm:text-2xl font-bold">{activeLabel}</h1>
      </div>

      {/* Tabs: Игры / Мобильные игры / Приложения */}
      <div
        className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-dark-900 p-1 ring-1 ring-dark-800"
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

      <div className="relative mb-5 max-w-xl">
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

      {/* Playerok-style 4-column icon grid */}
      <div className="grid grid-cols-4 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6">
        {filtered.map((item) => (
          <Link
            key={`${item.kind}-${item.name}-${item.search}`}
            to={`/catalog?search=${encodeURIComponent(item.search)}`}
            className="group flex flex-col items-center gap-1.5"
          >
            <div
              className="w-full aspect-square max-w-[84px] mx-auto rounded-[22%] overflow-hidden bg-[#1c1e24]
                         ring-1 ring-white/[0.08] shadow-[0_6px_18px_rgba(0,0,0,0.35)]
                         group-hover:ring-[#2B71F3]/45 group-hover:scale-[1.04] transition-all duration-200"
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
            <span className="w-full text-center text-[11px] sm:text-xs text-white/90 group-hover:text-white leading-tight line-clamp-2 px-0.5">
              {item.name}
            </span>
          </Link>
        ))}

        {/* Предложить — Playerok-style trailing tile */}
        {!q.trim() && (
          <Link
            to={`/support?topic=${suggestTopic}`}
            className="group flex flex-col items-center gap-1.5"
            aria-label="Предложить"
          >
            <div
              className="w-full aspect-square max-w-[84px] mx-auto rounded-[22%] overflow-hidden
                         bg-[#1c1e24] ring-1 ring-white/[0.08]
                         flex items-center justify-center
                         group-hover:ring-[#2B71F3]/45 transition-all duration-200"
            >
              <Plus size={28} strokeWidth={2} className="text-[#5B8CFF]" />
            </div>
            <span className="w-full text-center text-[11px] sm:text-xs font-medium text-[#5B8CFF] leading-tight">
              Предложить
            </span>
          </Link>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-dark-400 py-16 text-sm">Ничего не найдено</div>
      )}
    </div>
  );
}
