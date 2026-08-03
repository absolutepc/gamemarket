import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Download, Upload, CheckSquare, Square, ArrowRight, AlertTriangle, Plus, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Seo from '../components/Seo';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';
import { LISTING_TYPE_OPTIONS } from '../utils/listingTypes';
import { formatPrice } from '../utils/format';
import { resolveAssortmentItem } from '../utils/assortmentIcons';
import { LISTING_ATTRIBUTE_SCHEMAS } from '../utils/listingAttributes';

const SUB_DURATION_OPTIONS = LISTING_ATTRIBUTE_SCHEMAS.subscription.find((g) => g.key === 'duration')?.options || [];
const SUB_PLAN_OPTIONS = LISTING_ATTRIBUTE_SCHEMAS.subscription.find((g) => g.key === 'plan')?.options || [];

function guessSubscriptionAttributes(title, description = '') {
  const hay = `${title || ''} ${description || ''}`;
  let duration = '';
  if (/1\s*год|12\s*мес|one\s*year|\b1\s*year\b/i.test(hay)) duration = '1 год';
  else if (/6\s*мес|полгода|6\s*month/i.test(hay)) duration = '6 месяцев';
  else if (/3\s*мес|3\s*month/i.test(hay)) duration = '3 месяца';
  else if (/14\s*дн|2\s*недел|14\s*day/i.test(hay)) duration = '14 дней';
  else if (/7\s*дн|1\s*недел|7\s*day/i.test(hay)) duration = '7 дней';
  else if (/1\s*мес|месяц|\bmonth\b/i.test(hay)) duration = '1 месяц';

  let plan = '';
  if (/pro\s*plus|pro\+|про\s*плюс/i.test(hay)) plan = 'Pro Plus';
  else if (/\bultra\b|ультра/i.test(hay)) plan = 'Ultra';
  else if (/\benterprise\b/i.test(hay)) plan = 'Enterprise';
  else if (/\bbusiness\b|бизнес/i.test(hay)) plan = 'Business';
  else if (/\btrial\b|триал/i.test(hay)) plan = 'Trial';
  else if (/\bbasic\b|базов/i.test(hay)) plan = 'Basic';
  else if (/\bpro\b|про\b/i.test(hay)) plan = 'Pro';

  return { duration, plan };
}

function buildSuggestedDescription({ title, game, listingType, attributes = {} }) {
  const t = String(title || '').trim() || 'Товар';
  const g = String(game || '').trim();
  const plan = String(attributes.plan || '').trim();
  const duration = String(attributes.duration || '').trim();
  const lines = [];

  switch (listingType) {
    case 'subscription':
    case 'premium': {
      const who = [g && g !== 'Другое' ? g : null, plan || null].filter(Boolean).join(' · ');
      if (who) {
        lines.push(`Подписка ${who}${duration ? ` на ${duration}` : ''}.`);
      } else {
        lines.push(`${t}${t.endsWith('.') ? '' : '.'}`);
        if (duration) lines.push(`Срок: ${duration}.`);
      }
      lines.push('Выдача вручную после оплаты в чате сделки на Lootz.');
      lines.push('Полный доступ на указанный срок. Перед покупкой уточните способ активации.');
      break;
    }
    case 'topup':
    case 'donate':
    case 'currency':
    case 'stars':
      lines.push(g && g !== 'Другое' ? `Пополнение ${g}: ${t}.` : `${t}${t.endsWith('.') ? '' : '.'}`);
      lines.push('Выдача вручную после оплаты в чате сделки на Lootz.');
      break;
    case 'account':
    case 'game_account':
    case 'clean_account':
      lines.push(g && g !== 'Другое' ? `Аккаунт ${g}. ${t}.` : `${t}${t.endsWith('.') ? '' : '.'}`);
      lines.push('Данные передаются после оплаты в чате сделки на Lootz.');
      lines.push('Рекомендуем сменить пароль сразу после получения.');
      break;
    case 'keys':
    case 'giftcard':
      lines.push(g && g !== 'Другое' ? `Ключ / код для ${g}: ${t}.` : `${t}${t.endsWith('.') ? '' : '.'}`);
      lines.push('Выдача после оплаты в чате сделки на Lootz.');
      break;
    case 'boosting':
    case 'services':
    case 'training':
      lines.push(g && g !== 'Другое' ? `Услуга для ${g}: ${t}.` : `${t}${t.endsWith('.') ? '' : '.'}`);
      lines.push('Детали и сроки выполнения — в чате сделки после оплаты на Lootz.');
      break;
    case 'skins':
    case 'item':
      lines.push(g && g !== 'Другое' ? `Предмет для ${g}: ${t}.` : `${t}${t.endsWith('.') ? '' : '.'}`);
      lines.push('Выдача после оплаты в чате сделки на Lootz.');
      break;
    default:
      lines.push(`${t}${t.endsWith('.') ? '' : '.'}`);
      if (g && g !== 'Другое') lines.push(`Игра / сервис: ${g}.`);
      lines.push('Выдача вручную после оплаты в чате сделки на Lootz.');
      lines.push('Проверьте условия перед покупкой.');
  }

  return lines.join('\n').slice(0, 5000);
}

