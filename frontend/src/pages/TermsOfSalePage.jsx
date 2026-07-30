import Seo from '../components/Seo';
import { Link } from 'react-router-dom';

export default function TermsOfSalePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Seo
        title="Условия продажи"
        description="Условия продажи на Lootz: комиссия 7.5% / 17.5%, эскроу, вывод средств и ответственность продавца."
        path="/terms-of-sale"
      />
      <h1 className="text-3xl font-bold mb-2">Условия продажи</h1>
      <p className="text-dark-400 mb-8">Для продавцов Lootz · комиссия 7.5% или 17.5%</p>

      <div className="card p-6 space-y-6 text-dark-200 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">1. Размещение лотов</h2>
          <p>
            Продавец может размещать цифровые товары и услуги: игровую валюту, аккаунты, предметы,
            подписки ИИ, Telegram Stars, монеты TikTok, пополнение Steam, подарочные карты App Store и другое.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">2. Комиссия площадки</h2>
          <p className="mb-3">
            Комиссия Lootz зависит от категории товара и удерживается при выплате продавцу:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-white">7.5%</strong> — подписки, пополнения, подарочные карты, AI и сервисы
            </li>
            <li>
              <strong className="text-white">17.5%</strong> — аккаунты, предметы, игровая валюта, бусты и прочее
            </li>
          </ul>
          <p className="mt-3">
            Пример: при цене 1000 ₽ продавец получит 925 ₽ (7.5%) или 825 ₽ (17.5%) после подтверждения покупателем.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">3. Эскроу</h2>
          <p>
            После оплаты сумма блокируется до передачи товара. Автоматическое освобождение эскроу
            возможно через 72 часа после передачи, если покупатель не открыл спор.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">4. Скидки</h2>
          <p>
            Продавец может указать старую цену при создании или редактировании лота.
            Площадка автоматически рассчитает процент скидки и покажет его в каталоге.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">5. Вывод средств</h2>
          <p>
            Доступный баланс можно вывести через СБП, карту или криптовалюту в разделе «Кошелёк».
            Минимальная сумма вывода — 100 ₽.
            <strong className="text-white"> Площадка не берёт комиссию за вывод</strong> —
            продавец получает сумму с баланса без дополнительного процента Lootz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">6. Ответственность</h2>
          <p>
            Продавец несёт ответственность за соответствие товара описанию и за законность предложения.
            Нарушение правил может привести к блокировке аккаунта и отмене выплат.
          </p>
        </section>

        <p className="text-sm text-dark-400 pt-2">
          См. также <Link to="/rules" className="text-brand-400 hover:underline">Правила площадки</Link>
        </p>
      </div>
    </div>
  );
}
