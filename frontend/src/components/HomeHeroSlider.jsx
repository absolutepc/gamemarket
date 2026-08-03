import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy, ShoppingBag, Store, ArrowRight, Shield, Layers, Percent, Zap, Crown, BadgeCheck,
} from 'lucide-react';
import { PAGE_WIDTH_CLASS } from './ListingCard';
import api from '../utils/api';

const AUTO_MS = 7000;

const SLIDES = [
  {
    id: 'contest',
    eyebrow: 'Ежемесячный конкурс',
    title: 'MacBook Air 15″ 256 ГБ',
    subtitle:
      'Каждый месяц разыгрываем два ноутбука: один среди продавцов и один среди покупателей. Участвуйте в сделках на Lootz — чем активнее месяц, тем выше шанс.',
    cta: { to: '/catalog', label: 'Участвовать' },
    secondary: { to: '/become-seller', label: 'Стать продавцом' },
    tone: 'contest',
  },
  {
    id: 'founders',
    eyebrow: 'Программа Founders',
    title: 'Первые 100 продавцов',
    subtitle: null, // rendered via FoundersSubtitle
    cta: { to: '/founders', label: 'Подать заявку' },
    secondary: { to: '/become-seller', label: 'Стать продавцом' },
    tone: 'founders',
  },
  {
    id: 'escrow',
    eyebrow: 'Безопасные сделки',
    title: 'Эскроу Lootz защищает обе стороны',
    subtitle:
      'Оплата удерживается до подтверждения получения товара. Комиссия площадки — 7.5% или 17.5% в зависимости от категории.',
    cta: { to: '/faq', label: 'Как это работает' },
    tone: 'escrow',
  },
  {
    id: 'sell',
    eyebrow: 'Продажа',
    title: 'Выставляйте лоты за минуты',
    subtitle:
      'Игровая валюта, аккаунты, подписки и сервисы — с автовыдачей или вручную через чат сделки.',
    cta: { to: '/listings/create', label: 'Продать товар' },
    tone: 'sell',
  },
  {
    id: 'apps',
    eyebrow: 'Каталог',
    title: 'Сотни игр и сервисов',
    subtitle:
      'Steam, PlayStation, Telegram, ChatGPT и сотни других направлений — найдите нужное и перейдите к лотам в один клик.',
    cta: { to: '/apps', label: 'Смотреть каталог' },
    secondary: { to: '/catalog', label: 'Все лоты' },
    tone: 'apps',
  },
  {
    id: 'fees',
    eyebrow: 'Комиссия',
    title: 'От 7.5% — прозрачно',
    subtitle:
      'Для доната, подписок, пополнений, ключей, скинов и игр — 7.5%. Для аккаунтов, валюты и остального — 17.5%. Без скрытых сборов за вывод.',
    cta: { to: '/faq', label: 'Подробнее о комиссии' },
    tone: 'fees',
  },
  {
    id: 'delivery',
    eyebrow: 'Выдача',
    title: 'Мгновенно или через чат',
    subtitle:
      'Автовыдача для цифровых товаров и ручная передача с чатом сделки — выбирайте удобный формат при создании лота.',
    cta: { to: '/listings/create', label: 'Создать лот' },
    secondary: { to: '/catalog', label: 'Купить сейчас' },
    tone: 'delivery',
  },
];

function FoundersSubtitle() {
  return (
    <>
      Комиссия{' '}
      <span className="line-through text-dark-500">7.5%</span>{' '}
      <span className="text-amber-200 font-semibold">5%</span>
      {' '}и{' '}
      <span className="line-through text-dark-500">17.5%</span>{' '}
      <span className="text-amber-200 font-semibold">10%</span>
      , золотая галочка, приоритет в поиске и бейдж Founding Seller. Вход по заявке после рассмотрения — один аккаунт на человека.
    </>
  );
}

function formatCount(n) {
  return new Intl.NumberFormat('ru-RU').format(Math.max(0, Number(n) || 0));
}

