import texts from './form-translations.json';
import labels from './execution-translations.json';

// Labels of the form tasks in the player's eight languages, copied from the existing player. A label missing in a language falls back
// to English, as the existing player does. `{{count}}` is filled in; counts other than one use the "_plural" label when there is one.
export function formText(locale, key, values = {}) {
  const find = (loc, k) => texts[loc]?.[k] ?? labels[loc]?.[k];
  const plural = values.count !== undefined && values.count !== 1 ? `${key}_plural` : key;
  const raw = find(locale, plural) ?? find(locale, key) ?? find('en', plural) ?? find('en', key) ?? key;
  return String(raw).replace(/\{\{(\w+)\}\}/g, (_, name) => (values[name] === undefined ? '' : String(values[name])));
}
