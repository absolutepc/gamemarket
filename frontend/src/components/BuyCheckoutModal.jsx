import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X, ArrowLeft, Package, Lock, Info, MessageCircle, Check, Wallet, CreditCard, Globe, Bitcoin,
} from 'lucide-react';
import { formatPrice } from '../utils/format';

const PAYMENT_METHODS = [
  {
    id: 'balance',
    label: 'Баланс Lootz',
    hint: 'Оплата с баланса площадки',
    Icon: Wallet,
    accent: '#2B71F3',
  },
  {
    id: 'sbp',
    label: 'СБП',
    hint: 'Система быстрых платежей',
    Icon: null,
    badge: 'СБП',
    badgeClass: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
    soon: true,
  },
  {
    id: 'card',
    label: 'Банковская карта',
    hint: 'Visa / Mastercard / МИР',
    Icon: CreditCard,
    accent: '#3B82F6',
    soon: true,
  },
  {
    id: 'foreign',
    label: 'Иностранная карта',
    hint: 'Карты зарубежных банков',
    Icon: Globe,
    accent: '#60A5FA',
    soon: true,
  },
  {
    id: 'crypto',
    label: 'Криптовалюта',
    hint: 'BTC, ETH и другие',
    Icon: Bitcoin,
    accent: '#F7931A',
    soon: true,
  },
];

