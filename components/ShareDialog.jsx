import { Box, Dialog, DialogContent, IconButton, InputBase, Snackbar, Alert } from '@mui/material';
import { Close } from '@mui/icons-material';
import { BiCopy } from 'react-icons/bi';
import { useState } from 'react';
import ShareButtons from './ShareButtons';
import { connection } from '../platform/config';
import { fill, translate } from '../platform/i18n';

// "Share what you have learned": the link of a certificate with share buttons and a copy button, ported from the existing site's SharePopup.
// Copying confirms with a short message.
export default function ShareDialog({ url, onClose, locale = 'en', subjectKey = 'shareCertMailSubject', copiedKey }) {
  const [copied, setCopied] = useState(false);
  const t = key => translate(locale, 'BrandProgram', key);
  const common = key => translate(locale, 'common', key);
  const subject = locale === 'ar' ? t('brand') : fill(t(subjectKey), { link: '' });
  const body = [locale === 'ar' ? t('brand') : fill(t('shareCertMailBody'), { link: url }), fill(t('mailSecondBody'), { link: connection.reference })].join('\r\n\r\n');
  const copy = () => { navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {}); };
  return <>
    <Dialog open={Boolean(url)} onClose={onClose} aria-labelledby="share-title" slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: { sm: 420 } } } }}>
      <IconButton onClick={onClose} aria-label={common('closeDialog')} sx={{ position: 'absolute', top: 8, insetInlineEnd: 8 }}><Close /></IconButton>
      <DialogContent sx={{ pt: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Box id="share-title" component="p" sx={{ fontWeight: 700, fontSize: '2rem', m: 0 }}>{t('shareCertificateNote')}</Box>
        <ShareButtons url={url} xText={url} mailSubject={subject} mailBody={body} locale={locale} />
        <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #000', borderRadius: '8px', pl: 2 }}>
          <InputBase value={url} readOnly inputProps={{ 'aria-label': common('copyLink') }} sx={{ flex: 1, fontSize: '1.5rem' }} />
          <IconButton onClick={copy} aria-label={common('copyLink')}><BiCopy size={18} /></IconButton>
        </Box>
      </DialogContent>
    </Dialog>
    <Snackbar open={copied} autoHideDuration={4000} onClose={() => setCopied(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert severity="success" variant="filled" role="status" onClose={() => setCopied(false)}>{copiedKey ? translate(locale, 'Badges', copiedKey) : translate(locale, 'DashboardPage', 'certificateURLCopied')}</Alert>
    </Snackbar>
  </>;
}
