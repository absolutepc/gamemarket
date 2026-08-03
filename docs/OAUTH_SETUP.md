# OAuth: Google, VK ID и Apple ID

Вход через соцсети настраивается переменными на **backend** (Railway).
Кнопки на `/login` появляются только при **реальных** ключах (не заглушках вроде `ваш_app_id`).

**Сейчас:** активен только **Google**. VK ID и Apple ID **отложены** — код на месте, кнопки скрыты,
пока не выставите `VK_OAUTH_ENABLED=true` / `APPLE_OAUTH_ENABLED=true` вместе с ключами.

## 0. Общие переменные backend

```
FRONTEND_URL=https://www.lootz.ru
ALLOWED_ORIGINS=https://www.lootz.ru,https://lootz.ru,https://gamemarket-production-92a3.up.railway.app
```

После смены — **Redeploy** backend.

---

## 1. VK ID — отложено

Чтобы снова включить кнопку:
```
VK_OAUTH_ENABLED=true
VK_APP_ID=...
VK_CLIENT_SECRET=...
```

### A. Кабинет
1. Откройте https://id.vk.com/about/business (не dev.vk.com с играми)
2. Войдите → создайте/подтвердите профиль бизнеса при необходимости
3. **Добавить приложение** → платформа **Web**
4. Название: `Lootz`
5. Базовый домен: `www.lootz.ru`
6. Доверенный redirect URL (вставить как есть):
   ```
   https://www.lootz.ru/auth/vk/callback
   ```
7. Создать → скопировать:
   - **ID приложения** (число, например `54123456`)
   - **Защищённый ключ**

### B. Railway → backend → Variables
```
VK_OAUTH_ENABLED=true
VK_APP_ID=54123456
VK_CLIENT_SECRET=реальный_защищённый_ключ
```
Redeploy backend.

### C. Проверка
`/login` → кнопка «Войти через VK ID» → вход создаёт пользователя.

---

## 2. Google (Gmail) — по шагам

### A. Google Cloud Console
1. Откройте https://console.cloud.google.com/apis/credentials
2. Создайте проект (или выберите существующий) → **Create credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Lootz Web`
5. Authorized JavaScript origins:
   ```
   https://www.lootz.ru
   https://lootz.ru
   ```
6. Authorized redirect URIs:
   ```
   https://www.lootz.ru/auth/google/callback
   https://lootz.ru/auth/google/callback
   ```
7. Create → скопируйте **Client ID** и **Client Secret**

Если впервые — настройте **OAuth consent screen** (External, app name Lootz, support email).

### B. Railway → backend → Variables
```
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
FRONTEND_URL=https://www.lootz.ru
```
Redeploy backend.

### C. Проверка
`GET /api/auth/providers` → `google.enabled: true`  
`/login` → кнопка «Войти через Google».

---

## 3. Apple ID — отложено

Нужен аккаунт [Apple Developer](https://developer.apple.com/account) (платный, ~$99/год).

Чтобы снова включить кнопку:
```
APPLE_OAUTH_ENABLED=true
APPLE_CLIENT_ID=ru.lootz.web
```

### A. Identifiers
1. Certificates, Identifiers & Profiles → **Identifiers**
2. Создайте **App ID** с capability **Sign In with Apple**
3. Создайте **Services ID** (это client id), пример: `ru.lootz.web`
4. У Services ID → Sign In with Apple → Configure:
   - Domains: `www.lootz.ru`, `lootz.ru`
   - Return URLs:
     ```
     https://www.lootz.ru/auth/apple/callback
     ```
5. Сохраните Services ID string

### B. Railway → backend → Variables
```
APPLE_OAUTH_ENABLED=true
APPLE_CLIENT_ID=ru.lootz.web
```
Redeploy backend.

### C. Проверка
`/login` → «Войти через Apple».

---

## Частые ошибки

| Проблема | Причина |
|----------|---------|
| Кнопок нет | Пустые или заглушечные `GOOGLE_*` / `VK_APP_ID` / `APPLE_CLIENT_ID` |
| Нет VK / Apple | Не выставлен `VK_OAUTH_ENABLED=true` / `APPLE_OAUTH_ENABLED=true` (сейчас отложены) |
| Google: redirect_uri_mismatch | В Cloud Console URL ≠ `https://www.lootz.ru/auth/google/callback` |
| VK: redirect mismatch | В кабинете URL ≠ `https://www.lootz.ru/auth/vk/callback` |
| Apple: invalid client | Domains/Return URL не совпадают с сайтом |
| Cookies не держатся | `FRONTEND_URL` / `ALLOWED_ORIGINS` без `www.lootz.ru` |

Проверка API: `GET /api/auth/providers` → у `google`/`vk`/`apple` должно быть `"enabled": true` и реальный `clientId`/`appId`.
