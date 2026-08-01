import { Link, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { Gamepad2, Smartphone, Layers, Plus } from 'lucide-react';
import Seo from '../components/Seo';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';
import { ASSORTMENT_TABS, assortmentByTab } from '../data/assortment';

const FALLBACK_ICON = '/assortment/other-apps.png';

const TAB_ICONS = {
  games: Gamepad2,
  mobile: Smartphone,
  apps: Layers,
};

export default function AppsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = ASSORTMENT_TABS.some((t) => t.id === tabParam) ? tabParam : 'games';

  const tabItems = useMemo(() => assortmentByTab(activeTab), [activeTab]);

  const tabCounts = useMemo(
    () => Object.fromEntries(ASSORTMENT_TABS.map((t) => [t.id, assortmentByTab(t.id).length])),
    []
  );

  const setTab = (id) => {
    setSearchParams(id === 'games' ? {} : { tab: id }, { replace: true });
  };

  const activeLabel = ASSORTMENT_TABS.find((t) => t.id === activeTab)?.label || 'Игры';
  const ActiveIcon = TAB_ICONS[activeTab] || Layers;
  const suggestTopic =
    activeTab === 'apps' ? 'suggest_app' : activeTab === 'mobile' ? 'suggest_mobile' : 'suggest_game';

  return (
    <div className={`${PAGE_WIDTH_CLASS} py-6 sm:py-8 pb-28`}>
      <Seo
        title="Игры и сервисы"
        description="Все игры, мобильные игры и приложения Lootz — выберите направление и перейдите к лотам."
        path="/apps"
      />

      {/* Playerok-style pill tabs + suggest */}
      <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0" role="tablist" aria-label="Разделы">
          {ASSORTMENT_TABS.map((tab) => {
            const active = tab.id === activeTab;
            const Icon = TAB_ICONS[tab.id] || Layers;
            const count = tabCounts[tab.id] || 0;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(tab.id)}
                className={`shrink-0 inline-flex items-center gap-2 rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5
                            text-sm font-medium transition-colors whitespace-nowrap ${
                              active
                                ? 'bg-[#2B71F3] text-white'
                                : 'bg-dark-900 text-dark-300 ring-1 ring-dark-800 hover:text-white hover:bg-dark-800'
                            }`}
              >
                <Icon size={16} className={active ? 'text-white' : 'text-dark-400'} />
                <span>
                  {tab.label}{' '}
                  <span className={active ? 'text-white/90' : 'text-dark-500'}>{count}</span>
                </span>
              </button>
            );
          })}
        </div>

        <Link
          to={`/support?topic=${suggestTopic}`}
          className="ml-auto shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-[#2B71F3]
                     hover:text-blue-400 transition-colors whitespace-nowrap pl-2"
        >
          <Plus size={16} strokeWidth={2.5} />
          Предложить
        </Link>
      </div>

      <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
        <ActiveIcon size={22} className="text-[#2B71F3] shrink-0" />
        <h1 className="text-xl sm:text-2xl font-bold">{activeLabel}</h1>
      </div>

      {/* Dense Playerok-style icon grid */}
      <div
        className="grid gap-x-2.5 gap-y-4 sm:gap-x-3 sm:gap-y-5
                   grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12
                   2xl:grid-cols-[repeat(14,minmax(0,1fr))]"
      >
        {tabItems.map((item) => (
          <Link
            key={`${item.kind}-${item.name}-${item.search}`}
            to={`/catalog?search=${encodeURIComponent(item.search)}`}
            className="group flex flex-col items-center gap-1.5 min-w-0"
          >
            <div
              className="w-full aspect-square rounded-[18%] overflow-hidden bg-[#1c1e24]
                         ring-1 ring-white/[0.08]
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
      </div>

      {tabItems.length === 0 && (
        <div className="text-center text-dark-400 py-16 text-sm">Пока ничего нет в этом разделе</div>
      )}
    </div>
  );
}
