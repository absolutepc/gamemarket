import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, ShoppingBag, Store, ArrowRight, Shield,
} from 'lucide-react';
import { PAGE_WIDTH_CLASS } from './ListingCard';

const AUTO_MS = 7000;

const SLIDES = [
  {
    id: 'contest',
    eyebrow: 'Ежемесячный конкурс',
    title: 'MacBook Air 15″ 256 ГБ',
    subtitle:
      'Каждый месяц разыгрываем два ноутбука: один среди продавцов и один среди покупателей. Участвуйте в сделках на Lootz — чем активнее месяц, тем выше шанс.',
    cta: { to: '/catalog', label: 'Участвовать' },
    secondary: { to: '/listings/create', label: 'Стать продавцом' },
    tone: 'contest',
  },
  {
    id: 'escrow',
    eyebrow: 'Безопасные сделки',
    title: 'Эскроу защищает обе стороны',
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
];

function ContestVisual() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(43,113,243,0.35),transparent_55%)] pointer-events-none" />
      <div className="relative z-10 w-[70%] max-w-[260px] sm:max-w-[300px] flex flex-col items-center">
        <img
          src="/banners/macbook-air-15.webp"
          alt="MacBook Air 15″ — приз конкурса"
          className="w-full h-auto max-h-[160px] sm:max-h-[190px] object-contain drop-shadow-[0_16px_40px_rgba(0,0,0,0.5)] select-none pointer-events-none"
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

function EscrowVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.22),transparent_55%)]" />
      <div className="relative z-10 w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-2xl">
        <Shield size={48} className="text-emerald-400 sm:w-14 sm:h-14" />
      </div>
    </div>
  );
}

function SellVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(43,113,243,0.28),transparent_55%)]" />
      <div className="relative z-10 w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-[#2B71F3]/15 border border-[#2B71F3]/30 flex items-center justify-center shadow-2xl">
        <Store size={48} className="text-[#2B71F3] sm:w-14 sm:h-14" />
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

        <div className={`relative ${PAGE_WIDTH_CLASS} py-5 sm:py-7 lg:py-8
                        h-[520px] sm:h-[480px] lg:h-[420px] flex flex-col`}>
          <div className="flex-1 grid lg:grid-cols-2 gap-4 lg:gap-10 items-center min-h-0">
            <div className="order-2 lg:order-1 min-h-0 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs sm:text-sm text-dark-200 mb-2.5 sm:mb-3 w-fit">
                {slide.tone === 'contest' ? (
                  <>
                    <Trophy size={14} className="text-amber-300" />
                    {slide.eyebrow}
                  </>
                ) : (
                  slide.eyebrow
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight leading-tight mb-2 sm:mb-3">
                {slide.title}
              </h1>
              <p className="text-dark-300 text-sm sm:text-base leading-relaxed max-w-xl mb-4 sm:mb-5 line-clamp-4">
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

            <div className="order-1 lg:order-2 h-[200px] sm:h-[220px] lg:h-full min-h-0 flex items-center">
              {Visual ? <Visual /> : null}
            </div>
          </div>

          <div className="mt-4 sm:mt-5 flex items-center justify-between gap-4 shrink-0">
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
