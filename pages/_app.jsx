import '../styles.css';
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';
import { GlobalStyles } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../brand/hplife-theme';
import { globalCss } from '../platform/global-styles';

export default function App(props) {
  const { Component, pageProps } = props;
  return <AppCacheProvider {...props}>
    <ThemeProvider theme={theme}>
      {/* The existing learner site's global styles (reset, brand variables, wrapper and editor rules), generated from its source. */}
      <GlobalStyles styles={globalCss} />
      <Component {...pageProps} />
    </ThemeProvider>
  </AppCacheProvider>;
}
