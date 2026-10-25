// Dates are shown in UTC so the server and the browser always agree. Long dates as the existing site writes them: "05 March 2026" in English and Hindi, the locale's own long form elsewhere.
export function formatLongDate(value, locale = 'en') {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return '';
  if (locale === 'en' || locale === 'hi') return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}
