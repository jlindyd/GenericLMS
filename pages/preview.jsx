import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import CmsContent from '../components/CmsContent';
import { cmsOrigins, resolveLocale } from '../platform/config';
import { cleanPage } from '../platform/sanitize';

// Shows a CMS page inside the real header and footer for the CMS editors' preview. It only accepts content sent from the
// CMS app's own window; it never reads or writes anything. Next sends noindex and limits who may frame this page (next.config.js).
export default function Preview() {
  const [page, setPage] = useState(null);
  useEffect(() => {
    const onMessage = event => {
      if (!cmsOrigins.includes(event.origin) || event.source !== window.parent || event.data?.type !== 'cms-preview') return;
      const { title, content, style, language } = event.data;
      setPage({ ...cleanPage({ title: String(title ?? ''), content, style }), language: resolveLocale(language) });
    };
    window.addEventListener('message', onMessage);
    window.parent?.postMessage({ type: 'cms-preview-ready' }, '*');
    return () => window.removeEventListener('message', onMessage);
  }, []);
  if (!page) return <Layout locale="en" title="Preview"><div className="wrapper"><p>Waiting for the CMS…</p></div></Layout>;
  return <Layout locale={page.language} title={page.title}>
    <CmsContent page={page} id="preview" />
  </Layout>;
}
