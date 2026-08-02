# Подключение lootz.ru

## 1. Cloudflare (DNS + прокси)

1. Зарегистрируйтесь на https://dash.cloudflare.com
2. Add a site → `lootz.ru`
3. Смените NS-серверы у регистратора домена на те, что даст Cloudflare
4. Дождитесь статуса **Active**

## 2. Railway — Custom Domain

1. Railway → сервис **frontend** → Settings → Networking → **Custom Domain**
2. Добавьте `lootz.ru` (и при желании `www.lootz.ru`)
3. Railway покажет записи **CNAME** и **TXT** — добавьте обе в Cloudflare DNS
4. В Cloudflare для CNAME включите **Proxied** (оранжевое облако)
5. Cloudflare → SSL/TLS → режим **Full** (не Flexible, не Full Strict)

## 3. Переменные окружения Railway

### Backend
```
FRONTEND_URL=https://lootz.ru
ALLOWED_ORIGINS=https://lootz.ru,https://www.lootz.ru
```

### Frontend
```
BACKEND_URL=<внутренний/публичный URL backend-сервиса в Railway>
```
`BACKEND_URL` обычно уже настроен — не меняйте без необходимости.

После смены переменных сделайте **Redeploy** backend и frontend.

## 4. OAuth (Google / VK / Apple)

Подробная инструкция: [OAUTH_SETUP.md](./OAUTH_SETUP.md)

**Сейчас активен Google.** VK ID и Apple ID отложены — чтобы включить позже:

```
VK_OAUTH_ENABLED=true
VK_APP_ID=...
VK_CLIENT_SECRET=...

APPLE_OAUTH_ENABLED=true
APPLE_CLIENT_ID=ru.lootz.web
```

Trusted redirects:
```
https://www.lootz.ru/auth/google/callback
https://www.lootz.ru/auth/vk/callback
https://www.lootz.ru/auth/apple/callback
```

## 5. Проверка

- https://lootz.ru открывается без VPN
- /api/health отвечает через тот же домен (прокси фронта)
- Логин Google работает (VK / Apple — после `*_OAUTH_ENABLED=true`)
- Cookies / сессия не ломаются
