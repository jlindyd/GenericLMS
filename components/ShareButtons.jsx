import { styled } from '@mui/material';
import { translate } from '../platform/i18n';

// Facebook, X, LinkedIn and email share links, ported from the existing site's SocialMediaShare (without its analytics call).
const Row = styled('div')`
  display: flex;
  .resp-sharing-button__link, .resp-sharing-button__icon { display: inline-block; }
  .resp-sharing-button__link { text-decoration: none; color: var(--white); margin: 0.1em; }
  .resp-sharing-button { display: inline-block; border-radius: 5px; transition: 25ms ease-out; padding: 0.5em 0.75em; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; }
  .resp-sharing-button__icon svg { width: 1em; height: 1em; margin-right: 0.4em; vertical-align: top; }
  .resp-sharing-button--small svg { margin: 0; vertical-align: middle; }
  .resp-sharing-button__icon { stroke: var(--white); fill: none; }
  .resp-sharing-button__icon--solid { fill: var(--white); stroke: none; }
  .resp-sharing-button--facebook { background-color: var(--facebook); border-color: var(--facebook); }
  .resp-sharing-button--email { background-color: var(--email); border-color: var(--email); }
  .resp-sharing-button--linkedin { background-color: var(--linkedin); border-color: var(--linkedin); }
  .resp-sharing-button--facebook:hover, .resp-sharing-button--facebook:active, .resp-sharing-button--x:hover, .resp-sharing-button--x:active, .resp-sharing-button--email:hover, .resp-sharing-button--email:active, .resp-sharing-button--linkedin:hover, .resp-sharing-button--linkedin:active { filter: brightness(85%); }
`;

export default function ShareButtons({ url, xText, mailSubject, mailBody, locale = 'en' }) {
  const label = medium => translate(locale, 'CoursePage', 'shareThrough', 'Share through {medium}').replace('{medium}', medium);
  const mail = `?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
  const link = { className: 'resp-sharing-button__link', target: '_blank', rel: 'noopener noreferrer' };
  return <Row>
    <a {...link} href={`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} aria-label={label('Facebook')}>
      <div className="resp-sharing-button resp-sharing-button--facebook resp-sharing-button--small"><div aria-hidden="true" className="resp-sharing-button__icon resp-sharing-button__icon--solid">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" /></svg>
      </div></div>
    </a>
    <a {...link} href={`https://x.com/intent/post?text=${encodeURIComponent(xText)}`} aria-label={label('X')}>
      <div className="resp-sharing-button--x">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="6" fill="black" /><path d="M25.2213 11.5H27.9803L21.9224 18.714L29 28.5H23.4459L19.0973 22.5531L14.119 28.5H11.3599L17.7777 20.7841L11 11.5H16.6921L20.6208 16.9325L25.2213 11.5ZM24.2556 26.8063H25.7851L15.8884 13.131H14.2449L24.2556 26.8063Z" fill="white" /></svg>
      </div>
    </a>
    <a {...link} href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} aria-label={label('LinkedIn')}>
      <div className="resp-sharing-button resp-sharing-button--linkedin resp-sharing-button--small"><div aria-hidden="true" className="resp-sharing-button__icon resp-sharing-button__icon--solid">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6.5 21.5h-5v-13h5v13zM4 6.5C2.5 6.5 1.5 5.3 1.5 4s1-2.4 2.5-2.4c1.6 0 2.5 1 2.6 2.5 0 1.4-1 2.5-2.6 2.5zm11.5 6c-1 0-2 1-2 2v7h-5v-13h5V10s1.6-1.5 4-1.5c3 0 5 2.2 5 6.3v6.7h-5v-7c0-1-1-2-2-2z" /></svg>
      </div></div>
    </a>
    <a {...link} href={`mailto:${mail}`} aria-label={label('Mail')}>
      <div className="resp-sharing-button resp-sharing-button--email resp-sharing-button--small"><div aria-hidden="true" className="resp-sharing-button__icon resp-sharing-button__icon--solid">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 4H2C.9 4 0 4.9 0 6v12c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM7.25 14.43l-3.5 2c-.08.05-.17.07-.25.07-.17 0-.34-.1-.43-.25-.14-.24-.06-.55.18-.68l3.5-2c.24-.14.55-.06.68.18.14.24.06.55-.18.68zm4.75.07c-.1 0-.2-.03-.27-.08l-8.5-5.5c-.23-.15-.3-.46-.15-.7.15-.22.46-.3.7-.14L12 13.4l8.23-5.32c.23-.15.54-.08.7.15.14.23.07.54-.16.7l-8.5 5.5c-.08.04-.17.07-.27.07zm8.93 1.75c-.1.16-.26.25-.43.25-.08 0-.17-.02-.25-.07l-3.5-2c-.24-.13-.32-.44-.18-.68s.44-.32.68-.18l3.5 2c.24.13.32.44.18.68z" /></svg>
      </div></div>
    </a>
  </Row>;
}