function ContestVisual() {
  return (
    <>
      <div className="relative w-full h-full max-w-md mx-auto flex flex-col items-center justify-center lg:hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(43,113,243,0.35),transparent_55%)] pointer-events-none" />
        <div className="relative z-10 w-[78%] max-w-[280px] sm:max-w-[320px]">
          <img
            src="/banners/macbook-air-15.webp"
            alt="MacBook Air 15″ — приз конкурса"
            className="w-full h-auto max-h-[150px] sm:max-h-[170px] object-contain drop-shadow-[0_16px_40px_rgba(0,0,0,0.5)] select-none pointer-events-none"
            draggable={false}
          />
          <div className="mt-2 flex flex-col items-center gap-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-dark-900/80 border border-dark-700 px-2.5 py-0.5 text-[10px] text-dark-200 backdrop-blur-sm">
              <Trophy size={11} className="text-amber-300" />
              256 ГБ · 2 приза / месяц
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <div className="flex items-center gap-1.5 rounded-lg bg-dark-900/90 border border-dark-700 px-2.5 py-1.5 backdrop-blur-sm">
                <Store size={12} className="text-[#2B71F3] shrink-0" />
                <span className="text-[11px] font-medium whitespace-nowrap">1× продавцам</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-dark-900/90 border border-dark-700 px-2.5 py-1.5 backdrop-blur-sm">
                <ShoppingBag size={12} className="text-emerald-400 shrink-0" />
                <span className="text-[11px] font-medium whitespace-nowrap">1× покупателям</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-full h-full hidden lg:flex items-center justify-start">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_45%,rgba(43,113,243,0.35),transparent_55%)] pointer-events-none" />
        <img
          src="/banners/macbook-air-15.webp"
          alt="MacBook Air 15″ — приз конкурса"
          className="relative z-10 w-[95%] h-auto max-h-[340px] object-contain object-left
                     select-none pointer-events-none"
          draggable={false}
        />
      </div>
    </>
  );
}

function FoundersVisual({ sellersCount, foundersJoined, foundersLimit }) {
  const joined = foundersJoined ?? 0;
  const limit = foundersLimit || 100;
  const pct = Math.min(100, Math.round((joined / limit) * 100));

  return (
    <div className="relative w-full h-full flex items-center justify-center px-2">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                   w-[260px] h-[260px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle,rgba(212,175,55,0.28) 0%,rgba(212,175,55,0.1) 42%,transparent 72%)',
        }}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-[300px] rounded-3xl border border-amber-500/30 bg-dark-900/80 backdrop-blur-sm p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Crown size={20} className="text-amber-300" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">Founders</div>
            <div className="text-[11px] text-amber-200/80">Founding Seller</div>
          </div>
          <BadgeCheck size={18} className="ml-auto text-amber-300" />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-xl bg-dark-950/70 border border-dark-700 px-2.5 py-2">
            <div className="text-[10px] text-dark-400 mb-0.5">Продавцы</div>
            <div className="text-lg font-extrabold text-white tabular-nums leading-none">
              {formatCount(sellersCount)}
            </div>
          </div>
          <div className="rounded-xl bg-dark-950/70 border border-dark-700 px-2.5 py-2">
            <div className="text-[10px] text-dark-400 mb-0.5">Founders</div>
            <div className="text-lg font-extrabold text-amber-200 tabular-nums leading-none">
              {joined}/{limit}
            </div>
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-dark-800 overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>

        <ul className="space-y-1.5 text-[11px] text-dark-200">
          <li className="flex items-center gap-1.5 flex-wrap">
            <Percent size={11} className="text-amber-300 shrink-0" />
            <span>
              Комиссия{' '}
              <span className="line-through text-dark-500">7.5%</span>{' '}
              <span className="text-amber-200 font-semibold">5%</span>
              {' / '}
              <span className="line-through text-dark-500">17.5%</span>{' '}
              <span className="text-amber-200 font-semibold">10%</span>
            </span>
          </li>
          <li className="flex items-center gap-1.5"><BadgeCheck size={11} className="text-amber-300" /> Золотая галочка</li>
          <li className="flex items-center gap-1.5"><Trophy size={11} className="text-amber-300" /> Выше в поиске</li>
        </ul>
      </div>
    </div>
  );
}

