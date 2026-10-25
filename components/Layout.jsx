import Head from 'next/head';
import { direction } from '../platform/config';
import Header from './Header';
import Footer from './Footer';
import AlertBanner from './AlertBanner';

// Page frame shared by every GenericLMS page: skip link, header, main content, footer. Text direction follows the language.
export default function Layout({ locale = 'en', title, description, keywords, image, alert, children }) {
  return <div dir={direction(locale)} lang={locale}>
    <Head>
      <title>{title || 'HP LIFE'}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      {image && <meta property="og:image" content={image} />}
      {image && <meta name="x:image" content={image} />}
      {image && <meta name="x:card" content="summary_large_image" />}
      {title && <meta property="og:title" content={title} />}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <AlertBanner alert={alert} />
    <Header locale={locale} />
    <main id="main-content">{children}</main>
    <Footer locale={locale} />
  </div>;
}