export default function BuyCheckoutModal({
  open,
  onClose,
  listing,
  buyerFields = [],
  user,
  onConfirm,
  isPending = false,
}) {
  const [step, setStep] = useState(1);
  const [buyerData, setBuyerData] = useState({});
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('balance');
  const [fieldError, setFieldError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    setStep(1);
    setBuyerData({});
    setComment('');
    setPaymentMethod('balance');
    setFieldError('');
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || !listing) return null;

  const isAuto = listing.delivery_method === 'auto';
  const primaryField = buyerFields[0];
  const deliveryTitle = isAuto
    ? (primaryField?.label || 'ID игрока')
    : 'Вручную от продавца';
  const deliveryHint = isAuto
    ? 'Донат / выдача по данным (без входа в аккаунт)'
    : 'Продавец передаст товар в чате сделки';

  const validateStep1 = () => {
    if (!isAuto) return true;
    for (const field of buyerFields) {
      if (field.required === false) continue;
      if (!String(buyerData[field.key] || '').trim()) {
        setFieldError(`Укажите: ${field.label}`);
        return false;
      }
    }
    setFieldError('');
    return true;
  };

  const goNext = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const handlePay = () => {
    if (paymentMethod !== 'balance') return;
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    onConfirm?.({ buyerData, comment: comment.trim() });
  };

  const balanceOk = user && parseFloat(user.balance) >= parseFloat(listing.price);
  const selected = PAYMENT_METHODS.find((m) => m.id === paymentMethod);

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label="Закрыть"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-md bg-[#1a1b20] sm:rounded-2xl rounded-t-2xl border border-dark-700/80
                      shadow-2xl shadow-black/50 max-h-[92vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1a1b20] px-4 pt-4 pb-3 border-b border-dark-800/80">
          <div className="flex items-center justify-between mb-3">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
                aria-label="Назад"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <div className="w-9" />
            )}
            <h2 className="text-base font-semibold">{step === 1 ? 'Получение' : 'Оплата'}</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
              aria-label="Закрыть"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex gap-2">
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-[#2B71F3]' : 'bg-dark-700'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#2B71F3]' : 'bg-dark-700'}`} />
          </div>
        </div>

        {step === 1 ? (
          <div className="px-4 py-4 space-y-4">
            {/* Delivery method */}
            <div className="rounded-xl bg-dark-800/80 border border-dark-700/60 p-3.5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3d2e1f] flex items-center justify-center shrink-0">
                <Package size={18} className="text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">Способ получения</div>
                <div className="text-xs text-dark-300 mt-0.5">
                  <span className="text-white/90">{deliveryTitle}</span>
                  <span className="text-dark-500"> · </span>
                  {deliveryHint}
                </div>
              </div>
            </div>

            {isAuto && buyerFields.map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium mb-1.5 block">
                  {field.label}
                  {field.required !== false ? '' : ' (необязательно)'}
                </label>
                <input
                  className="input bg-[#121318] border-dark-700"
                  placeholder={field.placeholder || field.label}
                  value={buyerData[field.key] || ''}
                  onChange={(e) => {
                    setBuyerData((prev) => ({ ...prev, [field.key]: e.target.value }));
                    setFieldError('');
                  }}
                  maxLength={200}
                  autoFocus={field === buyerFields[0]}
                />
              </div>
            ))}

            <div>
              <label className="sr-only">Комментарий продавцу</label>
              <textarea
                className="input bg-[#121318] border-dark-700 min-h-[88px] resize-none"
                placeholder="Комментарий продавцу"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
              />
            </div>

            {fieldError && (
              <p className="text-rose-400 text-sm">{fieldError}</p>
            )}

            <button
              type="button"
              className="w-full flex items-center gap-2 text-sm text-dark-300 hover:text-white transition-colors py-1"
            >
              <Lock size={14} className="text-amber-400" />
              <span>Данные защищены</span>
            </button>

            <div className="rounded-xl bg-dark-800/50 border border-dark-800 p-4 space-y-3">
              <div className="text-sm font-medium">Вы получите после оплаты</div>
              {[
                { Icon: Lock, color: 'text-amber-400', text: 'Данные товара' },
                { Icon: Info, color: 'text-[#2B71F3]', text: 'Инструкция после покупки' },
                { Icon: MessageCircle, color: 'text-white', text: 'Будет доступен чат с продавцом' },
              ].map(({ Icon, color, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-dark-200">
                  <Icon size={16} className={color} />
                  {text}
                </div>
              ))}
            </div>

            <button type="button" onClick={goNext} className="btn-primary w-full h-12 text-base rounded-xl">
              Далее
            </button>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            <div className="rounded-xl overflow-hidden border border-dark-800 divide-y divide-dark-800">
              {PAYMENT_METHODS.map((method) => {
                const active = paymentMethod === method.id;
                const Icon = method.Icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className="w-full flex items-center gap-3 px-3.5 py-3.5 text-left hover:bg-dark-800/60 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        method.badgeClass || 'bg-dark-800'
                      }`}
                      style={!method.badgeClass && method.accent ? { backgroundColor: `${method.accent}22` } : undefined}
                    >
                      {method.badge ? (
                        <span className="text-[10px] font-extrabold text-white tracking-tight">{method.badge}</span>
                      ) : (
                        <Icon size={18} style={{ color: method.accent }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium flex items-center gap-2">
                        {method.label}
                        {method.soon && (
                          <span className="text-[10px] uppercase tracking-wide text-dark-500 font-semibold">скоро</span>
                        )}
                      </div>
                      <div className="text-xs text-dark-400 truncate">
                        {method.id === 'balance'
                          ? `Доступно: ${formatPrice(user?.balance || 0)}`
                          : method.hint}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        active ? 'border-[#2B71F3] bg-[#2B71F3]' : 'border-dark-600'
                      }`}
                    >
                      {active && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {selected?.soon ? (
              <p className="text-xs text-dark-400 text-center">
                Этот способ оплаты скоро появится. Сейчас доступна оплата с баланса —{' '}
                <Link to="/wallet" className="text-[#2B71F3] hover:underline" onClick={onClose}>
                  пополнить
                </Link>
                .
              </p>
            ) : (
              <p className="text-xs text-dark-400 text-center">
                Средства спишутся с баланса и будут удержаны в эскроу до подтверждения сделки
              </p>
            )}

            {!balanceOk && paymentMethod === 'balance' && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 text-sm text-rose-300">
                Недостаточно средств.{' '}
                <Link to="/wallet" className="underline" onClick={onClose}>Пополнить баланс</Link>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1 pb-1">
              <div className="flex-1 min-w-0">
                <div className="text-xl font-bold leading-none">{formatPrice(listing.price)}</div>
                <div className="text-xs text-dark-400 mt-1.5 flex items-center gap-1">
                  🛒 Покупка
                </div>
              </div>
              <button
                type="button"
                onClick={handlePay}
                disabled={
                  isPending
                  || selected?.soon
                  || (paymentMethod === 'balance' && !balanceOk)
                }
                className="btn-primary h-12 px-5 rounded-xl text-sm sm:text-base shrink-0 disabled:opacity-50"
              >
                {isPending ? 'Обработка...' : 'Перейти к оплате'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
