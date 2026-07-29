import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import ListingCard from '../components/ListingCard';

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: params.get('search') || '',
    category: params.get('category') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    sort: params.get('sort') || 'newest',
    page: parseInt(params.get('page') || '1'),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['listings', filters],
    queryFn: () => {
      const p = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v); });
      return api.get(`/listings?${p}`).then((r) => r.data);
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  useEffect(() => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, String(v)); });
    setParams(p);
  }, [filters]);

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val, page: 1 }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar filters */}
        <aside className="lg:w-56 shrink-0">
          <div className="card p-4 flex flex-col gap-5 sticky top-20">
            <div className="flex items-center gap-2 font-semibold">
              <SlidersHorizontal size={16} /> Фильтры
            </div>

            <div>
              <label className="text-xs text-dark-400 font-medium mb-2 block">Категория</label>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setFilter('category', '')}
                  className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${!filters.category ? 'bg-brand-500/20 text-brand-300' : 'hover:bg-dark-800 text-dark-300'}`}
                >
                  Все категории
                </button>
                {categories?.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setFilter('category', c.slug)}
                    className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${filters.category === c.slug ? 'bg-brand-500/20 text-brand-300' : 'hover:bg-dark-800 text-dark-300'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-dark-400 font-medium mb-2 block">Цена (₽)</label>
              <div className="flex gap-2">
                <input
                  className="input text-sm py-2 px-3"
                  placeholder="От"
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilter('minPrice', e.target.value)}
                />
                <input
                  className="input text-sm py-2 px-3"
                  placeholder="До"
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilter('maxPrice', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-dark-400 font-medium mb-2 block">Сортировка</label>
              <select
                className="input text-sm py-2"
                value={filters.sort}
                onChange={(e) => setFilter('sort', e.target.value)}
              >
                <option value="newest">Новые</option>
                <option value="oldest">Старые</option>
                <option value="price_asc">Цена: по возрастанию</option>
                <option value="price_desc">Цена: по убыванию</option>
                <option value="popular">Популярные</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Listings grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-bold">
              {filters.search ? `Поиск: ${filters.search}` : 'Все лоты'}
            </h1>
            {data && (
              <span className="text-dark-400 text-sm">{data.total} лотов</span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card aspect-[3/4] animate-pulse bg-dark-800" />
              ))}
            </div>
          ) : data?.listings?.length === 0 ? (
            <div className="card p-16 text-center text-dark-400">
              <p className="text-lg font-medium">Лоты не найдены</p>
              <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {data?.listings?.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}

          {/* Pagination */}
          {data?.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                disabled={filters.page <= 1}
                className="btn-secondary p-2 disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-dark-300">
                {filters.page} / {data.pages}
              </span>
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page >= data.pages}
                className="btn-secondary p-2 disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
