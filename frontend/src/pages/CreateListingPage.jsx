import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft, X, Search, Gamepad2, Smartphone, Layers,
  Tag, Eye, EyeOff, Package, Shield, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import Seo from '../components/Seo';
import {
  resolveFeePercent,
  resolveReducedFeePercent,
  formatFeePercent,
  calcSellerReceives,
  isReducedFeeListingType,
} from '../utils/fees';
import { formatPrice } from '../utils/format';
import { LISTING_TYPE_OPTIONS } from '../utils/listingTypes';
import { listingTypeOptionsForAssortment } from '../utils/listingTypesByAssortment';
import {
  getAttributeSchema,
  validateAttributes,
  attributesToTags,
} from '../utils/listingAttributes';
import { compressImageFile } from '../utils/imageCompress';
import { resolveAssortmentItem, isExactAssortmentName } from '../utils/assortmentIcons';
import { useHiddenAssortmentKeys, useVisibleAssortment } from '../hooks/useAssortmentCatalog';
import { ASSORTMENT_TABS } from '../data/assortment';
import { categoryIdForListingType } from '../utils/listingCategoryMap';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';

const DEFAULT_FIELD = { key: 'player_id', label: 'ID / ник', required: true };
const MAX_IMAGES = 5;
const FALLBACK_ICON = '/assortment/other-apps.png';

const STEPS = [
  { id: 'game', title: 'Игры и приложения' },
  { id: 'type', title: 'Выберите раздел товаров' },
  { id: 'delivery', title: 'Способ передачи' },
  { id: 'attributes', title: 'Характеристики' },
  { id: 'images', title: 'Фото' },
  { id: 'about', title: 'О товаре' },
  { id: 'price', title: 'Цена' },
  { id: 'product', title: 'Данные товара' },
];

const TAB_ICONS = { games: Gamepad2, mobile: Smartphone, apps: Layers };

const ACCESS_OPTIONS = [
  {
    value: 'full',
    title: 'Полный доступ',
    description: 'Личный аккаунт с доступом ко всем привязкам',
  },
  {
    value: 'shared',
    title: 'Общий доступ',
    description: 'Общий аккаунт для активации подписки или входа',
  },
];

