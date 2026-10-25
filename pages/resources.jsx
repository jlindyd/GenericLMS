import Layout from '../components/Layout';
import CmsContent from '../components/CmsContent';
import PageNotice from '../components/PageNotice';
import { cmsBindings } from '../platform/config';
import { loadCmsPage } from '../platform/pages';

export const getServerSideProps = ({ query, res }) => loadCmsPage(cmsBindings.resources, query, res);

export default function Resources({ locale, page, message }) {
  if (!page) return <PageNotice locale={locale} message={message} />;
  return <Layout locale={locale} title={page.title} description={page.seo?.description} keywords={page.seo?.keywords}>
    <section><CmsContent page={page} id="resources" /></section>
  </Layout>;
}
