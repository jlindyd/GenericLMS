# GenericLMS (HP LIFE learner site, first slice)

A new learner site that must look exactly like the current HP LIFE site. It reads the same APIs; nothing in the old apps or the API repos is changed.

## What exists now
- **Frame:** header, footer, text direction and eight languages, ported from the existing site (LMSUI) using its own theme values, colors, fonts and spacing.
- **`/about`:** the CMS `about-page` record, then the success stories carousel (CMS feature scope `success-stories`) and the "Start today" section.
- **`/` (home):** campaign banners, the "about us", statistics and partners sections, and "Start today" (all from the CMS). "Explore our courses" (category buttons and a course carousel, from the Learning API). The success stories highlight (first story featured, the rest in a carousel) and the "HP LIFE News" strip (one picture article plus three; tablet width and up, as on the current site) read the CMS feeds and are left out if a feed fails. The signed-out live home could not be measured side by side (the browser was signed in), so these two blocks follow the old site's source and its page text.
- **Text pages from the CMS:** `/help` (the support form is not built; its button opens the form on the current site), `/partners`, `/termsOfUse`, `/privacy`, `/cookie`, `/resources`.
- **News and stories:** `/news` and `/news/<path>`, `/successstories` and `/successstories/<path>`, with share buttons. Lists show up to 25 items, as the current site does.
- **`/preview`:** shows CMS content inside the real header and footer for GenericCMS. It accepts content only from the CMS app's window and may only be framed by it.
- **API routes:** `/api/content`, `/api/account` (read only).
- **Catalogue (Learning API, public reads only):** `/allcourses` (12 per page, category and sort filters, "Explore by categories"), `/categorylist/<id>-<name>`, `/search?search=...` (10 per page) and `/course/<id>-<name>` (header, facts card, Overview / Lessons / View Offline tabs, "HP LIFE Courses Offer", "Start Now"). Visitors who are not signed in see "Enroll", which opens the sign-in page and returns to the course. The "You may also like" list and progress badges are for signed-in learners and are not built.
- Links to pages not built yet (sign-in, dashboard) go to the current learner site, so nothing dead-ends.
- **Accessibility is kept from the existing site:** skip link, landmarks, one `h1`, headings in order (category cards are `h3` under an `h2`), labelled carousels, pagination with `aria-current`, visible focus, and images without alt text from the CMS are given an empty alt.

## Signed-in pages (course execution is not part of this site yet)
- **Sign-in is the existing sign-in site's.** It sets the cookies `dydBearer` (access) and `dydBearerRefresh` on the shared domain; GenericLMS only reads them (`platform/session.js`), asks the sign-in site for a new access token when it has expired, and sends visitors who are not signed in to `<auth>/api/logout?continue=...` (which clears stale cookies, then shows the sign-in page and comes back). Because the cookies belong to the shared domain (`.hplife-test.dyd.solutions`), a signed-in visit only works when GenericLMS is served from an address on that domain. On a local address the cookie never arrives; use the review mode below.
- **`/` for a signed-in visitor** (`middleware.js` shows `/home-authenticated` when the cookie exists, as the existing site does): welcome line, "My courses" carousel, coach courses, news banners, latest courses and "Explore by categories". Measured against the live site: section heights match at 1462px.
- **`/dashboard`:** tabs In progress, Completed, Coach courses, Badges, Archived (shown only when they apply), search, course-type filter, transcript download, certificate download and share, paging (12 per page, 50 for archived). Everything is driven by the address, so tabs and pages can be linked and bookmarked.
- **Header when signed in:** notifications bell (read, dismiss, clear all), "My Dashboard" button and the avatar menu (certificates, badges, profile, help, log out); on phones the same items under the visitor's name. A site-wide notice from the Alerts service shows above the header on the home pages and the dashboard.
- **Profile pages:** `/profile` (details, resend confirmation email, request account deletion), `/editprofile` (name, language, time zone, country, gender, newsletter), `/changepassword` and `/createpassword` (shown by the profile page according to whether the account has a password of its own). Saves go through `/api/profile`, `/api/password`, `/api/verify-email` and `DELETE /api/account`; each checks the values, only accepts requests from this site's own pages, and passes only the allowed requests to the Identity and Email marketing APIs (`allowedChanges` in `platform/session.js`). Passwords are passed on and never stored or logged. In review mode these saves are accepted without being sent anywhere.
- **Own-data changes** go through this site's `/api/notifications` routes (same-origin only, only the Notifications service); certificates and the transcript are passed through as PDF downloads (`/api/certificate/<id>`, `/api/transcript`).
- **Not built yet:** course execution (the Start/Continue buttons use the existing site's `/trainee/courses/...` addresses through one function, `executionHref` in `components/CourseParts.jsx`; "Start" falls back to the course page because the first lesson needs one more read), change email, email confirmation, certificates page and badge public pages (links go to the existing site), certifications, books, keys and redeem (switched off for HP LIFE).
- **Review mode without the real cookie:** `node scripts/serve-with-fixtures.cjs` (or the `generic-lms-fixtures` preview) serves with `GENERIC_LMS_FIXTURES=1`; set the cookie `dydBearer=fixture` in the browser and the signed-in pages show stand-in learner data (public data stays real). It is for local review only and does nothing unless that variable is set.

## How the look is kept the same
- `platform/global-styles.js` (used by the app) and `platform/brand-variables.css` (the same rules as plain CSS, used by the CMS preview) are generated from the existing site's own global styles and brand colors: `node GenericLMS/scripts/generate-brand-variables.cjs` from `C:\DYD\DYDLMS`. They include the page reset, `.wrapper` and editor rules, and the brand variables the CMS pages rely on (a variable the live site does not define must stay undefined here).
- Measured against the live HP LIFE Test site at 1440px: Terms, News, News article, Success Stories, Success story, Partners and Help match to the pixel in page height; About and Resources are within 12px. Course detail matches to 1px; All courses categories were measured at 1024px.
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