function FeeBadge({ percent, className = '' }) {
  if (percent == null) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-emerald-500/95 text-dark-950
                  text-[10px] font-bold px-1.5 py-0.5 ${className}`}
    >
      <Tag size={10} strokeWidth={2.5} />
      {formatFeePercent(percent)}
    </span>
  );
}

function ChipGroup({ label, options, value, onChange }) {
  return (
    <div>
      <p className="text-sm font-medium text-white mb-2.5">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(active ? '' : opt)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                active
                  ? 'bg-[#2B71F3] border-[#2B71F3] text-white'
                  : 'bg-dark-800/80 border-dark-700 text-dark-200 hover:border-dark-500'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function needsAccessType(listingType) {
  return ['account', 'game_account', 'clean_account', 'subscription', 'rental'].includes(listingType);
}

export default function CreateListingPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [buyerFields, setBuyerFields] = useState([DEFAULT_FIELD]);
  const [attributes, setAttributes] = useState({});
  const [images, setImages] = useState([]);
  const [compressing, setCompressing] = useState(false);
  const [assortmentTab, setAssortmentTab] = useState('games');
  const [assortmentQ, setAssortmentQ] = useState('');
  const [feeFilterOn, setFeeFilterOn] = useState(false);
  const [accessType, setAccessType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [productLogin, setProductLogin] = useState('');
  const [productPassword, setProductPassword] = useState('');
  const [productComment, setProductComment] = useState('');
  const [triedNext, setTriedNext] = useState(false);
  const { hiddenKeys } = useHiddenAssortmentKeys();
  const { byTab, items: visibleAssortment } = useVisibleAssortment();
  const [form, setForm] = useState({
    title: '',
    listing_type: '',
    category_id: '',
    game: '',
    price: '',
    original_price: '',
    description: '',
    delivery_method: 'manual',
    delivery_instructions: '',
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const { data: existing } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.get(`/listings/${id}`).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existing) return;
    setForm({
      title: existing.title || '',
      listing_type: existing.listing_type || '',
      category_id: existing.category_id || '',
      game: existing.game || '',
      price: existing.price != null ? String(existing.price) : '',
      original_price: existing.original_price != null ? String(existing.original_price) : '',
      description: existing.description || '',
      delivery_method: existing.delivery_method || 'manual',
      delivery_instructions: existing.delivery_instructions || '',
    });
    const attrs = existing.attributes && typeof existing.attributes === 'object' ? existing.attributes : {};
    setAttributes(attrs);
    if (attrs.access_type === 'Полный доступ') setAccessType('full');
    if (attrs.access_type === 'Общий доступ') setAccessType('shared');
    setImages(Array.isArray(existing.images) ? existing.images : []);
    const fields = Array.isArray(existing.buyer_fields) && existing.buyer_fields.length
      ? existing.buyer_fields
      : [DEFAULT_FIELD];
    setBuyerFields(fields);
    const instr = existing.delivery_instructions || '';
    const loginMatch = instr.match(/Логин:\s*(.+)/);
    const passMatch = instr.match(/Пароль:\s*(.+)/);
    const commentMatch = instr.match(/Комментарий:\s*([\s\S]+)/);
    if (loginMatch) setProductLogin(loginMatch[1].trim());
    if (passMatch) setProductPassword(passMatch[1].trim());
    if (commentMatch) setProductComment(commentMatch[1].trim());
  }, [existing]);

  const selectedCategory = useMemo(
    () => categories?.find((c) => String(c.id) === String(form.category_id)),
    [categories, form.category_id]
  );

  const attributeSchema = useMemo(
    () => (form.listing_type ? getAttributeSchema(form.listing_type) : []),
    [form.listing_type]
  );

  const user = useAuthStore((s) => s.user);
  const isFoundingSeller = Boolean(user?.is_founding_seller);
  const reducedFeePercent = resolveReducedFeePercent(isFoundingSeller);
  const feePercent = resolveFeePercent({
    categorySlug: selectedCategory?.slug,
    listingType: form.listing_type,
    isFoundingSeller,
  });
  const feePreview = calcSellerReceives(form.price, feePercent);

  const selectedGame = useMemo(() => resolveAssortmentItem(form.game), [form.game]);

  const tabItems = useMemo(() => byTab(assortmentTab), [byTab, assortmentTab]);
  const tabCounts = useMemo(
    () => Object.fromEntries(ASSORTMENT_TABS.map((t) => [t.id, byTab(t.id).length])),
    [byTab]
  );

  const filteredAssortment = useMemo(() => {
    const query = assortmentQ.trim().toLowerCase();
    const source = query ? visibleAssortment : tabItems;
    if (!query) return source;
    return source.filter(
      (item) =>
        item.name.toLowerCase().includes(query)
        || item.search.toLowerCase().includes(query)
    );
  }, [assortmentQ, tabItems, visibleAssortment]);

  /** When reduced-fee toggle is on: expand each app into reduced-fee listing types */
  const expandedFeeOffers = useMemo(() => {
    if (!feeFilterOn) return [];
    const offers = [];
    for (const item of filteredAssortment) {
      const types = listingTypeOptionsForAssortment(item)
        .filter((o) => isReducedFeeListingType(o.value));
      for (const type of types) {
        offers.push({ item, type });
      }
    }
    return offers;
  }, [feeFilterOn, filteredAssortment]);

  const typeOptions = useMemo(
    () => listingTypeOptionsForAssortment(form.game || selectedGame),
    [form.game, selectedGame]
  );

  const patchForm = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'listing_type' && value !== prev.listing_type) {
        setAttributes({});
        setAccessType('');
        next.category_id = categoryIdForListingType(value, categories) || prev.category_id;
      }
      return next;
    });
  };

  // Drop preselected type if it is not valid for the chosen game/app
  useEffect(() => {
    if (!form.game || !form.listing_type) return;
    const allowed = listingTypeOptionsForAssortment(form.game);
    if (!allowed.some((o) => o.value === form.listing_type)) {
      setForm((prev) => ({ ...prev, listing_type: '', category_id: '' }));
      setAttributes({});
      setAccessType('');
    }
  }, [form.game, form.listing_type]);

  const mutation = useMutation({
    mutationFn: (data) => (isEdit ? api.put(`/listings/${id}`, data) : api.post('/listings', data)),
    onSuccess: (res) => {
      toast.success(isEdit ? 'Лот обновлён!' : 'Лот опубликован!');
      navigate(`/listings/${res.data.id}`);
    },
    onError: (err) => {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Ошибка';
      toast.error(msg);
    },
  });

  const buildDeliveryInstructions = () => {
    const parts = [];
    if (productLogin.trim()) parts.push(`Логин: ${productLogin.trim()}`);
    if (productPassword.trim()) parts.push(`Пароль: ${productPassword.trim()}`);
    if (productComment.trim()) parts.push(`Комментарий: ${productComment.trim()}`);
    if (form.delivery_instructions?.trim() && !parts.length) {
      return form.delivery_instructions.trim();
    }
    return parts.join('\n') || undefined;
  };

  const validateStep = (index) => {
    const idStep = STEPS[index]?.id;
    if (idStep === 'game') {
      if (!form.game.trim() || !isExactAssortmentName(form.game, hiddenKeys)) {
        toast.error('Выберите игру, приложение или сервис');
        return false;
      }
      return true;
    }
    if (idStep === 'type') {
      if (!form.listing_type) {
        toast.error('Выберите раздел товаров');
        return false;
      }
      return true;
    }
    if (idStep === 'delivery') {
      if (!form.delivery_method) {
        toast.error('Выберите способ передачи');
        return false;
      }
      if (needsAccessType(form.listing_type) && !accessType) {
        toast.error('Выберите тип доступа');
        return false;
      }
      return true;
    }
    if (idStep === 'attributes') {
      const check = validateAttributes(form.listing_type, {
        ...attributes,
        ...(accessType
          ? { access_type: accessType === 'full' ? 'Полный доступ' : 'Общий доступ' }
          : {}),
      });
      if (!check.ok) {
        toast.error(check.error);
        return false;
      }
      return true;
    }
    if (idStep === 'about') {
      if (!form.title.trim() || form.title.trim().length < 5) {
        toast.error('Название — минимум 5 символов');
        return false;
      }
      if (!form.description.trim() || form.description.trim().length < 20) {
        toast.error('Описание — минимум 20 символов');
        return false;
      }
      return true;
    }
    if (idStep === 'price') {
      const price = parseFloat(form.price);
      if (!price || price < 1) {
        toast.error('Укажите цену');
        return false;
      }
      return true;
    }
    if (idStep === 'product') {
      if (form.delivery_method === 'auto') {
        const fields = buyerFields.map((f) => (f.label || '').trim()).filter(Boolean);
        if (!fields.length) {
          toast.error('Укажите хотя бы один атрибут покупателя');
          return false;
        }
      } else if (needsAccessType(form.listing_type)) {
        if (!productLogin.trim() || !productPassword.trim()) {
          setTriedNext(true);
          toast.error('Заполните логин и пароль');
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const skipAttributes = attributeSchema.length === 0;

  const goNext = () => {
    if (!validateStep(step)) return;
    let next = step + 1;
    if (STEPS[next]?.id === 'attributes' && skipAttributes) next += 1;
    setTriedNext(false);
    setAssortmentQ('');
    setStep(Math.min(next, STEPS.length - 1));
  };

  const goBack = () => {
    if (step === 0) {
      navigate(-1);
      return;
    }
    let prev = step - 1;
    if (STEPS[prev]?.id === 'attributes' && skipAttributes) prev -= 1;
    setTriedNext(false);
    setAssortmentQ('');
    setStep(Math.max(prev, 0));
  };

  const closeWizard = () => {
    if (window.confirm('Выйти из создания лота? Данные не сохранятся.')) {
      navigate('/');
    }
  };

  const pickGame = (item) => {
    // Select on first click; second click on the same tile advances (Далее)
    if (form.game === item.name) {
      goNext();
      return;
    }
    patchForm('game', item.name);
    setAssortmentQ('');
  };

  const pickExpandedOffer = (item, typeValue) => {
    setForm((prev) => ({
      ...prev,
      game: item.name,
      listing_type: typeValue,
      category_id: categoryIdForListingType(typeValue, categories) || prev.category_id,
    }));
    setAttributes({});
    setAccessType('');
    setAssortmentQ('');
    // Stay on flow: jump to delivery after game+type chosen via fee filter
    setStep(2);
  };

  const pickType = (value) => {
    if (form.listing_type === value) {
      goNext();
      return;
    }
    patchForm('listing_type', value);
  };

  const onPublish = () => {
    for (let i = 0; i < STEPS.length; i += 1) {
      if (STEPS[i].id === 'attributes' && skipAttributes) continue;
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }

    const mergedAttributes = {
      ...attributes,
      ...(accessType
        ? { access_type: accessType === 'full' ? 'Полный доступ' : 'Общий доступ' }
        : {}),
    };

    const fields = form.delivery_method === 'auto'
      ? buyerFields
        .map((f) => ({
          key: f.key || undefined,
          label: (f.label || '').trim(),
          required: f.required !== false,
        }))
        .filter((f) => f.label)
      : [];

    const categoryId = form.category_id
      || categoryIdForListingType(form.listing_type, categories)
      || undefined;

    mutation.mutate({
      title: form.title.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      game: form.game.trim(),
      listing_type: form.listing_type,
      category_id: categoryId || undefined,
      delivery_method: form.delivery_method,
      delivery_instructions: buildDeliveryInstructions(),
      buyer_fields: fields,
      attributes: mergedAttributes,
      images,
      tags: attributesToTags(mergedAttributes),
    });
  };

  const onPickImages = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`Максимум ${MAX_IMAGES} фото`);
      return;
    }
    setCompressing(true);
    try {
      const next = [];
      for (const file of files.slice(0, room)) {
        // eslint-disable-next-line no-await-in-loop
        const dataUrl = await compressImageFile(file);
        next.push(dataUrl);
      }
      setImages((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
    } catch (err) {
      toast.error(err.message || 'Не удалось загрузить фото');
    } finally {
      setCompressing(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;
  const stepId = STEPS[step].id;
  const typeLabel = LISTING_TYPE_OPTIONS.find((o) => o.value === form.listing_type)?.label;
  const canPrimary = (() => {
    if (stepId === 'game') return Boolean(form.game);
    if (stepId === 'type') return Boolean(form.listing_type);
    if (stepId === 'delivery') {
      if (needsAccessType(form.listing_type) && !accessType) return false;
      return Boolean(form.delivery_method);
    }
    if (stepId === 'images') return true;
    if (stepId === 'about') {
      return form.title.trim().length >= 5 && form.description.trim().length >= 20;
    }
    if (stepId === 'price') return parseFloat(form.price) >= 1;
    if (stepId === 'product') {
      if (form.delivery_method === 'auto') {
        return buyerFields.some((f) => (f.label || '').trim());
      }
      if (needsAccessType(form.listing_type)) {
        return Boolean(productLogin.trim() && productPassword.trim());
      }
      return true;
    }
    if (stepId === 'attributes') {
      return validateAttributes(form.listing_type, attributes).ok;
    }
    return true;
  })();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark-950 flex flex-col">
      <Seo
        title={isEdit ? 'Редактирование лота' : 'Разместить лот'}
        path={isEdit ? `/listings/${id}/edit` : '/listings/create'}
        noindex
      />

      <div className="sticky top-0 lg:top-20 z-40 bg-dark-950/95 backdrop-blur">
        <div className={PAGE_WIDTH_CLASS}>
          <div className="h-12 flex items-center gap-2">
            <button type="button" onClick={goBack} className="btn-ghost p-2 -ml-2" aria-label="Назад">
              <ChevronLeft size={20} />
            </button>
            <h1 className="flex-1 text-center text-[15px] font-semibold truncate">
              {stepId === 'images' ? `Фото ${images.length}/${MAX_IMAGES}` : STEPS[step].title}
            </h1>
            <button type="button" onClick={closeWizard} className="btn-ghost p-2 -mr-2" aria-label="Закрыть">
              <X size={20} />
            </button>
          </div>
          <div className="h-1 overflow-hidden">
            <div className="h-full bg-[#2B71F3] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className={`flex-1 ${PAGE_WIDTH_CLASS} w-full py-4 pb-28`}>
        {/* Context chip after game picked */}
        {step > 0 && selectedGame && (
          <div className="flex items-center gap-3 mb-3">
            <img
              src={selectedGame.icon || FALLBACK_ICON}
              alt=""
              className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10"
              onError={(e) => { e.currentTarget.src = FALLBACK_ICON; }}
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white truncate">{selectedGame.name}</p>
              {stepId !== 'type' && typeLabel && (
                <p className="text-xs text-dark-400 truncate">{typeLabel}</p>
              )}
            </div>
            {stepId !== 'type' && form.listing_type && (
              <FeeBadge percent={feePercent} />
            )}
          </div>
        )}

        {/* STEP: game */}
        {stepId === 'game' && (
          <div>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                className="input pl-10 h-11 rounded-full"
                placeholder="Поиск игр и приложений"
                value={assortmentQ}
                onChange={(e) => setAssortmentQ(e.target.value)}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto mb-3" style={{ scrollbarWidth: 'none' }}>
              {ASSORTMENT_TABS.map((tab) => {
                const active = assortmentTab === tab.id;
                const Icon = TAB_ICONS[tab.id] || Layers;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { setAssortmentTab(tab.id); setAssortmentQ(''); }}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150 ${
                      active
                        ? 'bg-[#2B71F3] text-white'
                        : 'bg-dark-900 text-dark-300 border border-dark-800 hover:bg-[#2B71F3]/25 hover:border-[#2B71F3]/60 hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                    <span className={`text-xs ${active ? 'text-white/70' : 'text-dark-500'}`}>
                      {tabCounts[tab.id] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5 mb-4 px-0.5">
              <div className="flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
                <Tag size={14} />
                Платёж {formatFeePercent(reducedFeePercent)}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={feeFilterOn}
                aria-label={`Показать типы лотов с комиссией ${formatFeePercent(reducedFeePercent)}`}
                onClick={() => setFeeFilterOn((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  feeFilterOn ? 'bg-[#2B71F3]' : 'bg-dark-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    feeFilterOn ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {feeFilterOn ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3 sm:gap-4">
                {expandedFeeOffers.map(({ item, type }) => {
                  const selected = form.game === item.name && form.listing_type === type.value;
                  return (
                  <button
                    key={`${item.name}:${type.value}`}
                    type="button"
                    onClick={() => pickExpandedOffer(item, type.value)}
                    className="flex flex-col items-center gap-1.5 group text-left"
                  >
                    <div
                      className={`relative w-full aspect-square rounded-2xl overflow-hidden bg-dark-800
                                 transition-all duration-150 group-active:scale-95 ${
                                   selected
                                     ? 'ring-2 ring-[#2B71F3] shadow-[0_0_0_3px_rgba(43,113,243,0.35)]'
                                     : 'ring-1 ring-white/10 group-hover:ring-2 group-hover:ring-[#2B71F3] group-hover:shadow-[0_0_0_3px_rgba(43,113,243,0.35)]'
                                 }`}
                    >
                      <img
                        src={item.icon || FALLBACK_ICON}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = FALLBACK_ICON; }}
                      />
                      <span className="absolute top-0 left-0">
                        <FeeBadge percent={reducedFeePercent} className="rounded-none rounded-br-md" />
                      </span>
                    </div>
                    <span className={`text-[11px] text-center line-clamp-1 leading-tight w-full font-medium transition-colors ${
                      selected ? 'text-[#8EB6FF]' : 'text-white group-hover:text-[#8EB6FF]'
                    }`}>
                      {item.name}
                    </span>
                    <span className="text-[10px] text-dark-400 text-center line-clamp-1 leading-tight w-full">
                      {type.label}
                    </span>
                  </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3 sm:gap-4">
                {filteredAssortment.map((item) => {
                  const selected = form.game === item.name;
                  return (
                  <button
                    key={`${item.kind}-${item.name}`}
                    type="button"
                    onClick={() => pickGame(item)}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div
                      className={`relative w-full aspect-square rounded-2xl overflow-hidden bg-dark-800
                                 transition-all duration-150 group-active:scale-95 ${
                                   selected
                                     ? 'ring-2 ring-[#2B71F3] shadow-[0_0_0_3px_rgba(43,113,243,0.35)]'
                                     : 'ring-1 ring-white/10 group-hover:ring-2 group-hover:ring-[#2B71F3] group-hover:shadow-[0_0_0_3px_rgba(43,113,243,0.35)]'
                                 }`}
                    >
                      <img
                        src={item.icon || FALLBACK_ICON}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = FALLBACK_ICON; }}
                      />
                    </div>
                    <span className={`text-[11px] text-center line-clamp-2 leading-tight w-full transition-colors ${
                      selected ? 'text-[#8EB6FF] font-medium' : 'text-dark-300 group-hover:text-[#8EB6FF]'
                    }`}>
                      {item.name}
                    </span>
                  </button>
                  );
                })}
              </div>
            )}
            {!!(feeFilterOn ? expandedFeeOffers.length : filteredAssortment.length) && (
              <p className="text-center text-dark-500 text-xs mt-4">
                {(feeFilterOn ? expandedFeeOffers.length : filteredAssortment.length).toLocaleString('ru-RU')}{' '}
                {feeFilterOn ? 'вариантов' : 'позиций'}
                {form.game && stepId === 'game' ? ' · нажмите «Далее» или ещё раз по выбранной иконке' : ''}
              </p>
            )}
            {!(feeFilterOn ? expandedFeeOffers.length : filteredAssortment.length) && (
              <p className="text-center text-dark-400 text-sm py-10">Ничего не найдено</p>
            )}
          </div>
        )}

        {/* STEP: type */}
        {stepId === 'type' && (
          <div>
            <div className="flex flex-col gap-1">
              {typeOptions.map((opt) => {
                const active = form.listing_type === opt.value;
                const reduced = isReducedFeeListingType(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => pickType(opt.value)}
                    className={`sell-type-row group flex items-center gap-3 w-full px-4 py-3.5 text-left rounded-xl transition-colors duration-150 ${
                      active ? 'is-active' : ''
                    }`}
                  >
                    <span className="sell-type-label min-w-0 flex-1 text-xl sm:text-2xl font-semibold">
                      {opt.label}
                    </span>
                    {reduced && <FeeBadge percent={reducedFeePercent} />}
                    <span
                      className={`sell-type-radio w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                        active ? 'is-active' : ''
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP: delivery */}
        {stepId === 'delivery' && (
          <div className="flex flex-col gap-3">
            {needsAccessType(form.listing_type) && (
              <>
                {ACCESS_OPTIONS.map((opt) => {
                  const active = accessType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAccessType(opt.value)}
                      className={`flex items-start gap-3 w-full rounded-2xl px-4 py-3.5 text-left border ${
                        active ? 'border-[#2B71F3] bg-[#2B71F3]/10' : 'border-dark-800 bg-dark-900'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">{opt.title}</p>
                        <p className="text-sm text-dark-400 mt-0.5">{opt.description}</p>
                      </div>
                      <span
                        className={`mt-1 w-5 h-5 rounded-full border-2 shrink-0 ${
                          active ? 'border-[#2B71F3] bg-[#2B71F3]' : 'border-dark-600'
                        }`}
                      />
                    </button>
                  );
                })}
                <div className="h-px bg-dark-800 my-1" />
              </>
            )}

            {[
              {
                value: 'manual',
                title: 'Вручную через чат',
                description: 'Передадите товар покупателю в чате сделки после оплаты',
              },
              {
                value: 'auto',
                title: 'Автовыдача',
                description: 'Покупатель укажет данные, товар выдаётся по инструкции',
              },
            ].map((opt) => {
              const active = form.delivery_method === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => patchForm('delivery_method', opt.value)}
                  className={`flex items-start gap-3 w-full rounded-2xl px-4 py-3.5 text-left border ${
                    active ? 'border-[#2B71F3] bg-[#2B71F3]/10' : 'border-dark-800 bg-dark-900'
                  }`}
                >
                  <Package size={18} className="text-dark-300 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{opt.title}</p>
                    <p className="text-sm text-dark-400 mt-0.5">{opt.description}</p>
                  </div>
                  <span
                    className={`mt-1 w-5 h-5 rounded-full border-2 shrink-0 ${
                      active ? 'border-[#2B71F3] bg-[#2B71F3]' : 'border-dark-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* STEP: attributes */}
        {stepId === 'attributes' && (
          <div className="flex flex-col gap-5">
            {attributeSchema.map((group) => (
              <ChipGroup
                key={group.key}
                label={group.label}
                options={group.options}
                value={attributes[group.key] || ''}
                onChange={(v) => setAttributes((prev) => ({ ...prev, [group.key]: v }))}
              />
            ))}
          </div>
        )}

        {/* STEP: images */}
        {stepId === 'images' && (
          <div className="flex flex-col items-center">
            <label className="w-full max-w-sm aspect-[4/3] rounded-2xl border border-dashed border-dark-600
                              bg-dark-900 flex flex-col items-center justify-center gap-3 cursor-pointer
                              hover:border-[#2B71F3]/50 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={onPickImages}
                disabled={compressing || images.length >= MAX_IMAGES}
              />
              <div className="w-14 h-14 rounded-full bg-dark-800 flex items-center justify-center text-[#2B71F3]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
                  <path d="M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
                </svg>
              </div>
              <span className="text-[#2B71F3] font-medium">
                {compressing ? 'Сжимаем…' : 'Загрузить'}
              </span>
            </label>
            <p className="text-sm text-dark-400 mt-4 text-center">
              Загрузите фото 4:3 в порядке выбора на устройстве
            </p>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 w-full mt-5">
                {images.map((src, i) => (
                  <div key={`${i}-${src.slice(0, 24)}`} className="relative aspect-[4/3] rounded-xl overflow-hidden">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP: about */}
        {stepId === 'about' && (
          <div className="flex flex-col gap-3">
            <input
              className="input h-12"
              placeholder="Название товара"
              value={form.title}
              onChange={(e) => patchForm('title', e.target.value)}
            />
            <textarea
              className="input min-h-[160px] resize-none py-3"
              placeholder="Описание товара"
              value={form.description}
              onChange={(e) => patchForm('description', e.target.value)}
            />
          </div>
        )}

        {/* STEP: price */}
        {stepId === 'price' && (
          <div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
              <div className="rounded-2xl bg-dark-900 border border-dark-800 px-4 py-3">
                <p className="text-xs text-dark-400 mb-1">Цена товара</p>
                <div className="flex items-baseline gap-1">
                  <input
                    className="bg-transparent text-2xl font-bold text-white w-full outline-none"
                    inputMode="decimal"
                    placeholder="0"
                    value={form.price}
                    onChange={(e) => patchForm('price', e.target.value.replace(/[^\d.]/g, ''))}
                  />
                  <span className="text-dark-400 shrink-0">₽</span>
                </div>
              </div>
              <div className="flex items-center text-dark-500 px-0.5">↔</div>
              <div className="rounded-2xl bg-dark-900 border border-dark-800 px-4 py-3">
                <p className="text-xs text-dark-400 mb-1">Доход</p>
                <p className="text-2xl font-bold text-emerald-400 truncate">
                  {form.price ? Math.round(feePreview.sellerReceives) : '—'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
              <Tag size={14} />
              Платёж {formatFeePercent(feePercent)}
            </div>
            <p className="text-xs text-dark-500 mt-2">
              Комиссия площадки удерживается при выплате. За вывод средств комиссию не берём.
            </p>
          </div>
        )}

        {/* STEP: product data */}
        {stepId === 'product' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl bg-dark-900 border border-dark-800 px-4 py-3">
              <p className="text-sm font-medium text-white flex items-center gap-2 mb-1">
                <Package size={16} /> Способ передачи
              </p>
              <p className="text-sm text-white">
                {form.delivery_method === 'auto' ? 'Автовыдача' : 'Вручную через чат'}
                {accessType ? ` · ${accessType === 'full' ? 'Полный доступ' : 'Общий доступ'}` : ''}
              </p>
              <p className="text-xs text-dark-400 mt-0.5">
                {form.delivery_method === 'auto'
                  ? 'Покупатель заполнит поля при покупке'
                  : 'Передадите данные в чате после оплаты'}
              </p>
            </div>

            {form.delivery_method === 'auto' ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-dark-300">Что должен указать покупатель</p>
                {buyerFields.map((field, idx) => (
                  <input
                    key={idx}
                    className="input"
                    placeholder="Например: ID / ник"
                    value={field.label}
                    onChange={(e) => {
                      const next = [...buyerFields];
                      next[idx] = { ...next[idx], label: e.target.value };
                      setBuyerFields(next);
                    }}
                  />
                ))}
                {buyerFields.length < 5 && (
                  <button
                    type="button"
                    className="btn-ghost text-sm self-start"
                    onClick={() => setBuyerFields((prev) => [...prev, { key: `field_${prev.length}`, label: '', required: true }])}
                  >
                    + Поле
                  </button>
                )}
              </div>
            ) : (
              <>
                <div>
                  <input
                    className={`input ${triedNext && !productLogin.trim() ? 'border-red-500/60 bg-red-500/10' : ''}`}
                    placeholder="Логин"
                    value={productLogin}
                    onChange={(e) => setProductLogin(e.target.value)}
                    autoComplete="off"
                  />
                  {triedNext && !productLogin.trim() && needsAccessType(form.listing_type) && (
                    <p className="text-xs text-red-400 mt-1">Обязательное поле</p>
                  )}
                </div>
                <div className="relative">
                  <input
                    className={`input pr-10 ${triedNext && !productPassword.trim() ? 'border-red-500/60 bg-red-500/10' : ''}`}
                    placeholder="Пароль"
                    type={showPassword ? 'text' : 'password'}
                    value={productPassword}
                    onChange={(e) => setProductPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {triedNext && !productPassword.trim() && needsAccessType(form.listing_type) && (
                    <p className="text-xs text-red-400 mt-1">Обязательное поле</p>
                  )}
                </div>
                <textarea
                  className="input min-h-[88px] resize-none py-3"
                  placeholder="Комментарий"
                  value={productComment}
                  onChange={(e) => setProductComment(e.target.value)}
                />
              </>
            )}

            <button type="button" className="flex items-center gap-2 text-sm text-yellow-400/90 self-start mt-1">
              <Shield size={14} /> Данные защищены
            </button>

            <div className="rounded-2xl bg-dark-900 border border-dark-800 px-4 py-3 mt-1">
              <p className="text-sm font-medium text-white flex items-center gap-2 mb-2">
                <Info size={14} /> Инструкция после продажи
              </p>
              <ul className="text-sm text-[#5B8CFF] space-y-1.5 list-disc pl-4">
                <li>Удержание средств: оплата держится на стороне площадки до подтверждения.</li>
                <li>Выполнение заказа: откройте чат сделки и передайте товар покупателю.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-dark-950/95 backdrop-blur border-t border-dark-800 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className={`${PAGE_WIDTH_CLASS} py-3`}>
          {stepId === 'product' ? (
            <button
              type="button"
              onClick={onPublish}
              disabled={mutation.isPending || !canPrimary}
              className="w-full h-12 rounded-2xl font-semibold text-white transition-colors disabled:opacity-40
                         bg-[#2B71F3] hover:bg-[#3d7ff5]"
            >
              {mutation.isPending ? 'Публикуем…' : isEdit ? 'Сохранить' : 'Опубликовать'}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={stepId === 'images' ? false : !canPrimary}
              className="w-full h-12 rounded-2xl font-semibold text-white transition-colors disabled:opacity-40
                         disabled:bg-dark-700 bg-[#2B71F3] hover:bg-[#3d7ff5]"
            >
              Далее
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
