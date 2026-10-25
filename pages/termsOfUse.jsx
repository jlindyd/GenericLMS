import Layout from '../components/Layout';
import CmsContent from '../components/CmsContent';
import PageNotice from '../components/PageNotice';
import { cmsBindings } from '../platform/config';
import { loadCmsPage } from '../platform/pages';

export const getServerSideProps = ({ query, res }) => loadCmsPage(cmsBindings.termsOfUse, query, res);

// Same frame as the existing site: the CMS text sits in a plain wrapper.
export default function TermsOfUse({ locale, page, message }) {
  if (!page) return <PageNotice locale={locale} message={message} />;
  return <Layout locale={locale} title={page.title} description={page.seo?.description} keywords={page.seo?.keywords}>
    <div className="wrapper flex-column"><CmsContent page={page} id="terms-of-use" /></div>
  </Layout>;
}
