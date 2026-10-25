import { resolveLocale } from './config.js';
import { pagePath, readService, ServiceError } from './server.js';
import { cleanPage } from './sanitize.js';

// One CMS page for a server-rendered route. Returns props the page components understand; failures become a message, not a crash.
export async function loadCmsPage(cmsPath, query, res, extra) {
  const locale = resolveLocale(query.lang);
  try {
    const page = await readService('cms', pagePath(cmsPath, locale));
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return { props: { locale, page: cleanPage(page), ...(extra ? await extra(locale) : {}) } };
  } catch (error) {
    res.statusCode = error instanceof ServiceError && error.status === 404 ? 404 : 502;
    return { props: { locale, page: null, message: error instanceof ServiceError ? error.message : 'The content service is unavailable. Please retry.' } };
  }
}
