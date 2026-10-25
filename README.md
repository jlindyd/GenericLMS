# GenericLMS (HP LIFE learner site, first slice)

A new learner site that must look exactly like the current HP LIFE site. It reads the same APIs; nothing in the old apps or the API repos is changed.

## What exists now
- **Frame:** header, footer, text direction and eight languages, ported from the existing site (LMSUI) using its own theme values, colors, fonts and spacing.
- **`/about`:** the CMS `about-page` record, then the success stories carousel (CMS feature scope `success-stories`) and the "Start today" section.
- **`/` (home):** campaign banners, the "about us", statistics and partners sections, and "Start today" (all from the CMS). Still to come: "Explore our courses" (needs the Learning API), the success story highlight and the news strip.
- **Text pages from the CMS:** `/help` (the support form is not built; its button opens the form on the current site), `/partners`, `/termsOfUse`, `/privacy`, `/cookie`, `/resources`.
- **News and stories:** `/news` and `/news/<path>`, `/successstories` and `/successstories/<path>`, with share buttons. Lists show up to 25 items, as the current site does.
- **`/preview`:** shows CMS content inside the real header and footer for GenericCMS. It accepts content only from the CMS app's window and may only be framed by it.
- **API routes:** `/api/content`, `/api/account` (read only).
- Links to pages not built yet (catalogue, courses, sign-in) go to the current learner site, so nothing dead-ends.

## How the look is kept the same
- `platform/global-styles.js` (used by the app) and `platform/brand-variables.css` (the same rules as plain CSS, used by the CMS preview) are generated from the existing site's own global styles and brand colors: `node GenericLMS/scripts/generate-brand-variables.cjs` from `C:\DYD\DYDLMS`. They include the page reset, `.wrapper` and editor rules, and the brand variables the CMS pages rely on (a variable the live site does not define must stay undefined here).
- Measured against the live HP LIFE Test site at 1440px: Terms, News, News article, Success Stories, Success story, Partners and Help match to the pixel in page height; About and Resources are within 12px.
- `brand/hplife-theme.js` copies the existing MUI theme.
- Compare against https://www.hplife-test.dyd.solutions at the same widths. A difference is a bug unless approved.

## Safety
- CMS HTML is cleaned on the server (`platform/sanitize.js`): scripts, event handlers, `javascript:` links and unknown embeds are removed; classes, inline styles, images and YouTube/Vimeo embeds are kept.
- CMS CSS is trusted editorial content; only an early `</style>` is blocked.
- The CMS API returns any Active page to anyone, and this app does not check the `requiresAuth` attribute yet. The two pages built so far (About, public banners) are public content. Add the check before any page that needs sign-in is added.

## Run
```
npm install
npm run serve        # builds, then serves on http://127.0.0.1:3020
npm test             # runs the verify-*.cjs suites
```
Environment: `NEXT_PUBLIC_APP_ENV` (default `hplife-test`). Galilee and RSTI entries exist in `platform/config.js` but are not verified.

## Docs
- `docs/content-ownership-and-rendering-map.md`, `docs/hp-life-test-cms-reference.md`, `docs/cms-api-findings.md`.
