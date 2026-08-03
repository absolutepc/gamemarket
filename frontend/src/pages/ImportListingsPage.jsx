import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Upload, CheckSquare, Square, ArrowRight, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Seo from '../components/Seo';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';
import { LISTING_TYPE_OPTIONS } from '../utils/listingTypes';
import { formatPrice } from '../utils/format';

const EXAMPLE_JSON = `[
  {
    "title": "Cursor Pro — подписка",
    "description": "Что входит в подписку Cursor Pro. Выдача вручную после оплаты на Lootz.",
    "price": 2080,
    "game": "Cursor AI",
    "listing_type": "subscription",
    "images": []
  }
]`;

const STEPS = ['Источник', 'Проверка', 'Готово'];

const EMPTY_FORM = {
  title: '',
  description: '',
  price: '',
  game: 'Cursor AI',
  listing_type: 'subscription',
  image_url: '',
};

function explainJsonError(err, text) {
  const msg = String(err?.message || '');
  if (/position|column|line/i.test(msg) && /string|escape|control|unexpected/i.test(msg)) {
    return 'В JSON нельзя вставлять переносы строк прямо в кавычках. Короткое название в title, длинный текст — в description. Или используйте режим «Форма».';
  }
  if (text.includes('\n') && /"title"\s*:\s*"[^"]*\n/.test(text)) {
    return 'В поле title есть перенос строки — так JSON ломается. Перенесите длинный текст в description.';
  }
  return `Некорректный JSON: ${msg || 'проверьте кавычки и запятые'}`;
}

