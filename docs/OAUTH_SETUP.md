# OAuth: VK ID и Apple ID

Вход через соцсети настраивается переменными окружения на **backend**. Кнопки на `/login` и `/register` появляются только когда соответствующий провайдер включён.

## Общие требования

На backend (Railway → Backend → Variables):

```
FRONTEND_URL=https://lootz.ru
ALLOWED_ORIGINS=https://lootz.ru,https://www.lootz.ru,https://gamemarket-production-92a3.up.railway.app
```

`FRONTEND_URL` должен совпадать с доменом, с которого открывается сайт (без слэша в конце). После смены переменных — Redeploy backend.

---

## VK ID

### 1. Кабинет VK

1. Создайте приложение на [id.vk.com](https://id.vk.com)
2. В Trusted redirect URI добавьте:
   ```
   https://lootz.ru/auth/vk/callback
   ```
   (и при необходимости Railway URL: `https://<frontend>.up.railway.app/auth/vk/callback`)
3. Скопируйте **App ID** и **Secure key** (client secret)

### 2. Переменные backend

```
VK_APP_ID=12345678
VK_CLIENT_SECRET=xxxxxxxx
```

### 3. Проверка

- Откройте `/login` — видна кнопка «Войти через VK ID»
- После входа создаётся/линкуется пользователь с `auth_provider=vk`

---

## Apple ID (Sign in with Apple)

### 1. Apple Developer

1. В [Apple Developer](https://developer.apple.com/account) создайте **App ID** с capability **Sign In with Apple**
2. Создайте **Services ID** (это и есть `APPLE_CLIENT_ID`, например `ru.lootz.web`)
3. Для Services ID включите Sign In with Apple → Configure:
   - Domains: `lootz.ru` (и Railway-домен фронта при тестах)
   - Return URLs:
     ```
     https://lootz.ru/auth/apple/callback
     ```
4. Сохраните Services ID identifier

Для веб-входа через popup достаточно `APPLE_CLIENT_ID` — backend проверяет `identity_token` по публичным ключам Apple (JWKS). Приватный ключ (.p8) не обязателен для этого потока.

### 2. Переменные backend

```
APPLE_CLIENT_ID=ru.lootz.web
```

### 3. Проверка

- `/login` — кнопка «Войти через Apple»
- Первый вход: Apple может отдать имя/email один раз — они сохраняются на сервере
- Пользователь создаётся с `auth_provider=apple`

---

## API

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/auth/providers` | `{ vk, apple }` — enabled + client/redirect |
| GET | `/api/auth/vk/config` | конфиг VK |
| POST | `/api/auth/vk` | обмен code → сессия |
| GET | `/api/auth/apple/config` | конфиг Apple |
| POST | `/api/auth/apple` | `{ identityToken, user? }` → сессия |

---

## Troubleshooting

| Симптом | Что проверить |
|---------|----------------|
| Кнопок нет | `VK_APP_ID` / `APPLE_CLIENT_ID` не заданы на backend |
| VK: redirect mismatch | URI в кабинете VK = `{FRONTEND_URL}/auth/vk/callback` один в один |
| Apple: invalid client | Domains/Return URLs в Services ID; сайт открыт по HTTPS |
| CORS / cookies | `ALLOWED_ORIGINS` включает текущий origin; prod cookies `SameSite=None; Secure` |
