import { useState } from 'react';
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { Buttons, ButtonRow, Fieldset, Form, Frame, Group, Mandatory, PageTitle, TitleBox } from './ProfileParts';
import { brand, connection, reviewMode } from '../platform/config';
import { countries, languageNames } from '../platform/profile-lists';
import { translate } from '../platform/i18n';

// "My Profile": the visitor's details as read-only text, with buttons to edit them, change (or create) the password, ask for help and
// delete the account. Ported from the existing site's MyProfileView.
const lang = locale => (locale === 'en' ? '' : `?lang=${locale}`);

export default function ProfileView({ locale, profile, hasPassword }) {
  const t = key => translate(locale, 'MyProfileViewForm', key);
  const [confirm, setConfirm] = useState(false), [deleted, setDeleted] = useState(false), [busy, setBusy] = useState(false);
  const [mail, setMail] = useState('');
  const genders = { Male: t('male'), Female: t('female'), PreferNotToAnswer: t('preferNotToAnswer') };
  const resend = async () => { setMail(''); try { const response = await fetch('/api/verify-email', { method: 'POST' }); setMail(response.ok ? 'sent' : 'error'); } catch { setMail('error'); } };
  const remove = async () => { setBusy(true); try { await fetch('/api/account', { method: 'DELETE' }); } catch { /* the existing site also carries on to the farewell message */ } setBusy(false); setConfirm(false); setDeleted(true); };
  const signOut = () => window.location.assign(reviewMode ? '/review-signout' : `${connection.auth}/api/logout?${new URLSearchParams({ continue: window.location.href, locale })}`);
  return <Frame>
    <div className="wrapper">
      <TitleBox><PageTitle>{t('myprofile')}</PageTitle></TitleBox>
      <Form onSubmit={event => event.preventDefault()}>
        <Fieldset>
          <Group>
            <span className="label">{t('fullname')} <Mandatory>*</Mandatory></span>
            <span className="input">{profile.fullName}</span>
            <span style={{ display: 'block' }}>{t('noteForUser')}</span>
          </Group>
          <Group>
            <span className="label">{t('email')} <Mandatory>*</Mandatory></span>
            <span className="input">{profile.email}</span>
            <span>
              {!profile.emailConfirmed && <Button variant="outlinedPrimary" size="small" onClick={resend}>{t('resendEmail')}</Button>}
              {mail && <div role="status" style={{ display: 'block', width: 400, maxWidth: '100%' }}>{mail === 'sent' ? t('emainSent') : t('errorSendingEmail')}</div>}
            </span>
          </Group>
          {hasPassword && <Group><span className="label">{t('password')} <Mandatory>*</Mandatory></span><span className="input">*******</span></Group>}
        </Fieldset>
        <Fieldset>
          <Group><span className="label">{t('language')} <Mandatory>*</Mandatory></span><span className="input">{languageNames[profile.language] || ''}</span></Group>
          <Group><span className="label">{t('timezone')} <Mandatory>*</Mandatory></span><span className="input">{profile.timeZone}</span></Group>
          <Group><span className="label">{t('country')} <Mandatory>*</Mandatory></span><span className="input">{profile.country ? countries[profile.country] : ''}</span></Group>
          <Group><span className="label">{t('gender')}</span><span className="input">{profile.gender ? genders[profile.gender] : ''}</span></Group>
          <span className="label"><b>{t('emailPreferences')}</b></span>
          <Box sx={{ display: 'flex', alignItems: 'center', '& label': { margin: 0 } }}>
            <Checkbox id="newsletterEnabled" disabled checked={profile.isSubscribed} sx={{ color: 'action.active', p: 0, mr: 1, '& .MuiSvgIcon-root': { fontSize: 24 } }} />
            <span><label htmlFor="newsletterEnabled">{translate(locale, 'BrandProgram', 'footerNote2')}</label></span>
          </Box>
        </Fieldset>
      </Form>
      <ButtonRow>
        <Box sx={{ m: { xs: '1rem', md: 0 }, width: '65%', display: 'flex', flexDirection: 'column' }}>
          <a href={`mailto:${brand.supportEmail || 'support-lifeglobal@hp.com'}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--error-color, #d32f2f)', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 4 }}>{t('emailSupport')}</a>
          <Button variant="text" onClick={() => setConfirm(true)} sx={{ padding: 0, justifyContent: 'flex-start', color: 'error.main', fontWeight: 400, '&:hover': { textDecoration: 'underline' } }}>{t('requestAccountDeletion')}</Button>
        </Box>
        <Buttons>
          <Button size="medium" sx={{ minWidth: 130, fontWeight: 500 }} variant="containedPrimary" href={`/editprofile${lang(locale)}`}>{t('editprofile')}</Button>
          <Button size="medium" sx={{ minWidth: 130, fontWeight: 500 }} variant="containedPrimary" href={`${hasPassword ? '/changepassword' : '/createpassword'}${lang(locale)}`}>{hasPassword ? t('changepassword') : t('createPassword')}</Button>
        </Buttons>
      </ButtonRow>
    </div>

    <Dialog open={confirm} onClose={() => setConfirm(false)} aria-labelledby="delete-title" aria-describedby="delete-text">
      <DialogTitle id="delete-title">{t('promptQuestion')}</DialogTitle>
      <DialogContent id="delete-text">{t('promptSummary')}</DialogContent>
      <DialogActions sx={{ p: 4, gap: 2 }}>
        <Button variant="outlinedPrimary" onClick={() => setConfirm(false)}>{translate(locale, 'common', 'cancel', 'Cancel')}</Button>
        <Button variant="containedPrimary" onClick={remove} disabled={busy}>{t('confirm')}</Button>
      </DialogActions>
    </Dialog>
    <Dialog open={deleted} aria-labelledby="deleted-title" aria-describedby="deleted-text">
      <DialogTitle id="deleted-title">{t('requestAccountDeletion')}</DialogTitle>
      <DialogContent id="deleted-text"><p>{t('successMessage')}</p><p>{t('farewellMessage')}</p></DialogContent>
      <DialogActions sx={{ p: 4 }}><Button variant="containedPrimary" onClick={signOut}>{translate(locale, 'BasePageContainer', 'logoutText')}</Button></DialogActions>
    </Dialog>
  </Frame>;
}
