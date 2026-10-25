import Head from 'next/head';
import { direction } from '../platform/config';
import Header from './Header';
import Footer from './Footer';

// Page frame shared by every GenericLMS page: skip link, header, main content, footer. Text direction follows the language.
export default function Layout({ locale = 'en', title, description, keywords, children }) {
  return <div dir={direction(locale)} lang={locale}>
    <Head>
      <title>{title || 'HP LIFE'}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <Header locale={locale} />
    <main id="main-content">{children}</main>
    <Footer locale={locale} />
  </div>;
}