const EXAMPLE_JSON = `[
  {
    "title": "Cursor Pro — подписка",
    "price": 2080,
    "listing_type": "subscription",
    "images": []
  },
  {
    "title": "Claude Pro 1 месяц",
    "price": 1990,
    "listing_type": "subscription",
    "images": []
  }
]`;

const STEPS = ['Источник', 'Проверка', 'Готово'];
const MAX_FORM_LOTS = 50;

const TYPE_HINTS = [
  ['subscription', /подписк|premium|pro\b|plus\b|ps\s*plus|game\s*pass/i],
  ['topup', /пополнен|uc\b|gcoin|robux|v-?bucks|баланс/i],
  ['donate', /донат/i],
  ['currency', /валют|монет/i],
  ['account', /аккаунт|акк\b|account/i],
  ['keys', /ключ|key|gift\s*card/i],
  ['boosting', /буст|boost|прокачк/i],
];

function newLotForm() {
  return {
    id: `lot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    description: '',
    descriptionManual: false,
    price: '',
    game: '',
    gameManual: false,
    listing_type: 'other',
    typeManual: false,
    duration: '',
    plan: '',
    image_url: '',
  };
}

function guessGameFromTitle(title) {
  return resolveAssortmentItem(title)?.name || '';
}

function guessTypeFromText(title, description = '') {
  const hay = `${title} ${description}`;
  for (const [type, re] of TYPE_HINTS) {
    if (re.test(hay)) return type;
  }
  return 'other';
}

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

function enrichItemsWithAssortment(items) {
  return (items || []).map((item) => {
    const title = String(item.title || item.name || '').trim();
    let description = String(item.description || item.desc || '').trim();
    const guessedGame = guessGameFromTitle(title);
    const game = String(item.game || '').trim() || guessedGame;
    const listingType = String(item.listing_type || item.type || '').trim()
      || guessTypeFromText(title, description);
    const guessedSub = guessSubscriptionAttributes(title, description);
    const attributes = {
      ...(item.attributes && typeof item.attributes === 'object' ? item.attributes : {}),
    };
    if (listingType === 'subscription') {
      if (!attributes.duration) {
        attributes.duration = item.duration || guessedSub.duration || '';
      }
      if (!attributes.plan) {
        attributes.plan = item.plan || guessedSub.plan || '';
      }
    }
    if (description.length < 20) {
      description = buildSuggestedDescription({
        title,
        game: game || 'Другое',
        listingType,
        attributes,
      });
    }
    return {
      ...item,
      title,
      description,
      game: game || 'Другое',
      listing_type: listingType,
      attributes,
    };
  });
}

export default function ImportListingsPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [provider, setProvider] = useState('playerok');
  const [profileUrl, setProfileUrl] = useState('');
  const [mode, setMode] = useState('form'); // form | json | csv
  const [forms, setForms] = useState([newLotForm()]);
  const [payloadText, setPayloadText] = useState(EXAMPLE_JSON);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [result, setResult] = useState(null);

  const selectedCount = useMemo(() => drafts.filter((d) => d.selected).length, [drafts]);

  const updateForm = (id, patch) => {
    setForms((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const onTitleChange = (id, title) => {
    setForms((prev) => prev.map((f) => {
      if (f.id !== id) return f;
      const next = { ...f, title: title.slice(0, 200) };
      if (!f.gameManual) {
        next.game = guessGameFromTitle(title);
      }
      if (!f.typeManual) {
        next.listing_type = guessTypeFromText(title, f.descriptionManual ? f.description : '');
      }
      if (next.listing_type === 'subscription') {
        const guessed = guessSubscriptionAttributes(title, f.description);
        if (!f.duration) next.duration = guessed.duration;
        if (!f.plan) next.plan = guessed.plan;
      }
      if (!f.descriptionManual) {
        next.description = buildSuggestedDescription({
          title: next.title,
          game: next.game,
          listingType: next.listing_type,
          attributes: {
            duration: next.duration || f.duration,
            plan: next.plan || f.plan,
          },
        });
      }
      return next;
    }));
  };

  const applySuggestedDescription = (id) => {
    setForms((prev) => prev.map((f) => {
      if (f.id !== id) return f;
      return {
        ...f,
        descriptionManual: false,
        description: buildSuggestedDescription({
          title: f.title,
          game: f.game || guessGameFromTitle(f.title),
          listingType: f.listing_type,
          attributes: { duration: f.duration, plan: f.plan },
        }),
      };
    }));
  };

  const runPreview = async () => {
    setLoading(true);
    setResult(null);
    try {
      const body = { provider };
      if (provider === 'playerok' && profileUrl.trim()) body.profile_url = profileUrl.trim();

      if (mode === 'form') {
        const items = [];
        for (let i = 0; i < forms.length; i += 1) {
          const form = forms[i];
          const title = form.title.trim();
          let description = form.description.trim();
          const price = parseFloat(String(form.price).replace(',', '.'));
          if (!title && !description && !form.price) continue; // skip empty rows
          if (title.length < 5) {
            toast.error(`Лот ${i + 1}: название от 5 символов`);
            return;
          }
          const game = form.game.trim() || guessGameFromTitle(title);
          const listingType = form.listing_type || guessTypeFromText(title, description);
          const attributes = (listingType === 'subscription')
            ? {
              duration: form.duration || guessSubscriptionAttributes(title, description).duration,
              plan: form.plan || guessSubscriptionAttributes(title, description).plan,
            }
            : {};
          if (description.length < 20) {
            description = buildSuggestedDescription({
              title,
              game: game || 'Другое',
              listingType,
              attributes,
            });
          }
          if (!Number.isFinite(price) || price < 1) {
            toast.error(`Лот ${i + 1}: укажите цену`);
            return;
          }
          if (!game) {
            toast.error(`Лот ${i + 1}: укажите игру / сервис (не удалось угадать по названию)`);
            return;
          }
          items.push({
            title,
            description,
            price,
            game,
            listing_type: listingType,
            images: form.image_url.trim() ? [form.image_url.trim()] : [],
            attributes,
          });
        }
        if (!items.length) {
          toast.error('Добавьте хотя бы один лот');
          return;
        }
        body.items = enrichItemsWithAssortment(items);
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
          toast.error('JSON должен быть массивом лотов: [ { ... }, { ... } ]');
          return;
        }
        body.items = enrichItemsWithAssortment(items);
      }

      // For CSV, enrich after preview from server drafts instead
      const { data } = await api.post('/listings/import/preview', body);
      const draftsNext = (data.drafts || []).map((d, i) => {
        const guessed = guessGameFromTitle(d.title);
        const game = (!d.game || d.game === 'Другое') && guessed ? guessed : d.game;
        return {
          ...d,
          game,
          selected: d.selected !== false,
          key: d.key || `draft-${i}`,
        };
      });
      setPreview(data);
      setDrafts(draftsNext);
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
    setDrafts((prev) => prev.map((d) => {
      if (d.key !== key) return d;
      const next = { ...d, ...patch };
      if (patch.title != null && patch.game === undefined) {
        const guessed = guessGameFromTitle(patch.title);
        if (guessed) next.game = guessed;
      }
      const title = next.title;
      const description = next.description;
      const listingType = next.listing_type;
      if (listingType === 'subscription') {
        const guessed = guessSubscriptionAttributes(title, description);
        const attrs = { ...(next.attributes || {}) };
        if (patch.attributes) {
          Object.assign(attrs, patch.attributes);
        }
        if (patch.title != null || patch.description != null || patch.listing_type != null) {
          if (!attrs.duration) attrs.duration = guessed.duration;
          if (!attrs.plan) attrs.plan = guessed.plan;
        }
        next.attributes = attrs;
      }
      return next;
    }));
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
            Можно перенести сразу несколько объявлений. Игра, тип, срок/план и описание
            подставляются из названия — перед публикацией проверьте тексты.
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
                Автозагрузка с Playerok недоступна. Добавьте несколько лотов формой ниже или вставьте JSON/CSV списком.
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
            <div className="flex flex-col gap-4">
              {forms.map((form, index) => (
                <div key={form.id} className="rounded-2xl border border-dark-800 bg-dark-950/40 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-dark-200">Лот {index + 1}</div>
                    {forms.length > 1 && (
                      <button
                        type="button"
                        className="btn-ghost text-sm text-red-300 inline-flex items-center gap-1"
                        onClick={() => setForms((prev) => prev.filter((f) => f.id !== form.id))}
                      >
                        <Trash2 size={14} /> Удалить
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-dark-300 mb-1">Название (коротко)</label>
                    <input
                      className="input w-full"
                      placeholder="Например: Claude Pro 1 месяц"
                      value={form.title}
                      onChange={(e) => onTitleChange(form.id, e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="block text-sm text-dark-300">Описание</label>
                      <button
                        type="button"
                        className="text-xs text-[#5B8CFF] hover:underline"
                        onClick={() => applySuggestedDescription(form.id)}
                      >
                        Подставить по названию
                      </button>
                    </div>
                    <textarea
                      className="input w-full min-h-[100px]"
                      placeholder="Подставится из названия, или напишите своё…"
                      value={form.description}
                      onChange={(e) => {
                        const description = e.target.value.slice(0, 5000);
                        const listing_type = form.typeManual
                          ? form.listing_type
                          : guessTypeFromText(form.title, description);
                        const patch = {
                          description,
                          descriptionManual: true,
                          listing_type,
                        };
                        if (listing_type === 'subscription') {
                          const guessed = guessSubscriptionAttributes(form.title, description);
                          if (!form.duration) patch.duration = guessed.duration;
                          if (!form.plan) patch.plan = guessed.plan;
                        }
                        updateForm(form.id, patch);
                      }}
                    />
                    <p className="text-xs text-dark-500 mt-1">
                      Можно оставить пустым — подставим шаблон по типу лота.
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-sm text-dark-300 mb-1">Цена ₽</label>
                      <input
                        className="input w-full"
                        type="number"
                        min="1"
                        value={form.price}
                        onChange={(e) => updateForm(form.id, { price: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-dark-300 mb-1">Игра / сервис</label>
                      <input
                        className="input w-full"
                        placeholder="Подставится из названия"
                        value={form.game}
                        onChange={(e) => {
                          const game = e.target.value;
                          const patch = { game, gameManual: true };
                          if (!form.descriptionManual) {
                            patch.description = buildSuggestedDescription({
                              title: form.title,
                              game,
                              listingType: form.listing_type,
                              attributes: { duration: form.duration, plan: form.plan },
                            });
                          }
                          updateForm(form.id, patch);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-dark-300 mb-1">Тип</label>
                      <select
                        className="input w-full"
                        value={form.listing_type}
                        onChange={(e) => {
                          const listing_type = e.target.value;
                          const patch = { listing_type, typeManual: true };
                          if (listing_type === 'subscription') {
                            const guessed = guessSubscriptionAttributes(form.title, form.description);
                            if (!form.duration) patch.duration = guessed.duration;
                            if (!form.plan) patch.plan = guessed.plan;
                          }
                          if (!form.descriptionManual) {
                            patch.description = buildSuggestedDescription({
                              title: form.title,
                              game: form.game,
                              listingType: listing_type,
                              attributes: {
                                duration: patch.duration || form.duration,
                                plan: patch.plan || form.plan,
                              },
                            });
                          }
                          updateForm(form.id, patch);
                        }}
                      >
                        {LISTING_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {form.listing_type === 'subscription' && (
                    <div className="grid sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm text-dark-300 mb-1">Срок подписки</label>
                        <select
                          className="input w-full"
                          value={form.duration}
                          onChange={(e) => {
                            const duration = e.target.value;
                            const patch = { duration };
                            if (!form.descriptionManual) {
                              patch.description = buildSuggestedDescription({
                                title: form.title,
                                game: form.game,
                                listingType: form.listing_type,
                                attributes: { duration, plan: form.plan },
                              });
                            }
                            updateForm(form.id, patch);
                          }}
                        >
                          <option value="">Выберите…</option>
                          {SUB_DURATION_OPTIONS.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-dark-300 mb-1">Тип подписки</label>
                        <select
                          className="input w-full"
                          value={form.plan}
                          onChange={(e) => {
                            const plan = e.target.value;
                            const patch = { plan };
                            if (!form.descriptionManual) {
                              patch.description = buildSuggestedDescription({
                                title: form.title,
                                game: form.game,
                                listingType: form.listing_type,
                                attributes: { duration: form.duration, plan },
                              });
                            }
                            updateForm(form.id, patch);
                          }}
                        >
                          <option value="">Выберите…</option>
                          {SUB_PLAN_OPTIONS.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm text-dark-300 mb-1">Ссылка на фото (необязательно)</label>
                    <input
                      className="input w-full"
                      placeholder="https://…"
                      value={form.image_url}
                      onChange={(e) => updateForm(form.id, { image_url: e.target.value.slice(0, 500) })}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn-secondary h-11 inline-flex items-center justify-center gap-2"
                disabled={forms.length >= MAX_FORM_LOTS}
                onClick={() => setForms((prev) => (
                  prev.length >= MAX_FORM_LOTS ? prev : [...prev, newLotForm()]
                ))}
              >
                <Plus size={16} /> Добавить ещё лот
              </button>
              <p className="text-xs text-dark-500">До {MAX_FORM_LOTS} лотов за один импорт. JSON/CSV — тоже списком.</p>
            </div>
          ) : (
            <>
              {mode === 'json' && (
                <p className="text-xs text-dark-500">
                  Массив объектов. Поля game и description можно не указывать — подставим из title.
                </p>
              )}
              {mode === 'csv' && (
                <p className="text-xs text-dark-500">
                  Колонка description необязательна — пустое описание заполним шаблоном по типу лота.
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
                    {d.listing_type === 'subscription' && (
                      <div className="grid sm:grid-cols-2 gap-2">
                        <select
                          className="input h-10"
                          value={d.attributes?.duration || ''}
                          onChange={(e) => updateDraft(d.key, {
                            attributes: { ...(d.attributes || {}), duration: e.target.value },
                          })}
                        >
                          <option value="">Срок подписки…</option>
                          {SUB_DURATION_OPTIONS.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                        <select
                          className="input h-10"
                          value={d.attributes?.plan || ''}
                          onChange={(e) => updateDraft(d.key, {
                            attributes: { ...(d.attributes || {}), plan: e.target.value },
                          })}
                        >
                          <option value="">Тип подписки…</option>
                          {SUB_PLAN_OPTIONS.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-dark-500">Описание</span>
                      <button
                        type="button"
                        className="text-xs text-[#5B8CFF] hover:underline"
                        onClick={() => updateDraft(d.key, {
                          description: buildSuggestedDescription({
                            title: d.title,
                            game: d.game,
                            listingType: d.listing_type,
                            attributes: d.attributes || {},
                          }),
                        })}
                      >
                        Подставить по названию
                      </button>
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
                setForms([newLotForm()]);
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
