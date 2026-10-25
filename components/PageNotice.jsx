import Layout from './Layout';

// Shown when a CMS page cannot be read (missing in this language, or the content service is down).
export default function PageNotice({ locale, message }) {
  return <Layout locale={locale} title="HP LIFE"><div className="wrapper flex-column"><h1 role="alert">{message}</h1></div></Layout>;
}
