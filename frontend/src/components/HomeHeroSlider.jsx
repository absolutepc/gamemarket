import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Trophy, ShoppingBag, Store, ArrowRight, Shield } from 'lucide-react';

const AUTO_MS = 7000;

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
    id: 'escrow',
    eyebrow: 'Безопасные сделки',
    title: 'Эскроу защищает обе стороны',
    subtitle:
      'Оплата удерживается до подтверждения получения товара. Комиссия площадки — 7.5%.',
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
];

function ContestVisual() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0 lg:ml-auto flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(43,113,243,0.35),transparent_55%)] pointer-events-none" />
      <div className="absolute -right-4 top-6 w-28 h-28 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />
      <div className="absolute left-2 bottom-8 w-24 h-24 rounded-full bg-[#2B71F3]/25 blur-2xl pointer-events-none" />

      <div className="relative z-10 w-[92%] max-w-[420px]">
        <img
          src="/banners/macbook-air-15.webp"
          alt="MacBook Air 15″ — приз конкурса"
          className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.55)] select-none pointer-events-none"
          draggable={false}
        />

        <div className="mt-3 flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-dark-900/80 border border-dark-700 px-3 py-1 text-[11px] text-dark-200 backdrop-blur-sm">
            <Trophy size={12} className="text-amber-300" />
            MacBook Air 15″ · 256 ГБ · 2 приза / месяц
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-dark-900/90 border border-dark-700 px-3 py-2 backdrop-blur-sm shadow-lg">
              <Store size={14} className="text-[#2B71F3] shrink-0" />
              <span className="text-xs font-medium whitespace-nowrap">1× продавцам</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-dark-900/90 border border-dark-700 px-3 py-2 backdrop-blur-sm shadow-lg">
              <ShoppingBag size={14} className="text-emerald-400 shrink-0" />
              <span className="text-xs font-medium whitespace-nowrap">1× покупателям</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EscrowVisual() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:ml-auto aspect-[4/3] flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.22),transparent_55%)]" />
      <div className="relative z-10 w-36 h-36 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-2xl">
        <Shield size={56} className="text-emerald-400" />
      </div>
    </div>
  );
}

function SellVisual() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:ml-auto aspect-[4/3] flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(43,113,243,0.28),transparent_55%)]" />
      <div className="relative z-10 w-36 h-36 rounded-3xl bg-[#2B71F3]/15 border border-[#2B71F3]/30 flex items-center justify-center shadow-2xl">
        <Store size={56} className="text-[#2B71F3]" />
      </div>
    </div>
  );
}

const VISUALS = {
  contest: ContestVisual,
  escrow: EscrowVisual,
  sell: SellVisual,
};

const TONE_BG = {
  contest: 'from-[#12141c] via-[#161a28] to-[#101214]',
  escrow: 'from-[#101816] via-[#121a18] to-[#101214]',
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
  const Visual = VISUALS[slide.tone] || ContestVisual;

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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 lg:py-12">
          {slide.tone === 'contest' && (
            <div className="flex justify-center lg:justify-start mb-5 sm:mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs sm:text-sm text-dark-200">
                <Trophy size={14} className="text-amber-300" />
                Ежемесячный конкурс
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center min-h-[280px] sm:min-h-[320px]">
            <div className="order-2 lg:order-1">
              {slide.tone !== 'contest' && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs sm:text-sm text-dark-200 mb-4">
                  {slide.eyebrow}
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight leading-tight mb-3 sm:mb-4">
                {slide.title}
              </h1>
              <p className="text-dark-300 text-sm sm:text-base leading-relaxed max-w-xl mb-6">
                {slide.subtitle}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to={slide.cta.to} className="btn-primary h-11 sm:h-12 px-5 inline-flex items-center gap-2">
                  {slide.cta.label} <ArrowRight size={16} />
                </Link>
                {slide.secondary && (
                  <Link to={slide.secondary.to} className="btn-secondary h-11 sm:h-12 px-5 inline-flex items-center">
                    {slide.secondary.label}
                  </Link>
                )}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <Visual />
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 sm:mt-8 flex items-center justify-between gap-4">
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
      `}</style>
    </section>
  );
}
