import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Seo from '../components/Seo';
import { resolveFeePercent, formatFeePercent, calcSellerReceives } from '../utils/fees';
import { formatPrice } from '../utils/format';
import { LISTING_TYPE_OPTIONS } from '../utils/listingTypes';

const DEFAULT_FIELD = { key: 'player_id', label: 'ID / ник', required: true };

export default function CreateListingPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [buyerFields, setBuyerFields] = useState([DEFAULT_FIELD]);
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      listing_type: 'subscription',
      delivery_method: 'manual',
      original_price: '',
    },
  });

  const price = watch('price');
  const originalPrice = watch('original_price');
  const deliveryMethod = watch('delivery_method');
  const listingType = watch('listing_type');
  const categoryId = watch('category_id');
  const discountPreview = originalPrice && price && parseFloat(originalPrice) > parseFloat(price)
    ? Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100)
    : 0;

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const selectedCategory = useMemo(
    () => categories?.find((c) => String(c.id) === String(categoryId)),
    [categories, categoryId]
  );

  const feePercent = resolveFeePercent({
    categorySlug: selectedCategory?.slug,
    listingType,
  });
  const feePreview = calcSellerReceives(price, feePercent);

  const { data: existing } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.get(`/listings/${id}`).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        description: existing.description,
        price: existing.price,
        original_price: existing.original_price || '',
        game: existing.game || '',
        listing_type: existing.listing_type,
        category_id: existing.category_id || '',
        delivery_method: existing.delivery_method || 'manual',
        delivery_instructions: existing.delivery_instructions || '',
      });
      const fields = Array.isArray(existing.buyer_fields) && existing.buyer_fields.length
        ? existing.buyer_fields
        : [DEFAULT_FIELD];
      setBuyerFields(fields);
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/listings/${id}`, data) : api.post('/listings', data),
    onSuccess: (res) => {
      toast.success(isEdit ? 'Лот обновлён!' : 'Лот опубликован!');
      navigate(`/listings/${res.data.id}`);
    },
    onError: (err) => {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Ошибка';
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    const fields = deliveryMethod === 'auto'
      ? buyerFields
        .map((f) => ({
          key: f.key || undefined,
          label: (f.label || '').trim(),
          required: f.required !== false,
        }))
        .filter((f) => f.label)
      : [];

    if (deliveryMethod === 'auto' && !fields.length) {
      toast.error('Укажите хотя бы один атрибут для покупателя (например ID / ник)');
      return;
    }

    mutation.mutate({
      ...data,
      price: parseFloat(data.price),
      original_price: data.original_price ? parseFloat(data.original_price) : null,
      category_id: data.category_id || undefined,
      buyer_fields: fields,
    });
  };

  const updateField = (index, patch) => {
    setBuyerFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Seo title={isEdit ? 'Редактирование лота' : 'Разместить лот'} path={isEdit ? `/listings/${id}/edit` : '/listings/create'} noindex />
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Редактировать лот' : 'Разместить лот'}</h1>

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Заголовок *</label>
            <input
              className="input"
              placeholder="Например: Cursor Pro 1 месяц"
              {...register('title', { required: 'Обязательное поле', minLength: { value: 5, message: 'Минимум 5 символов' } })}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Тип лота *</label>
              <select className="input" {...register('listing_type', { required: true })}>
                {LISTING_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
                {isEdit && existing?.listing_type === 'giftcard' && (
                  <option value="giftcard">Подарочная карта</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Категория</label>
              <select className="input" {...register('category_id')}>
                <option value="">Без категории</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Игра / сервис</label>
            <input
              className="input"
              placeholder="Название игры или сервиса"
              {...register('game')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Цена (₽) *</label>
              <input
                className="input"
                type="number"
                placeholder="500"
                min="1"
                {...register('price', { required: 'Укажите цену', min: { value: 1, message: 'Минимум 1₽' } })}
              />
              {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Старая цена (для скидки)</label>
              <input
                className="input"
                type="number"
                placeholder="990"
                min="1"
                {...register('original_price')}
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
            {parseFloat(price) > 0 && (
              <div className="flex items-center justify-between gap-3 mt-1.5 text-dark-400">
                <span>Вы получите после сделки</span>
                <span className="text-emerald-400 font-medium">{formatPrice(feePreview.sellerReceives)}</span>
              </div>
            )}
            <p className="text-[11px] text-dark-500 mt-2">
              7.5% — подписки, донат, пополнения, ключи · 17.5% — аккаунты, предметы, валюта и остальное
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Описание *</label>
            <textarea
              className="input min-h-[140px] resize-none"
              placeholder="Подробно опишите товар: что входит, срок, способ передачи..."
              {...register('description', {
                required: 'Обязательное поле',
                minLength: { value: 20, message: 'Минимум 20 символов' },
              })}
            />
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Способ передачи</label>
            <select className="input" {...register('delivery_method')}>
              <option value="manual">Вручную (через чат)</option>
              <option value="auto">Автовыдача</option>
            </select>
          </div>

          {deliveryMethod === 'auto' && (
            <div className="rounded-xl border border-dark-700 bg-dark-800/40 p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-white">Атрибуты покупателя *</p>
                <p className="text-xs text-dark-400 mt-1">
                  Покупатель укажет эти данные при покупке (например ID или ник в игре).
                </p>
              </div>
              {buyerFields.map((field, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    className="input flex-1"
                    placeholder="Название поля, например: ID / ник"
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
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
              {...register('delivery_instructions')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary flex-1 h-11">
              {mutation.isPending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Опубликовать лот'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
