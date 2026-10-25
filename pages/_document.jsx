import { Html, Head, Main, NextScript } from 'next/document';
import { DocumentHeadTags, documentGetInitialProps } from '@mui/material-nextjs/v15-pagesRouter';

export default function Document(props) {
  return <Html lang="en">
    <Head>
      <link rel="icon" href="/favicon.ico" />
      <DocumentHeadTags {...props} />
    </Head>
    <body><Main /><NextScript /></body>
  </Html>;
}

Document.getInitialProps = async ctx => documentGetInitialProps(ctx);
