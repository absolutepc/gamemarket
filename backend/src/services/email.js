/**
 * Email delivery via Resend (https://resend.com).
 * Env:
 *   RESEND_API_KEY  — required to actually send
 *   EMAIL_FROM      — e.g. "Lootz <noreply@lootz.ru>"
 *   FRONTEND_URL    — used in templates
 *
 * If RESEND_API_KEY is missing, sends are no-ops (logged) so local/dev still works.
 */
const logger = require('../utils/logger');

const RESEND_API = 'https://api.resend.com/emails';

function fromAddress() {
  return (
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    'Lootz <onboarding@resend.dev>'
  );
}

function isConfigured() {
  const key = String(process.env.RESEND_API_KEY || '').trim();
  return Boolean(key) && key !== 'changeme' && !/^your[_-]/i.test(key);
}

/**
 * Low-level send. Returns { ok, id?, error? }.
 */
async function sendEmail({ to, subject, html, text }) {
  if (!to) return { ok: false, error: 'missing_to' };
  if (!isConfigured()) {
    logger.info(`[email] skip (no RESEND_API_KEY): to=${to} subject=${subject}`);
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [to],
        subject,
        html,
        text: text || undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      logger.error(`[email] Resend error ${res.status}: ${JSON.stringify(data)}`);
      return { ok: false, error: data?.message || `status_${res.status}` };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    logger.error(`[email] send failed: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

function baseLayout({ title, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#0b0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b0f1a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#121826;border-radius:16px;border:1px solid #1e293b;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px 8px;text-align:center;">
              <span style="font-size:22px;font-weight:700;color:#5B8CFF;letter-spacing:-0.02em;">Lootz</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;color:#e2e8f0;font-size:15px;line-height:1.55;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #1e293b;color:#64748b;font-size:12px;text-align:center;">
              Вы получили это письмо, потому что у вас есть аккаунт на Lootz.
              Если это не вы — проигнорируйте сообщение.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendVerificationCode(to, code, username) {
  const subject = `${code} — код подтверждения Lootz`;
  const bodyHtml = `
    <p style="margin:0 0 12px;color:#94a3b8;">Здравствуйте${username ? `, <strong style="color:#e2e8f0;">${escapeHtml(username)}</strong>` : ''}!</p>
    <p style="margin:0 0 16px;">Ваш код подтверждения email:</p>
    <p style="margin:0 0 20px;text-align:center;">
      <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:0.35em;color:#fff;background:#1e293b;padding:14px 22px;border-radius:12px;border:1px solid #334155;">
        ${escapeHtml(code)}
      </span>
    </p>
    <p style="margin:0;color:#94a3b8;font-size:13px;">Код действует 15 минут. Никому его не сообщайте.</p>
  `;
  return sendEmail({
    to,
    subject,
    html: baseLayout({ title: subject, bodyHtml }),
    text: `Код подтверждения Lootz: ${code}. Действует 15 минут.`,
  });
}

async function sendNotificationEmail(to, { title, body, link }) {
  const subject = title || 'Уведомление Lootz';
  const safeBody = escapeHtml(body || '');
  const linkHtml = link
    ? `<p style="margin:20px 0 0;text-align:center;">
         <a href="${escapeHtml(link)}" style="display:inline-block;background:#5B8CFF;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">
           Открыть в Lootz
         </a>
       </p>`
    : '';
  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:17px;font-weight:600;color:#fff;">${escapeHtml(title)}</p>
    <p style="margin:0;color:#cbd5e1;">${safeBody}</p>
    ${linkHtml}
  `;
  return sendEmail({
    to,
    subject,
    html: baseLayout({ title: subject, bodyHtml }),
    text: `${title}\n\n${body || ''}${link ? `\n\n${link}` : ''}`,
  });
}

module.exports = {
  sendEmail,
  sendVerificationCode,
  sendNotificationEmail,
  isConfigured,
};
