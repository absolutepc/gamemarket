import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Seo from '../components/Seo';

export default function CreateListingPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      listing_type: 'item',
      delivery_method: 'manual',
      original_price: '',
    },
  });

  const price = watch('price');
  const originalPrice = watch('original_price');
  const discountPreview = originalPrice && price && parseFloat(originalPrice) > parseFloat(price)
    ? Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100)
    : 0;

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
    mutation.mutate({
      ...data,
      price: parseFloat(data.price),
      original_price: data.original_price ? parseFloat(data.original_price) : null,
      category_id: data.category_id || undefined,
    });
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
              placeholder="Например: ChatGPT Plus 1 месяц / Steam 1000₽ / Telegram Stars"
              {...register('title', { required: 'Обязательное поле', minLength: { value: 5, message: 'Минимум 5 символов' } })}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Тип лота *</label>
              <select className="input" {...register('listing_type', { required: true })}>
                <option value="item">Предмет</option>
                <option value="account">Аккаунт</option>
                <option value="currency">Валюта</option>
                <option value="subscription">Подписка / ИИ</option>
                <option value="topup">Пополнение</option>
                <option value="giftcard">Подарочная карта</option>
                <option value="boosting">Буст / услуга</option>
                <option value="other">Другое</option>
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
              placeholder="Steam, Telegram, ChatGPT, TikTok, App Store, Roblox..."
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
