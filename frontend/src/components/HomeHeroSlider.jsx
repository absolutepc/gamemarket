import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Trophy, ShoppingBag, Store, ArrowRight, Shield,
  Search, Lock, Zap, CheckCircle2,
} from 'lucide-react';

const AUTO_MS = 7000;

const HOW_STEPS = [
  { icon: Search, title: 'Найдите товар', desc: 'Выберите лот в каталоге цифровых товаров и услуг' },
  { icon: Lock, title: 'Оплата в эскроу', desc: 'Средства замораживаются до завершения' },
  { icon: Zap, title: 'Получите товар', desc: 'Вручную или автовыдачей' },
  { icon: CheckCircle2, title: 'Подтвердите', desc: 'Деньги уходят продавцу после проверки' },
];

const SLIDES = [
  {
    id: 'contest',
    eyebrow: 'Ежемесячный конкурс',
    title: 'MacBook Air 15″ 256 ГБ',
    subtitle:
      'Каждый месяц разыгрываем два ноутбука: один среди продавцов и один среди покупателей. Участвуйте в сделках на GameMarket — чем активнее месяц, тем выше шанс.',
    cta: { to: '/catalog', label: 'Участвовать' },
    secondary: { to: '/listings/create', label: 'Стать продавцом' },
    tone: 'contest',
  },
  {
    id: 'how',
    eyebrow: 'Безопасные сделки',
    title: 'Как работает безопасная сделка',
    tone: 'how',
    layout: 'route',
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
];

function ContestVisual() {
  return (
    <div className="relative w-full h-full max-w-md mx-auto lg:ml-auto flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(43,113,243,0.35),transparent_55%)] pointer-events-none" />
      <div className="relative z-10 w-[78%] max-w-[280px] sm:max-w-[320px]">
        <img
          src="/banners/macbook-air-15.webp"
          alt="MacBook Air 15″ — приз конкурса"
          className="w-full h-auto drop-shadow-[0_16px_40px_rgba(0,0,0,0.5)] select-none pointer-events-none"
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
  );
}

function SellVisual() {
  return (
    <div className="relative w-full h-full max-w-md mx-auto lg:ml-auto aspect-[4/3] max-h-[220px] sm:max-h-none flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(43,113,243,0.28),transparent_55%)]" />
      <div className="relative z-10 w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-[#2B71F3]/15 border border-[#2B71F3]/30 flex items-center justify-center shadow-2xl">
        <Store size={48} className="text-[#2B71F3] sm:w-14 sm:h-14" />
      </div>
    </div>
  );
}

/** Zig-zag route: 1 TL → 2 TR → 3 BL → 4 BR */
function HowItWorksRoute() {
  // Anchor centers in % for SVG path (viewBox 0 0 100 100)
  const points = [
    { x: 18, y: 16 },
    { x: 82, y: 28 },
    { x: 18, y: 58 },
    { x: 82, y: 84 },
  ];
  const pathD = `
    M ${points[0].x} ${points[0].y}
    C 40 ${points[0].y}, 60 ${points[1].y}, ${points[1].x} ${points[1].y}
    C 70 42, 50 50, ${points[2].x} ${points[2].y}
    C 40 70, 60 78, ${points[3].x} ${points[3].y}
  `;

  const placements = [
    'left-0 top-0 items-start text-left',
    'right-0 top-[12%] items-end text-right',
    'left-0 top-[48%] items-start text-left',
    'right-0 bottom-0 items-end text-right',
  ];

  return (
    <div className="relative w-full flex-1 min-h-[300px] sm:min-h-[320px]">
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={pathD}
          fill="none"
          stroke="rgba(43,113,243,0.35)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={pathD}
          fill="none"
          stroke="#2B71F3"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6 8"
          vectorEffect="non-scaling-stroke"
          className="animate-[dashMove_18s_linear_infinite]"
        />
      </svg>

      {HOW_STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <div
            key={step.title}
            className={`absolute max-w-[46%] sm:max-w-[42%] flex flex-col gap-1.5 sm:gap-2 ${placements[i]}`}
          >
            <div className={`flex ${i % 2 === 1 ? 'flex-row-reverse' : 'flex-row'} items-center gap-2`}>
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#2B71F3]/15 border border-[#2B71F3]/35
                              text-[#5B8CFF] flex items-center justify-center shrink-0 shadow-lg shadow-black/20">
                <Icon size={20} />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#2B71F3] text-white text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-semibold text-sm sm:text-base leading-tight">{step.title}</h3>
            </div>
            <p className="text-[11px] sm:text-xs text-dark-300 leading-snug px-0.5">
              {step.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
}

const VISUALS = {
  contest: ContestVisual,
  sell: SellVisual,
};

const TONE_BG = {
  contest: 'from-[#12141c] via-[#161a28] to-[#101214]',
  how: 'from-[#10141c] via-[#121a24] to-[#101214]',
  sell: 'from-[#10141c] via-[#121826] to-[#101214]',
};

export default function HomeHeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

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
  const isRoute = slide.layout === 'route';
  const Visual = VISUALS[slide.tone];

  return (
    <section
      className="relative border-b border-dark-800"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={`relative overflow-hidden bg-gradient-to-br ${TONE_BG[slide.tone]}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(43,113,243,0.14),_transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-6 sm:pt-5 sm:pb-8 lg:py-10
                        min-h-[560px] sm:min-h-[520px] lg:min-h-[440px] flex flex-col">
          {slide.tone === 'contest' && (
            <div className="flex justify-center lg:justify-start mb-2 sm:mb-3 shrink-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs sm:text-sm text-dark-200">
                <Trophy size={14} className="text-amber-300" />
                Ежемесячный конкурс
              </div>
            </div>
          )}

          {isRoute ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs sm:text-sm text-dark-200 mb-2 self-start">
                <Shield size={14} className="text-emerald-400" />
                {slide.eyebrow}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight mb-3 sm:mb-4">
                {slide.title}
              </h1>
              <HowItWorksRoute />
            </div>
          ) : (
            <div className="flex-1 grid lg:grid-cols-2 gap-4 lg:gap-10 items-center">
              <div className="order-2 lg:order-1">
                {slide.tone !== 'contest' && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs sm:text-sm text-dark-200 mb-2.5 sm:mb-3">
                    {slide.eyebrow}
                  </div>
                )}
                <h1 className="text-2xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight leading-tight mb-2 sm:mb-3">
                  {slide.title}
                </h1>
                <p className="text-dark-300 text-sm sm:text-base leading-relaxed max-w-xl mb-4 sm:mb-5">
                  {slide.subtitle}
                </p>

                <div className="flex flex-wrap gap-2.5 sm:gap-3">
                  <Link to={slide.cta.to} className="btn-primary h-10 sm:h-12 px-4 sm:px-5 inline-flex items-center gap-2 text-sm sm:text-base">
                    {slide.cta.label} <ArrowRight size={16} />
                  </Link>
                  {slide.secondary && (
                    <Link to={slide.secondary.to} className="btn-secondary h-10 sm:h-12 px-4 sm:px-5 inline-flex items-center text-sm sm:text-base">
                      {slide.secondary.label}
                    </Link>
                  )}
                </div>
              </div>

              <div className="order-1 lg:order-2 min-h-[200px] sm:min-h-[240px] flex items-center">
                {Visual ? <Visual /> : null}
              </div>
            </div>
          )}

          <div className="mt-4 sm:mt-6 flex items-center justify-between gap-4 shrink-0">
            <div className="flex flex-1 gap-2 max-w-xs">
              {SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Слайд ${i + 1}`}
                  onClick={() => goTo(i)}
                  className="relative h-1 flex-1 rounded-full bg-dark-700 overflow-hidden"
                >
                  <span
                    className={`absolute inset-y-0 left-0 rounded-full bg-[#2B71F3] transition-all ${
                      i === index ? 'w-full' : i < index ? 'w-full opacity-40' : 'w-0'
                    }`}
                    style={
                      i === index && !paused
                        ? { animation: `heroProgress ${AUTO_MS}ms linear forwards` }
                        : undefined
                    }
                  />
                </button>
              ))}
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                className="w-9 h-9 rounded-full bg-dark-800/80 border border-dark-700 flex items-center justify-center text-dark-300 hover:text-white hover:border-dark-500 transition-colors"
                aria-label="Предыдущий слайд"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="w-9 h-9 rounded-full bg-dark-800/80 border border-dark-700 flex items-center justify-center text-dark-300 hover:text-white hover:border-dark-500 transition-colors"
                aria-label="Следующий слайд"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes dashMove {
          to { stroke-dashoffset: -120; }
        }
      `}</style>
    </section>
  );
}
