// Dates are shown in UTC so the server and the browser always agree. Long dates as the existing site writes them: "05 March 2026" in English and Hindi, the locale's own long form elsewhere.
export function formatLongDate(value, locale = 'en') {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return '';
  if (locale === 'en' || locale === 'hi') return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}

// Short numeric dates on course cards ("7/29/2026"), in the order each language uses, as the existing site's getDatePattern does.
const shortPatterns = { ar: 'd/M/yyyy', en: 'M/d/yyyy', es: 'd/M/yyyy', fr: 'dd/MM/yyyy', hi: 'd/M/yyyy', pt: 'dd/MM/yyyy', 'zh-Hans': 'yyyy/M/d', id: 'dd/MM/yyyy' };
export function formatShortDate(value, locale = 'en') {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return '';
  const parts = { yyyy: String(date.getUTCFullYear()), MM: String(date.getUTCMonth() + 1).padStart(2, '0'), dd: String(date.getUTCDate()).padStart(2, '0'), M: String(date.getUTCMonth() + 1), d: String(date.getUTCDate()) };
  return (shortPatterns[locale] || shortPatterns.en).replace(/yyyy|MM|dd|M|d/g, token => parts[token]);
}
