import Layout from '../components/Layout';
import CmsContent from '../components/CmsContent';
import PageNotice from '../components/PageNotice';
import { cmsBindings } from '../platform/config';
import { loadCmsPage } from '../platform/pages';

export const getServerSideProps = ({ query, res }) => loadCmsPage(cmsBindings.privacy, query, res);

// The footer sends HP LIFE visitors to HP's own privacy statement; this route exists for brands that publish their own.
export default function Privacy({ locale, page, message }) {
  if (!page) return <PageNotice locale={locale} message={message} />;
  return <Layout locale={locale} title={page.title} description={page.seo?.description} keywords={page.seo?.keywords}>
    <div className="wrapper flex-column"><CmsContent page={page} id="privacy" /></div>
  </Layout>;
}
