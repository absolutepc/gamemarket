import Seo from '../components/Seo';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Seo
        title="Политика конфиденциальности"
        description="Как Lootz обрабатывает и защищает персональные данные пользователей."
        path="/privacy"
      />
      <h1 className="text-3xl font-bold mb-2">Политика конфиденциальности</h1>
      <p className="text-dark-400 mb-8">Обновлено: 29 июля 2026</p>

      <div className="card p-6 space-y-6 text-dark-200 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">1. Какие данные мы собираем</h2>
          <p>
            При регистрации и использовании площадки мы можем обрабатывать email, имя пользователя,
            данные профиля, историю сделок и технические логи (IP, устройство, cookies).
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">2. Зачем нужны данные</h2>
          <p>
            Данные используются для работы аккаунта, безопасных сделок через эскроу, поддержки,
            предотвращения мошенничества и улучшения сервиса.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">3. Передача третьим лицам</h2>
          <p>
            Мы не продаём персональные данные. Передача возможна платёжным и инфраструктурным
            провайдерам, а также по законному запросу государственных органов.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">4. Хранение и защита</h2>
          <p>
            Доступ к данным ограничен. Пароли хранятся в хешированном виде. Вы можете запросить
            удаление или изменение данных через поддержку.
          </p>
        </section>
      </div>
    </div>
  );
}
