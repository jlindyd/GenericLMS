import '../platform/brand-variables.css';
import '../styles.css';
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../brand/hplife-theme';

export default function App(props) {
  const { Component, pageProps } = props;
  return <AppCacheProvider {...props}>
    <ThemeProvider theme={theme}><Component {...pageProps} /></ThemeProvider>
  </AppCacheProvider>;
}
