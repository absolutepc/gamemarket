import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Trash2, ChevronLeft, ChevronRight, ImagePlus, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Seo from '../components/Seo';
import AssortmentPicker from '../components/AssortmentPicker';
import { resolveFeePercent, formatFeePercent, calcSellerReceives } from '../utils/fees';
import { formatPrice } from '../utils/format';
import { LISTING_TYPE_OPTIONS } from '../utils/listingTypes';
import {
  getAttributeSchema,
  validateAttributes,
  attributesToTags,
} from '../utils/listingAttributes';
import { compressImageFile } from '../utils/imageCompress';
import { resolveAssortmentItem, isExactAssortmentName } from '../utils/assortmentIcons';
import { useHiddenAssortmentKeys } from '../hooks/useAssortmentCatalog';

const DEFAULT_FIELD = { key: 'player_id', label: 'ID / ник', required: true };
const STEPS = [
  { id: 'basics', title: 'Основное' },
  { id: 'attributes', title: 'Характеристики' },
  { id: 'images', title: 'Фото' },
  { id: 'details', title: 'Публикация' },
];
const MAX_IMAGES = 5;

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

export default function CreateListingPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [buyerFields, setBuyerFields] = useState([DEFAULT_FIELD]);
  const [attributes, setAttributes] = useState({});
  const [images, setImages] = useState([]);
  const [compressing, setCompressing] = useState(false);
  const { hiddenKeys } = useHiddenAssortmentKeys();
  const [form, setForm] = useState({
    title: '',
    listing_type: 'subscription',
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
      listing_type: existing.listing_type || 'subscription',
      category_id: existing.category_id || '',
      game: existing.game || '',
      price: existing.price != null ? String(existing.price) : '',
      original_price: existing.original_price != null ? String(existing.original_price) : '',
      description: existing.description || '',
      delivery_method: existing.delivery_method || 'manual',
      delivery_instructions: existing.delivery_instructions || '',
    });
    setAttributes(existing.attributes && typeof existing.attributes === 'object' ? existing.attributes : {});
    setImages(Array.isArray(existing.images) ? existing.images : []);
    const fields = Array.isArray(existing.buyer_fields) && existing.buyer_fields.length
      ? existing.buyer_fields
      : [DEFAULT_FIELD];
    setBuyerFields(fields);
  }, [existing]);

  const selectedCategory = useMemo(
    () => categories?.find((c) => String(c.id) === String(form.category_id)),
    [categories, form.category_id]
  );

  const attributeSchema = useMemo(
    () => getAttributeSchema(form.listing_type),
    [form.listing_type]
  );

  const feePercent = resolveFeePercent({
    categorySlug: selectedCategory?.slug,
    listingType: form.listing_type,
  });
  const feePreview = calcSellerReceives(form.price, feePercent);
  const discountPreview = form.original_price && form.price
    && parseFloat(form.original_price) > parseFloat(form.price)
    ? Math.round(((parseFloat(form.original_price) - parseFloat(form.price)) / parseFloat(form.original_price)) * 100)
    : 0;

  const patchForm = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'listing_type' && value !== prev.listing_type) {
        setAttributes({});
      }
      return next;
    });
  };

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

  const validateStep = (index) => {
    if (index === 0) {
      if (!form.title.trim() || form.title.trim().length < 5) {
        toast.error('Заголовок — минимум 5 символов');
        return false;
      }
      if (!form.listing_type) {
        toast.error('Выберите тип лота');
        return false;
      }
      if (!form.game.trim() || !isExactAssortmentName(form.game, hiddenKeys)) {
        toast.error('Выберите игру, приложение или сервис из списка');
        return false;
      }
      const price = parseFloat(form.price);
      if (!price || price < 1) {
        toast.error('Укажите цену');
        return false;
      }
      return true;
    }
    if (index === 1) {
      const check = validateAttributes(form.listing_type, attributes);
      if (!check.ok) {
        toast.error(check.error);
        return false;
      }
      return true;
    }
    if (index === 3) {
      if (!form.description.trim() || form.description.trim().length < 20) {
        toast.error('Описание — минимум 20 символов');
        return false;
      }
      if (form.delivery_method === 'auto') {
        const fields = buyerFields.map((f) => (f.label || '').trim()).filter(Boolean);
        if (!fields.length) {
          toast.error('Укажите хотя бы один атрибут покупателя');
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    if (step === 0) {
      navigate(-1);
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const onPublish = () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(3)) return;

    const fields = form.delivery_method === 'auto'
      ? buyerFields
        .map((f) => ({
          key: f.key || undefined,
          label: (f.label || '').trim(),
          required: f.required !== false,
        }))
        .filter((f) => f.label)
      : [];

    mutation.mutate({
      title: form.title.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      game: form.game.trim(),
      listing_type: form.listing_type,
      category_id: form.category_id || undefined,
      delivery_method: form.delivery_method,
      delivery_instructions: form.delivery_instructions || undefined,
      buyer_fields: fields,
      attributes,
      images,
      tags: attributesToTags(attributes),
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

  const selectedGame = useMemo(() => resolveAssortmentItem(form.game), [form.game]);

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Seo
        title={isEdit ? 'Редактирование лота' : 'Разместить лот'}
        path={isEdit ? `/listings/${id}/edit` : '/listings/create'}
        noindex
      />

      <div className="flex items-center gap-3 mb-4">
        <button type="button" onClick={goBack} className="btn-ghost p-2 -ml-2" aria-label="Назад">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold">{STEPS[step].title}</h1>
          <p className="text-[11px] text-dark-500 mt-0.5">
            Шаг {step + 1} из {STEPS.length}
            {form.game ? ` · ${form.game}` : ''}
          </p>
        </div>
        <div className="w-9" />
      </div>

      <div className="h-1 rounded-full bg-dark-800 mb-6 overflow-hidden">
        <div className="h-full bg-[#2B71F3] transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="card p-5 sm:p-6">
        {step === 0 && (
          <div className="flex flex-col gap-5">
            <AssortmentPicker
              value={form.game}
              onChange={(name) => patchForm('game', name)}
              required
            />

            <div>
              <label className="text-sm font-medium mb-1.5 block">Заголовок *</label>
              <input
                className="input"
                placeholder="Например: Cursor Pro 1 месяц"
                value={form.title}
                onChange={(e) => patchForm('title', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Тип лота *</label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                {LISTING_TYPE_OPTIONS.map((opt) => {
                  const active = form.listing_type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => patchForm('listing_type', opt.value)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        active
                          ? 'bg-[#2B71F3] border-[#2B71F3] text-white'
                          : 'bg-dark-800/80 border-dark-700 text-dark-200 hover:border-dark-500'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
                {isEdit && existing?.listing_type === 'giftcard' && (
                  <button
                    type="button"
                    onClick={() => patchForm('listing_type', 'giftcard')}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      form.listing_type === 'giftcard'
                        ? 'bg-[#2B71F3] border-[#2B71F3] text-white'
                        : 'bg-dark-800/80 border-dark-700 text-dark-200'
                    }`}
                  >
                    Подарочная карта
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Категория</label>
              <select
                className="input"
                value={form.category_id}
                onChange={(e) => patchForm('category_id', e.target.value)}
              >
                <option value="">Без категории</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Цена (₽) *</label>
                <input
                  className="input"
                  type="number"
                  placeholder="500"
                  min="1"
                  value={form.price}
                  onChange={(e) => patchForm('price', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Старая цена</label>
                <input
                  className="input"
                  type="number"
                  placeholder="990"
                  min="1"
                  value={form.original_price}
                  onChange={(e) => patchForm('original_price', e.target.value)}
                />
                {discountPreview > 0 && (
                  <p className="text-rose-400 text-xs mt-1">Скидка {discountPreview}%</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-dark-800 bg-dark-950/60 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-dark-300">Комиссия площадки</span>
                <span className="font-semibold text-white">{formatFeePercent(feePercent)}</span>
              </div>
              {parseFloat(form.price) > 0 && (
                <div className="flex items-center justify-between gap-3 mt-1.5 text-dark-400">
                  <span>Вы получите после сделки</span>
                  <span className="text-emerald-400 font-medium">{formatPrice(feePreview.sellerReceives)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6">
            {form.game && (
              <div className="flex items-center gap-2.5 text-sm text-dark-300">
                {selectedGame && (
                  <img
                    src={selectedGame.icon}
                    alt=""
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/10"
                  />
                )}
                <span className="font-medium text-white">{form.game}</span>
                <span className="text-dark-600">·</span>
                <span>{LISTING_TYPE_OPTIONS.find((o) => o.value === form.listing_type)?.label || form.listing_type}</span>
              </div>
            )}
            {attributeSchema.map((group) => (
              <ChipGroup
                key={group.key}
                label={`${group.label}${group.required ? ' *' : ''}`}
                options={group.options}
                value={attributes[group.key] || ''}
                onChange={(val) => setAttributes((prev) => ({ ...prev, [group.key]: val }))}
              />
            ))}
            {!attributeSchema.length && (
              <p className="text-sm text-dark-400">Для этого типа дополнительные характеристики не нужны.</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-dark-400">
              Добавьте до {MAX_IMAGES} фото товара. Первое фото будет обложкой в каталоге.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((src, i) => (
                <div key={`${i}-${src.slice(0, 32)}`} className="relative aspect-square rounded-xl overflow-hidden bg-dark-800 border border-dark-700">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/70 text-white flex items-center justify-center"
                    aria-label="Удалить фото"
                  >
                    <X size={14} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#2B71F3] text-white">
                      Обложка
                    </span>
                  )}
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <label className="aspect-square rounded-xl border border-dashed border-dark-600 bg-dark-900/50
                                  flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#2B71F3]/50 transition-colors">
                  <ImagePlus size={22} className="text-dark-400" />
                  <span className="text-xs text-dark-400">{compressing ? 'Сжатие…' : 'Добавить'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={compressing}
                    onChange={onPickImages}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Описание *</label>
              <textarea
                className="input min-h-[140px] resize-none"
                placeholder="Подробно опишите товар: что входит, срок, способ передачи..."
                value={form.description}
                onChange={(e) => patchForm('description', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Способ передачи</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'manual', label: 'Вручную (чат)' },
                  { value: 'auto', label: 'Автовыдача' },
                ].map((opt) => {
                  const active = form.delivery_method === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => patchForm('delivery_method', opt.value)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        active
                          ? 'bg-[#2B71F3] border-[#2B71F3] text-white'
                          : 'bg-dark-800/80 border-dark-700 text-dark-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {form.delivery_method === 'auto' && (
              <div className="rounded-xl border border-dark-700 bg-dark-800/40 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-white">Атрибуты покупателя *</p>
                  <p className="text-xs text-dark-400 mt-1">
                    Покупатель укажет эти данные при покупке (например ID или ник).
                  </p>
                </div>
                {buyerFields.map((field, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      className="input flex-1"
                      placeholder="Название поля, например: ID / ник"
                      value={field.label}
                      onChange={(e) => setBuyerFields((prev) => prev.map((f, i) => (
                        i === index ? { ...f, label: e.target.value } : f
                      )))}
                    />
                    {buyerFields.length > 1 && (
                      <button
                        type="button"
                        className="btn-ghost p-2 text-dark-400 hover:text-red-400"
                        onClick={() => setBuyerFields((prev) => prev.filter((_, i) => i !== index))}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {buyerFields.length < 5 && (
                  <button
                    type="button"
                    className="btn-secondary text-sm inline-flex items-center gap-1.5"
                    onClick={() => setBuyerFields((prev) => [...prev, { label: '', required: true }])}
                  >
                    <Plus size={14} /> Добавить поле
                  </button>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block">Инструкции для покупателя</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Что покупатель должен знать или предоставить..."
                value={form.delivery_instructions}
                onChange={(e) => patchForm('delivery_instructions', e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-6">
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} className="btn-primary flex-1 h-11 inline-flex items-center justify-center gap-1.5">
              Далее <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onPublish}
              disabled={mutation.isPending || compressing}
              className="btn-primary flex-1 h-11"
            >
              {mutation.isPending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Опубликовать лот'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
