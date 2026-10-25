import { resolveLocale } from './config.js';
import { readService } from './server.js';
import { cleanHtml } from './sanitize.js';

// The site-wide notice (for example planned maintenance) from the Alerts service; the first current one is shown. Never blocks a page.
export async function loadAlert(locale) {
  try {
    const list = await readService('alerts', `Alerts/current?${new URLSearchParams({ language: resolveLocale(locale) })}`);
    const alert = Array.isArray(list) ? list[0] : null;
    return alert ? { id: alert.id, type: alert.type === 'Error' ? 'Error' : 'Success', message: cleanHtml(alert.message) } : null;
  } catch { return null; }
}
