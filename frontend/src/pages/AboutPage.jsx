import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';

export default function AboutPage() {
  return (
    <div className={`${PAGE_WIDTH_CLASS} py-8 sm:py-10 max-w-3xl`}>
      <Seo
        title="О Lootz"
        description="Lootz — маркетплейс игровых товаров и услуг с эскроу. Узнайте, кто мы и как защищаем сделки покупателей и продавцов."
        path="/about"
      />

      <p className="text-sm text-dark-500 mb-3">
        <Link to="/" className="hover:text-dark-300">Главная</Link>
        <span className="mx-1.5">/</span>
        О Lootz
      </p>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
        Lootz
      </h1>
      <p className="text-lg text-dark-300 mb-8 leading-relaxed">
        Маркетплейс игровых товаров и услуг. Покупайте и продавайте аккаунты, валюту,
        предметы и бусты — с защитой эскроу для обеих сторон.
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-3">Зачем искать именно Lootz</h2>
        <p className="text-dark-300 leading-relaxed mb-3">
          Lootz — отдельный бренд безопасной торговли между игроками. Мы не подменяем
          название общими словами вроде «биржа» или «площадка»: в поиске, в сделке
          и в поддержке вы всегда имеете дело с Lootz.
        </p>
        <p className="text-dark-300 leading-relaxed">
          Произносится «лутз». Домен: <span className="text-white font-medium">lootz.ru</span>.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-3">Как устроены сделки</h2>
        <p className="text-dark-300 leading-relaxed mb-3">
          Оплата проходит через эскроу Lootz: деньги удерживаются, пока покупатель
          не подтвердит получение. Споры рассматривает модерация. Комиссия площадки
          прозрачна — 7.5% или 17.5% в зависимости от категории, без скрытой платы за вывод.
        </p>
        <p className="text-dark-300 leading-relaxed">
          Подробнее — в{' '}
          <Link to="/faq" className="text-brand-400 hover:underline">FAQ</Link>
          {' '}и{' '}
          <Link to="/rules" className="text-brand-400 hover:underline">правилах</Link>.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-3">Что продают на Lootz</h2>
        <p className="text-dark-300 leading-relaxed">
          Игры и сервисы: аккаунты, игровая валюта, скины, бусты, ключи, подписки
          и пополнения — от CS2 и PUBG до Steam, Telegram и ChatGPT.
        </p>
      </section>

      <div className="flex flex-wrap gap-3 pt-2">
        <Link to="/catalog" className="btn-primary">Смотреть лоты</Link>
        <Link to="/become-seller" className="btn-secondary">Стать продавцом</Link>
        <Link to="/support" className="btn-ghost">Связаться с Lootz</Link>
      </div>
    </div>
  );
}
