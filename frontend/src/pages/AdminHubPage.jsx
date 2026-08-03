import { Link } from 'react-router-dom';
import {
  Shield,
  Activity,
  Wallet,
  Trophy,
  EyeOff,
  Scale,
  Crown,
  ArrowRight,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';
import { isPlatformOwner } from '../utils/roles';

const SECTIONS = [
  {
    to: '/admin/stats',
    title: 'Статистика',
    hint: 'Пользователи, продавцы, Founders, онлайн',
    icon: Activity,
    accent: 'text-sky-300',
    ring: 'ring-sky-500/20',
    ownerOnly: false,
  },
  {
    to: '/admin/finance',
    title: 'Финансы',
    hint: 'Баланс площадки, комиссии, ТОП, выводы',
    icon: Wallet,
    accent: 'text-emerald-300',
    ring: 'ring-emerald-500/20',
    ownerOnly: true,
  },
  {
    to: '/admin/contest',
    title: 'Конкурс',
    hint: 'Участники, шансы, розыгрыш',
    icon: Trophy,
    accent: 'text-amber-300',
    ring: 'ring-amber-500/20',
    ownerOnly: false,
  },
  {
    to: '/admin/assortment',
    title: 'Каталог',
    hint: 'Скрытие позиций ассортимента',
    icon: EyeOff,
    accent: 'text-brand-300',
    ring: 'ring-brand-500/20',
    ownerOnly: false,
  },
  {
    to: '/admin/disputes',
    title: 'Споры',
    hint: 'Разбор открытых и решённых споров',
    icon: Scale,
    accent: 'text-rose-300',
    ring: 'ring-rose-500/20',
    ownerOnly: false,
  },
  {
    to: '/admin/founders',
    title: 'Founders',
    hint: 'Заявки, участники, снятие статуса',
    icon: Crown,
    accent: 'text-amber-200',
    ring: 'ring-amber-500/20',
    ownerOnly: false,
  },
];

export default function AdminHubPage() {
  const user = useAuthStore((s) => s.user);
  const owner = isPlatformOwner(user);
  const items = SECTIONS.filter((s) => !s.ownerOnly || owner);

  return (
    <div className={`${PAGE_WIDTH_CLASS} py-8`}>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <Shield className="text-brand-400" size={22} />
        <h1 className="text-2xl font-bold">Админ-панель</h1>
      </div>
      <p className="text-sm text-dark-400 mb-8 max-w-2xl">
        Разделы модерации и управления Lootz. Выберите нужный блок.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.to}
              to={s.to}
              className={`card p-5 ring-1 ${s.ring} flex flex-col gap-4
                          hover:bg-dark-800/80 transition-colors no-underline text-inherit`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">{s.title}</p>
                  <p className="text-sm text-dark-400 mt-1 leading-snug">{s.hint}</p>
                </div>
                <div className={`p-2.5 rounded-xl bg-dark-800 ${s.accent}`}>
                  <Icon size={20} />
                </div>
              </div>
              <span className="mt-auto text-sm text-brand-300 inline-flex items-center gap-1">
                Открыть <ArrowRight size={14} />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