export default function ImportListingsPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [provider, setProvider] = useState('playerok');
  const [profileUrl, setProfileUrl] = useState('');
  const [mode, setMode] = useState('form'); // form | json | csv
  const [form, setForm] = useState(EMPTY_FORM);
  const [payloadText, setPayloadText] = useState(EXAMPLE_JSON);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [result, setResult] = useState(null);

  const selectedCount = useMemo(() => drafts.filter((d) => d.selected).length, [drafts]);

  const runPreview = async () => {
    setLoading(true);
    setResult(null);
    try {
      const body = { provider };
      if (provider === 'playerok' && profileUrl.trim()) body.profile_url = profileUrl.trim();

      if (mode === 'form') {
        const title = form.title.trim();
        const description = form.description.trim();
        const price = parseFloat(String(form.price).replace(',', '.'));
        if (title.length < 5) {
          toast.error('Укажите короткое название (от 5 символов)');
          return;
        }
        if (description.length < 20) {
          toast.error('Описание — минимум 20 символов');
          return;
        }
        if (!Number.isFinite(price) || price < 1) {
          toast.error('Укажите цену');
          return;
        }
        if (!form.game.trim()) {
          toast.error('Укажите игру / сервис');
          return;
        }
        body.items = [{
          title,
          description,
          price,
          game: form.game.trim(),
          listing_type: form.listing_type,
          images: form.image_url.trim() ? [form.image_url.trim()] : [],
        }];
      } else if (mode === 'csv') {
        body.csv = payloadText;
      } else {
        let items;
        try {
          items = JSON.parse(payloadText);
        } catch (err) {
          toast.error(explainJsonError(err, payloadText));
          return;
        }
        if (!Array.isArray(items)) {
          toast.error('JSON должен быть массивом лотов: [ { ... } ]');
          return;
        }
        body.items = items;
      }

      const { data } = await api.post('/listings/import/preview', body);
      setPreview(data);
      setDrafts((data.drafts || []).map((d) => ({ ...d, selected: d.selected !== false })));
      setStep(1);
    } catch (err) {
      const msg = err.response?.data?.error || 'Не удалось разобрать импорт';
      toast.error(msg);
      if (err.response?.data?.hint?.json_example && mode === 'json') {
        setPayloadText(JSON.stringify(err.response.data.hint.json_example, null, 2));
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = (on) => {
    setDrafts((prev) => prev.map((d) => ({ ...d, selected: on && !(d.warnings || []).length })));
  };

  const updateDraft = (key, patch) => {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  };

  const publish = async () => {
    const selected = drafts.filter((d) => d.selected);
    if (!selected.length) {
      toast.error('Выберите хотя бы один лот');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/listings/import/confirm', { drafts: selected });
      setResult(data);
      setStep(2);
      if (data.created_count) {
        toast.success(`Опубликовано: ${data.created_count}`);
      }
      if (data.failed_count) {
        toast.error(`Не удалось: ${data.failed_count}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка публикации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${PAGE_WIDTH_CLASS} py-8 max-w-3xl`}>
      <Seo title="Импорт лотов" path="/listings/import" noindex />

      <div className="flex items-start gap-3 mb-6">
        <Download className="text-[#5B8CFF] mt-0.5" size={26} />
        <div>
          <h1 className="text-2xl font-bold">Импорт лотов</h1>
          <p className="text-sm text-dark-400 mt-1">
            Перенос ваших публичных объявлений с другой площадки на Lootz. Автовыдача и секреты не копируются.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex-1 rounded-xl px-3 py-2 text-center text-sm border ${
              i === step
                ? 'border-[#2B71F3] bg-[#2B71F3]/10 text-white'
                : i < step
                  ? 'border-dark-700 text-dark-300'
                  : 'border-dark-800 text-dark-500'
            }`}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="card p-5 flex flex-col gap-4">
          <div>
            <div className="text-sm text-dark-400 mb-2">Площадка</div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'playerok', label: 'Playerok' },
                { id: 'manual', label: 'Другая / вручную' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    provider === p.id ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {provider === 'playerok' && (
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">Ссылка на ваш профиль Playerok</label>
              <input
                className="input w-full"
                placeholder="https://playerok.com/profile/username"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
              />
              <p className="text-xs text-dark-500 mt-1.5">
                Автозагрузка с Playerok недоступна. Заполните форму ниже по своему лоту — это самый простой способ.
              </p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'form', label: 'Форма' },
              { id: 'json', label: 'JSON' },
              { id: 'csv', label: 'CSV' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  mode === m.id ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {mode === 'form' ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm text-dark-300 mb-1">Название (коротко)</label>
                <input
                  className="input w-full"
                  placeholder="Cursor Pro — подписка"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value.slice(0, 200) }))}
                />
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1">Описание</label>
                <textarea
                  className="input w-full min-h-[120px]"
                  placeholder="Что входит в подписку, как выдаёте…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, 5000) }))}
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Цена ₽</label>
                  <input
                    className="input w-full"
                    type="number"
                    min="1"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Игра / сервис</label>
                  <input
                    className="input w-full"
                    value={form.game}
                    onChange={(e) => setForm((f) => ({ ...f, game: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Тип</label>
                  <select
                    className="input w-full"
                    value={form.listing_type}
                    onChange={(e) => setForm((f) => ({ ...f, listing_type: e.target.value }))}
                  >
                    {LISTING_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1">Ссылка на фото (необязательно)</label>
                <input
                  className="input w-full"
                  placeholder="https://… — иначе будет обычный placeholder, без иконки категории"
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value.slice(0, 500) }))}
                />
              </div>
            </div>
          ) : (
            <>
              {mode === 'json' && (
                <p className="text-xs text-dark-500">
                  Важно: в JSON нельзя делать Enter внутри кавычек title. Длинный текст кладите в description.
                </p>
              )}
              <textarea
                className="input w-full min-h-[220px] font-mono text-xs"
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                spellCheck={false}
              />
            </>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={runPreview}
            className="btn-primary h-11 inline-flex items-center justify-center gap-2"
          >
            <Upload size={16} />
            {loading ? 'Разбор…' : 'Разобрать и проверить'}
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          {preview?.note && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-100 flex gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              {preview.note}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-ghost text-sm" onClick={() => toggleAll(true)}>
              Выбрать все
            </button>
            <button type="button" className="btn-ghost text-sm" onClick={() => toggleAll(false)}>
              Снять все
            </button>
            <span className="text-sm text-dark-400 ml-auto">Выбрано: {selectedCount}</span>
          </div>

          <div className="flex flex-col gap-3">
            {drafts.map((d) => (
              <div key={d.key} className="card p-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    className="mt-1 text-[#5B8CFF]"
                    onClick={() => updateDraft(d.key, { selected: !d.selected })}
                    aria-label="Выбрать"
                  >
                    {d.selected ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      className="input w-full h-10"
                      value={d.title}
                      onChange={(e) => updateDraft(d.key, { title: e.target.value })}
                    />
                    <div className="grid sm:grid-cols-3 gap-2">
                      <input
                        className="input h-10"
                        type="number"
                        min="1"
                        value={d.price ?? ''}
                        onChange={(e) => updateDraft(d.key, { price: e.target.value })}
                        placeholder="Цена"
                      />
                      <input
                        className="input h-10"
                        value={d.game || ''}
                        onChange={(e) => updateDraft(d.key, { game: e.target.value })}
                        placeholder="Игра / сервис"
                      />
                      <select
                        className="input h-10"
                        value={d.listing_type}
                        onChange={(e) => updateDraft(d.key, { listing_type: e.target.value })}
                      >
                        {LISTING_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      className="input w-full min-h-[72px] text-sm"
                      value={d.description}
                      onChange={(e) => updateDraft(d.key, { description: e.target.value })}
                    />
                    {(d.warnings || []).length > 0 && (
                      <p className="text-xs text-amber-300">{d.warnings.join(' · ')}</p>
                    )}
                    <p className="text-xs text-dark-500">
                      {d.price ? formatPrice(d.price) : '—'} · {d.listing_type}
                      {d.source_url ? ` · ${d.source_url}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 sticky bottom-24 lg:bottom-4 bg-dark-950/90 backdrop-blur py-3">
            <button type="button" className="btn-secondary h-11 px-4" onClick={() => setStep(0)}>
              Назад
            </button>
            <button
              type="button"
              disabled={loading || !selectedCount}
              onClick={publish}
              className="btn-primary h-11 px-4 inline-flex items-center gap-2"
            >
              Опубликовать выбранные <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && result && (
        <div className="card p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Импорт завершён</h2>
          <p className="text-dark-300 mb-4">
            Опубликовано: <span className="text-white font-semibold">{result.created_count}</span>
            {result.failed_count ? (
              <> · ошибок: <span className="text-red-300">{result.failed_count}</span></>
            ) : null}
          </p>
          {!!result.failed?.length && (
            <ul className="text-left text-sm text-dark-400 mb-4 space-y-1">
              {result.failed.map((f) => (
                <li key={`${f.index}-${f.title}`}>#{f.index + 1} {f.title}: {f.error}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-primary" onClick={() => navigate('/users')}>
              К профилю
            </button>
            <Link to="/listings/create" className="btn-secondary inline-flex items-center">
              Создать ещё лот
            </Link>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setStep(0);
                setResult(null);
                setDrafts([]);
                setPreview(null);
              }}
            >
              Новый импорт
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
