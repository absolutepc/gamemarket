# Lootz — Торговая площадка для игровых товаров

Полноценная безопасная торговая площадка наподобие playerok.com с эскроу-системой, реальным чатом и защитой от кибератак.

## Функциональность

### Для пользователей
- **Регистрация / вход** — JWT + refresh tokens в httpOnly cookie
- **Каталог лотов** — поиск, фильтрация по категории, цене, игре, сортировка
- **Создание лотов** — аккаунты, предметы, валюта, бусты
- **Безопасные сделки (Escrow)** — деньги замораживаются до подтверждения получения
- **Реальный чат** — WebSocket (Socket.IO) внутри каждой сделки
- **Споры** — покупатель/продавец может открыть спор
- **Рейтинг и отзывы** — только после завершённой сделки
- **Кошелёк** — баланс, замороженные средства, история операций
- **Профиль** — активные лоты, отзывы, статистика

### Безопасность
| Угроза | Защита |
|--------|--------|
| Брутфорс / credential stuffing | Rate limiting: 10 попыток/15 мин на auth endpoints |
| XSS | Helmet CSP, xss-sanitizer на входе, React auto-escaping |
| SQL injection | Параметризованные запросы (pg), никакой конкатенации |
| CSRF | SameSite=strict cookie для refresh token |
| Session hijacking | Refresh token rotation, хэширование в БД (SHA-256) |
| Privilege escalation | Role-based access control (user/admin) |
| Overspending / race conditions | PostgreSQL `FOR UPDATE` при покупке |
| Чрезмерные запросы | Rate limiting на все API (120 req/min), stricter на мутации (20 req/min) |
| Information disclosure | Prod: sanitized error messages, структурированное логирование |
| Man-in-the-middle | HTTPS (настраивается в nginx), HSTS headers |

## Архитектура

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Browser   │────▶│  Nginx (80/443)  │────▶│   Backend    │
│  React SPA  │     │  Static + Proxy  │     │  Express.js  │
└─────────────┘     └──────────────────┘     └──────┬───────┘
                                                     │
                                              ┌──────▼───────┐
                                              │  PostgreSQL  │
                                              └──────────────┘
```

## Быстрый старт

### С Docker Compose (рекомендуется)

```bash
cp .env.example .env
# Отредактируйте .env (установите надёжные пароли!)
docker compose up --build
```

Приложение будет доступно на http://localhost

### Локальная разработка

**Требования:** Node.js 20+, PostgreSQL 14+

```bash
# Backend
cd backend
cp .env.example .env  # настройте подключение к БД
npm install
npm run migrate
npm run dev  # localhost:5000

# Frontend (в отдельном терминале)
cd frontend
npm install
npm run dev  # localhost:3000
```

## Структура проекта

```
.
├── backend/
│   └── src/
│       ├── config/          # Конфиг БД
│       ├── middleware/       # Auth, security, rate limiting
│       ├── routes/           # REST API
│       │   ├── auth.js       # /api/auth
│       │   ├── listings.js   # /api/listings
│       │   ├── transactions.js # /api/transactions (escrow)
│       │   ├── users.js      # /api/users
│       │   └── categories.js
│       ├── utils/            # Logger
│       ├── migrate.js        # SQL schema + migrations
│       └── index.js          # Express + Socket.IO
├── frontend/
│   └── src/
│       ├── components/       # Layout, ListingCard, ProtectedRoute
│       ├── pages/            # Home, Catalog, Listing, Transaction, Profile, Wallet...
│       ├── store/            # Zustand auth store
│       └── utils/            # API client (axios + token refresh), formatters
├── docker-compose.yml
└── .env.example
```

## Эскроу-логика (безопасная сделка)

```
Покупатель             Платформа              Продавец
    │                      │                      │
    │──── Купить ─────────▶│                      │
    │                      │── Заморозить сумму   │
    │                      │   у покупателя       │
    │◀─── Сделка создана ──│                      │
    │                      │──── Уведомление ────▶│
    │                      │                      │
    │                      │◀─── Передал товар ───│
    │◀─── Уведомление ─────│                      │
    │                      │                      │
    │──── Подтвердить ────▶│                      │
    │     получение        │──── Выплата ────────▶│
    │                      │    (сумма − 7.5%/17.5%) │
```

**Защита от споров:** если покупатель не подтверждает 72 часа, средства автоматически освобождаются продавцу (настраивается; требует cron/job-воркера).

## Что ещё нужно для продакшн

- [ ] Интеграция платёжного шлюза (ЮКасса / Stripe)
- [ ] Email-верификация и уведомления
- [ ] Автоматический релиз эскроу (cron job)
- [ ] Загрузка изображений (S3 / Cloudflare R2)
- [ ] Admin панель для разрешения споров
- [ ] 2FA
- [ ] HTTPS + Let's Encrypt в nginx
- [ ] Резервное копирование PostgreSQL