function IconVisual({
  Icon,
  glow = 'rgba(43,113,243,0.38)',
  glowSoft = 'rgba(43,113,243,0.14)',
  box = 'bg-[#2B71F3]/15 border-[#2B71F3]/25',
  iconClass = 'text-[#2B71F3]',
}) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle,${glow} 0%,${glowSoft} 42%,transparent 72%)`,
          }}
          aria-hidden
        />
        <div className={`relative z-10 w-32 h-32 sm:w-36 sm:h-36 rounded-3xl border flex items-center justify-center ${box}`}>
          <Icon size={48} className={`${iconClass} sm:w-14 sm:h-14`} />
        </div>
      </div>
    </div>
  );
}

function EscrowVisual() {
  return (
    <IconVisual
      Icon={Shield}
      glow="rgba(16,185,129,0.32)"
      glowSoft="rgba(16,185,129,0.12)"
      box="bg-emerald-500/15 border-emerald-500/25"
      iconClass="text-emerald-400"
    />
  );
}

function SellVisual() {
  return <IconVisual Icon={Store} />;
}

function AppsVisual() {
  return (
    <IconVisual
      Icon={Layers}
      glow="rgba(91,140,255,0.4)"
      glowSoft="rgba(91,140,255,0.14)"
      box="bg-[#5B8CFF]/15 border-[#5B8CFF]/25"
      iconClass="text-[#5B8CFF]"
    />
  );
}

function FeesVisual() {
  return (
    <IconVisual
      Icon={Percent}
      glow="rgba(251,191,36,0.32)"
      glowSoft="rgba(251,191,36,0.12)"
      box="bg-amber-500/15 border-amber-500/25"
      iconClass="text-amber-300"
    />
  );
}

function DeliveryVisual() {
  return (
    <IconVisual
      Icon={Zap}
      glow="rgba(167,139,250,0.38)"
      glowSoft="rgba(167,139,250,0.14)"
      box="bg-violet-500/15 border-violet-500/25"
      iconClass="text-violet-300"
    />
  );
}

const TONE_BG = {
  contest: 'from-[#12141c] via-[#161a28] to-[#101214]',
  founders: 'from-[#16140f] via-[#1a1710] to-[#101214]',
  escrow: 'from-[#101816] via-[#121a18] to-[#101214]',
  sell: 'from-[#10141c] via-[#121826] to-[#101214]',
  apps: 'from-[#10141c] via-[#141a2a] to-[#101214]',
  fees: 'from-[#161410] via-[#1a1812] to-[#101214]',
  delivery: 'from-[#14101a] via-[#18141f] to-[#101214]',
};

export default function HomeHeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => api.get('/stats/platform').then((r) => r.data),
    staleTime: 60_000,
  });

  const go = useCallback((dir) => {
    setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);
  }, []);

  const goTo = (i) => setIndex(i);

  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => go(1), AUTO_MS);
    return () => clearInterval(t);
  }, [paused, go, index]);

  const slide = SLIDES[index];

  let VisualNode = null;
  if (slide.tone === 'contest') VisualNode = <ContestVisual />;
  else if (slide.tone === 'founders') {
    VisualNode = (
      <FoundersVisual
        sellersCount={stats?.sellers_count}
        foundersJoined={stats?.founders?.joined}
        foundersLimit={stats?.founders?.limit}
      />
    );
  } else if (slide.tone === 'escrow') VisualNode = <EscrowVisual />;
  else if (slide.tone === 'sell') VisualNode = <SellVisual />;
  else if (slide.tone === 'apps') VisualNode = <AppsVisual />;
  else if (slide.tone === 'fees') VisualNode = <FeesVisual />;
  else if (slide.tone === 'delivery') VisualNode = <DeliveryVisual />;

  return (
    <section
      className="relative border-b border-dark-800"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={`relative overflow-hidden bg-gradient-to-br ${TONE_BG[slide.tone]}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(43,113,243,0.14),_transparent_50%)] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div
          className={`relative ${PAGE_WIDTH_CLASS} py-5 sm:py-7 lg:py-8
                      h-[520px] sm:h-[480px] lg:h-[420px] flex flex-col`}
        >
          <div className="flex-1 grid lg:grid-cols-[1.05fr_0.95fr] gap-4 lg:gap-6 items-stretch min-h-0">
            <div className="order-2 lg:order-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs sm:text-sm text-dark-200 mb-2.5 sm:mb-3 w-fit">
                  {slide.tone === 'contest' ? (
                    <>
                      <Trophy size={14} className="text-amber-300" />
                      {slide.eyebrow}
                    </>
                  ) : slide.tone === 'founders' ? (
                    <>
                      <Crown size={14} className="text-amber-300" />
                      {slide.eyebrow}
                    </>
                  ) : (
                    slide.eyebrow
                  )}
                </div>
                <h1 className="text-2xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight leading-tight mb-2 sm:mb-3">
                  {slide.title}
                </h1>
                <p className="text-dark-300 text-sm sm:text-base leading-relaxed max-w-xl mb-3 sm:mb-4 line-clamp-4">
                  {slide.tone === 'founders' ? <FoundersSubtitle /> : slide.subtitle}
                </p>

                <div
                  className={`hidden lg:flex flex-wrap items-center gap-2 mb-4 sm:mb-5 min-h-[34px] ${
                    slide.tone === 'contest' || slide.tone === 'founders' ? '' : 'invisible'
                  }`}
                  aria-hidden={slide.tone !== 'contest' && slide.tone !== 'founders'}
                >
                  {slide.tone === 'contest' && (
                    <>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-dark-900/80 border border-dark-700 px-2.5 py-1 text-[11px] text-dark-200">
                        <Trophy size={12} className="text-amber-300" />
                        256 ГБ · 2 приза / месяц
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-dark-900/90 border border-dark-700 px-2.5 py-1.5 text-[11px] font-medium">
                        <Store size={12} className="text-[#2B71F3] shrink-0" />
                        1× продавцам
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-dark-900/90 border border-dark-700 px-2.5 py-1.5 text-[11px] font-medium">
                        <ShoppingBag size={12} className="text-emerald-400 shrink-0" />
                        1× покупателям
                      </div>
                    </>
                  )}
                  {slide.tone === 'founders' && (
                    <>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-dark-900/80 border border-amber-500/30 px-2.5 py-1 text-[11px] text-amber-100">
                        <Store size={12} className="text-[#2B71F3]" />
                        Продавцов: {formatCount(stats?.sellers_count)}
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-dark-900/90 border border-amber-500/30 px-2.5 py-1.5 text-[11px] font-medium text-amber-100">
                        <Crown size={12} className="text-amber-300 shrink-0" />
                        Founders {stats?.founders?.joined ?? 0}/{stats?.founders?.limit ?? 100}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex flex-wrap gap-2.5 sm:gap-3 mb-1">
                <Link to={slide.cta.to} className="btn-primary h-10 sm:h-12 px-4 sm:px-5 inline-flex items-center gap-2 text-sm sm:text-base">
                  {slide.cta.label} <ArrowRight size={16} />
                </Link>
                {slide.secondary ? (
                  <Link to={slide.secondary.to} className="btn-secondary h-10 sm:h-12 px-4 sm:px-5 inline-flex items-center text-sm sm:text-base">
                    {slide.secondary.label}
                  </Link>
                ) : (
                  <span className="h-10 sm:h-12 px-4 sm:px-5 invisible inline-flex items-center text-sm sm:text-base" aria-hidden>
                    Стать продавцом
                  </span>
                )}
              </div>
            </div>

            <div className="order-1 lg:order-2 h-[210px] sm:h-[240px] lg:h-auto min-h-0 flex items-center justify-center">
              {VisualNode}
            </div>
          </div>

          <div className="mt-4 sm:mt-5 flex items-center shrink-0">
            <div className="flex w-full max-w-md gap-2">
              {SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Слайд ${i + 1}`}
                  onClick={() => goTo(i)}
                  className="relative h-1.5 flex-1 rounded-full bg-dark-700 overflow-hidden"
                >
                  <span
                    key={i === index ? `active-${index}` : `idle-${i}`}
                    className={`absolute inset-y-0 left-0 rounded-full bg-[#2B71F3] ${
                      i === index ? '' : i < index ? 'w-full opacity-40' : 'w-0'
                    }`}
                    style={
                      i === index
                        ? {
                            animation: `heroProgress ${AUTO_MS}ms linear forwards`,
                            animationPlayState: paused ? 'paused' : 'running',
                          }
                        : undefined
                    }
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
