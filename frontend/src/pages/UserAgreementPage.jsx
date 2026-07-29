import { Link } from 'react-router-dom';
import Seo from '../components/Seo';

export default function UserAgreementPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Seo
        title="Пользовательское соглашение"
        description="Условия использования маркетплейса GameMarket: аккаунт, сделки, ответственность."
        path="/user-agreement"
      />
      <h1 className="text-3xl font-bold mb-2">Пользовательское соглашение</h1>
      <p className="text-dark-400 mb-8">Обновлено: 29 июля 2026</p>

      <div className="card p-6 space-y-6 text-dark-200 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">1. Предмет соглашения</h2>
          <p>
            GameMarket предоставляет онлайн-площадку для размещения и покупки цифровых игровых
            товаров и услуг. Используя сервис, вы принимаете условия этого соглашения.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">2. Аккаунт</h2>
          <p>
            Вы отвечаете за безопасность доступа к аккаунту и достоверность указанных данных.
            Запрещены мультиаккаунты для обхода ограничений и мошенничество.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">3. Сделки</h2>
          <p>
            Покупки проходят через эскроу. Подробные правила оплаты и споров описаны в{' '}
            <Link to="/terms-of-sale" className="text-brand-400 hover:underline">условиях продажи</Link>
            {' '}и{' '}
            <Link to="/rules" className="text-brand-400 hover:underline">правилах площадки</Link>.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">4. Ограничение ответственности</h2>
          <p>
            Площадка не является стороной сделки между покупателем и продавцом, кроме обеспечения
            безопасного удержания средств по правилам эскроу.
          </p>
        </section>
      </div>
    </div>
  );
}
