import { useState } from 'react';
import { Alert, Box, Button, Checkbox, Typography } from '@mui/material';
import { Buttons, ButtonRow, Fieldset, Form, Frame, Group, Mandatory, PageTitle, TitleBox } from './ProfileParts';
import { locales } from '../platform/config';
import { countries, languageNames, timeZones } from '../platform/profile-lists';
import { translate } from '../platform/i18n';

// "Edit profile": name, language, time zone, country, gender and the newsletter choice. Saving goes through /api/profile and returns to the
// profile page in the language the visitor picked. Ported from the existing site's EditProfile.
const lang = locale => (locale === 'en' ? '' : `?lang=${locale}`);
// The order the existing site lists the languages in.
const languageOrder = ['en', 'fr', 'ar', 'hi', 'pt', 'es', 'zh-Hans', 'id'].filter(code => locales.includes(code));

export default function EditProfileForm({ locale, profile }) {
  const t = key => translate(locale, 'EditProfileForm', key);
  const [name, setName] = useState(profile.fullName), [language, setLanguage] = useState(profile.language), [timeZone, setTimeZone] = useState(profile.timeZone);
  const [country, setCountry] = useState(profile.country || 'BY'), [gender, setGender] = useState(profile.gender || ''), [subscribed, setSubscribed] = useState(profile.isSubscribed);
  const [nameError, setNameError] = useState(''), [error, setError] = useState(''), [sending, setSending] = useState(false);
  const genders = { Male: t('male'), Female: t('female'), PreferNotToAnswer: t('preferNotToAnswer') };
  const save = async event => {
    event.preventDefault();
    if (!name.trim()) { setNameError(t('usernamecannotbeempty')); return; }
    setSending(true); setError('');
    try {
      const response = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: name, language, timeZone, country, gender: gender || undefined, isSubscribed: subscribed }) });
      if (!response.ok) { const data = await response.json().catch(() => ({})); setError(data.message || 'Your changes could not be saved. Please try again.'); setSending(false); return; }
      window.location.assign(`/profile${lang(language)}`);
    } catch { setError('Your changes could not be saved. Please try again.'); setSending(false); }
  };
  return <Frame>
    <div className="wrapper lg">
      <TitleBox><PageTitle>{t('completeyouprofile')}</PageTitle></TitleBox>
      <Form onSubmit={save} noValidate>
        <Fieldset>
          <Group>
            <label htmlFor="profile-name">{t('name')} <Mandatory red>*</Mandatory></label>
            <input id="profile-name" type="text" value={name} placeholder={t('nameplaceholder')} maxLength={200} aria-invalid={!!nameError} aria-describedby={nameError ? 'profile-name-error' : undefined} onChange={event => { setName(event.target.value); setNameError(''); }} />
            <Typography fontWeight={400} fontSize="1.6rem">{t('noteForUser')}</Typography>
          </Group>
          {nameError && <Alert id="profile-name-error" severity="error" icon={false} sx={{ my: 4 }}>{nameError}</Alert>}
          <Group><label>{translate(locale, 'MyProfileViewForm', 'email')}: {profile.email}</label></Group>
          {error && <Alert severity="error" icon={false} sx={{ my: 4 }}>{error}</Alert>}
        </Fieldset>
        <Fieldset>
          <Group>
            <label htmlFor="profile-language">{t('selectyourlanguage')} <Mandatory red>*</Mandatory></label>
            <select id="profile-language" value={language} onChange={event => setLanguage(event.target.value)}>{languageOrder.map(code => <option key={code} value={code}>{languageNames[code]}</option>)}</select>
          </Group>
          <Group>
            <label htmlFor="profile-timezone">{t('timezone')} <Mandatory red>*</Mandatory></label>
            <select id="profile-timezone" value={timeZone} onChange={event => setTimeZone(event.target.value)}>{timeZones.map(zone => <option key={zone} value={zone}>{zone}</option>)}</select>
          </Group>
          <Group>
            <label htmlFor="profile-country">{t('country')} <Mandatory red>*</Mandatory></label>
            <select id="profile-country" value={country} onChange={event => setCountry(event.target.value)}>{Object.entries(countries).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select>
          </Group>
          <Group>
            <label htmlFor="profile-gender">{t('gender')}</label>
            <select id="profile-gender" value={gender || t('pleaseSelectOption')} onChange={event => setGender(event.target.value === t('pleaseSelectOption') ? '' : event.target.value)}>
              <option value={t('pleaseSelectOption')}>{t('pleaseSelectOption')}</option>
              {Object.entries(genders).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Group>
          <Box sx={{ display: 'flex', alignItems: 'center', '& label': { margin: 0 } }}>
            <Checkbox id="newsletterEnabled" checked={subscribed} onChange={(_, checked) => setSubscribed(checked)} sx={{ color: 'action.active', p: 0, mr: 1, '& .MuiSvgIcon-root': { fontSize: 24 } }} />
            <label htmlFor="newsletterEnabled">{translate(locale, 'BrandProgram', 'footerNote2')}</label>
          </Box>
        </Fieldset>
      </Form>
      <ButtonRow>
        <Buttons>
          <Button size="medium" sx={{ minWidth: 130, fontWeight: 500 }} variant="outlinedPrimary" href={`/profile${lang(locale)}`}>{t('cancel')}</Button>
          <Button size="medium" sx={{ minWidth: 130, fontWeight: 500 }} variant="containedPrimary" loading={sending} disabled={sending} onClick={save}>{t('save')}</Button>
        </Buttons>
      </ButtonRow>
    </div>
  </Frame>;
}
