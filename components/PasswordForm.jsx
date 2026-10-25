import { useState } from 'react';
import { Alert, Box } from '@mui/material';
import { ButtonRow, Frame, Group, LegacyButton, Mandatory } from './ProfileParts';
import { translate } from '../platform/i18n';

// "Change password" (old password, new password, confirmation) and "Create password" (no old password), ported from the existing site's
// ChangePassword. The new password must have 8 to 20 characters with an upper case letter, a lower case letter, a number and a symbol.
const lang = locale => (locale === 'en' ? '' : `?lang=${locale}`);
const strong = value => value.length >= 8 && value.length <= 20 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9_]/.test(value);

export default function PasswordForm({ locale, email, creating }) {
  const create = key => translate(locale, 'CreatePassword', key);
  const change = key => translate(locale, 'ChangePasswordPage', key);
  const [oldPassword, setOld] = useState(''), [password, setPassword] = useState(''), [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({}), [failure, setFailure] = useState(''), [sending, setSending] = useState(false);
  const clear = name => setErrors(current => ({ ...current, [name]: '' }));
  const save = async event => {
    event.preventDefault();
    const next = {};
    if (!creating && oldPassword === '') next.old = create('oldpasswordEmptyError');
    else if (password === '') next.password = create('passwordEmptyError');
    else if (!strong(password)) next.rule = true;
    else if (confirm === '') next.confirm = change('newpasswordEmptyError');
    else if (password !== confirm) next.confirm = create('confirmPasswordValidationError');
    setErrors(next);
    if (Object.keys(next).length) return;
    setSending(true); setFailure('');
    try {
      const response = await fetch('/api/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...(creating ? {} : { oldPassword }), newPassword: password, confirmPassword: confirm }) });
      if (response.ok) { window.location.assign(`/profile${lang(locale)}`); return; }
      setFailure(change('invalidPassword'));
    } catch { setFailure(change('invalidPassword')); }
    setSending(false);
  };
  const field = (id, label, value, set, name, error) => <>
    <Group as="div">
      <label htmlFor={id}>{label} <Mandatory>*</Mandatory></label>
      <input id={id} type="password" value={value} autoComplete={name === 'old' ? 'current-password' : 'new-password'} maxLength={256} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} onChange={event => set(event.target.value)} onFocus={() => { clear(name); if (name === 'password') clear('rule'); }} />
    </Group>
    {error && <Alert id={`${id}-error`} severity="error" icon={false} sx={{ mt: '-15px', mb: 'var(--space)' }}>{error}</Alert>}
  </>;
  return <Frame>
    <Box className="wrapper lg" sx={{ pt: 0 }}>
      <Box component="form" onSubmit={save} noValidate sx={{ width: '100%', display: { md: 'grid' }, gridTemplateColumns: { md: '50% 1fr' }, gridGap: { md: 'var(--space-xlg)' },
        '& label': { display: 'block', fontFamily: 'var(--primary-font)', fontWeight: 'var(--font-normal)', marginBottom: 'var(--space-xs)' },
        '& input': { display: 'block', width: '100%', padding: 'var(--space-sm)', fontSize: 'var(--text-size)', border: '1px solid var(--border-color)', height: 34, color: '#475060' } }}>
        <div>
          {!creating && field('password-old', create('oldpassword'), oldPassword, setOld, 'old', errors.old)}
          {failure && <Alert severity="error" icon={false} role="alert" sx={{ mt: '-15px', mb: 'var(--space)' }}>{failure}</Alert>}
          {field('password-new', create('password'), password, setPassword, 'password', errors.password)}
          {errors.rule && <Box role="alert" sx={{ mt: '-15px', mb: 'var(--space)', display: 'block', bgcolor: 'var(--danger-color-light)', color: 'var(--danger-color)', p: 'var(--space-sm) var(--space-lg) var(--space-sm) var(--space)' }}>
            <div>{create('titleMessage1')} {email} <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: create('titleMessage2') }} /></div>
          </Box>}
          {field('password-confirm', create('confirmpassword'), confirm, setConfirm, 'confirm', errors.confirm)}
        </div>
      </Box>
      <ButtonRow>
        <Box sx={{ display: 'flex', gap: '10px', flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
          <LegacyButton type="submit" onClick={save} disabled={sending}>{change('save')}</LegacyButton>
          <LegacyButton type="button" outline onClick={() => window.location.assign(`/profile${lang(locale)}`)}>{change('cancel')}</LegacyButton>
        </Box>
      </ButtonRow>
    </Box>
  </Frame>;
}
