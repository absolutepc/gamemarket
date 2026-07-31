import { Link } from 'react-router-dom';
import Seo from '../components/Seo';

export default function RulesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Seo
        title="Правила площадки"
        description="Правила Lootz: безопасные сделки, эскроу, запрещённые товары и ответственность сторон."
        path="/rules"
      />
      <h1 className="text-3xl font-bold mb-2">Правила площадки</h1>
      <p className="text-dark-400 mb-8">Обновлено: 29 июля 2026</p>

      <div className="card p-6 space-y-6 text-dark-200 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">1. Общие положения</h2>
          <p>
            Lootz — торговая площадка для покупки и продажи игровых товаров.
            Используя сервис, вы соглашаетесь с этими правилами.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">2. Безопасные сделки</h2>
          <p>
            Все покупки проходят через эскроу: средства покупателя резервируются до подтверждения
            получения товара. Продавец получает оплату после успешного завершения сделки.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">3. Обязанности продавца</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Указывать достоверное описание лота</li>
            <li>Передавать товар в разумный срок после оплаты</li>
            <li>Не размещать запрещённые или мошеннические предложения</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">4. Обязанности покупателя</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Проверять товар перед подтверждением сделки</li>
            <li>Не подтверждать получение заранее</li>
            <li>Открывать спор при проблемах с заказом</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">5. Запрещено</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Мошенничество и фишинг</li>
            <li>Продажа краденых аккаунтов и данных</li>
            <li>Обход эскроу и сделки вне площадки</li>
            <li>Оскорбления, спам и манипуляции рейтингом</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">6. Споры</h2>
          <p>
            При конфликте стороны могут открыть спор. Администрация рассматривает переписку,
            доказательства и историю сделки, после чего принимает решение о возврате или выплате.
          </p>
        </section>

        <p className="pt-2 text-sm text-dark-400">
          Вопросы по правилам: <Link to="/support" className="text-brand-400 hover:underline">Поддержка</Link>
        </p>
      </div>
    </div>
  );
}
