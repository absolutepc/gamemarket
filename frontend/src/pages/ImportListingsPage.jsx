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
    "title": "PUBG UC 60",
    "description": "Пополнение UC. Выдача вручную после оплаты на Lootz.",
    "price": 99,
    "game": "PUBG",
    "listing_type": "topup",
    "images": []
  }
]`;

const STEPS = ['Источник', 'Проверка', 'Готово'];

export default function ImportListingsPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [provider, setProvider] = useState('playerok');
  const [profileUrl, setProfileUrl] = useState('');
  const [mode, setMode] = useState('json'); // json | csv
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

      if (mode === 'csv') {
        body.csv = payloadText;
      } else {
        let items;
        try {
          items = JSON.parse(payloadText);
        } catch {
          toast.error('Некорректный JSON');
          return;
        }
        if (!Array.isArray(items)) {
          toast.error('JSON должен быть массивом лотов');
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
      if (err.response?.data?.hint?.json_example) {
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
                Прямой парсинг Playerok с сервера часто блокируется. Поэтому лоты нужно вставить ниже (JSON или CSV) —
                это ваши объявления, которые вы переносите сами.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {[
              { id: 'json', label: 'JSON' },
              { id: 'csv', label: 'CSV' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m.id);
                  if (m.id === 'csv' && payloadText.trim().startsWith('[')) {
                    setPayloadText('title,description,price,game,listing_type,images,url\nPUBG UC 60,"Пополнение UC вручную",99,PUBG,topup,,');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  mode === m.id ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <textarea
            className="input w-full min-h-[220px] font-mono text-xs"
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            spellCheck={false}
          />

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
