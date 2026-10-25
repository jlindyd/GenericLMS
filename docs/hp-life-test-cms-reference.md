# HP LIFE Test — confirmed CMS reference records

Reviewed October 25, 2026. Read-only browser inspection of the signed-in test CMS. No fields were edited; no Save, Duplicate, Publish, Delete, upload or permission actions were used. This is a representative record review, not a full export.

## Confirmed site and page records

CMS site **1** is named **HP LIFE**. The page inventory includes separate language records and Active/Inactive statuses. Its UI exposes Pages, Assets, Contacts, Attributes, Stylesheets, Scripts, Templates, Headers and Footers.

| Record | ID | Language / state | CMS path | Template selection | Corresponding website area |
|---|---|---|---|---|---|
| About page (English) v1 | 13 | English / Published switch on; Active in list | `about-page` | No template | `/about` |
| Before Login News Banner — Strategic Planning in the AI Age Course (English) | 851 | English / Published switch on; Active in list | `before-login-news-strategic-planning-in-the-ai-age` | No template | Public homepage campaign carousel |
| After Login News Banner — Strategic Planning in the AI Age Course (English) | 852 | English / Published switch on; Active in list | `news-banner-strategic-planning-in-the-ai-age` | No template | Signed-in homepage/news campaign carousel |

The search results showed Arabic, English, French, Hindi, Indonesian, Portuguese, Simplified Chinese and Spanish versions for the after-login campaign. The initial inventory showed About records for the same eight languages. Their existence does not establish that all translation relationships or content are correct.

## What the records prove

1. **A significant part of HP LIFE's layout is authored in CMS content.** About record 13 contains the hero image, headings, statistics markup, image URLs, inline styling and layout-specific class names such as `about-page-emotion-cache-*`.
2. **Before-login and after-login banners are distinct presentations.** Their paths, HTML and styling differ even when they advertise the same course. Do not merge them into one generic card solely because the text is similar.
3. **Templates are not required for these examples.** All three sampled records show No template. This supports retaining LMSUI's outer shell for these samples; it does not establish template usage for every CMS record.
4. **Existing imagery is referenced directly in HTML.** The inspected records link to `hplife.blob.core.windows.net`. A test-site domain does not imply every static asset uses a separate test storage host. Preserve these URLs; do not rewrite or upload over them.
5. **Banner actions use learner-site routes.** The public campaign links to `/course/447-strategic-planning-in-the-ai-age`. GenericCMS preview must interpret that route in the learner-site context, without enrolling or navigating the editor into an unrelated CMS route.
6. **Editor names and public headings are different concepts.** Record 852 uses an internal descriptive name while the title/heading displays `(no-title)`; the actual campaign heading is inside its HTML. Do not automatically display internal names or require a standalone-page title for every banner.
7. **CSS is substantive content.** Record 852 exposes roughly 4.7 KB of custom CSS including layout/breakpoint rules and a universal box-sizing selector. Loading only the brand palette would not reproduce the banner.

## Current authoring UX observations

- The wider layout exposes Preview, HTML and Custom CSS beside setup controls. The narrower layout prioritizes setup and exposes HTML further down; preview capability is less evident there.
- The separate top Preview action and Save Changes action were disabled for the unchanged records. The inline Preview tab could still render the banner in the wider layout. A disabled top action alone does not mean the preview renderer is unavailable.
- Path preview text uses `https://www.example.com/...`, which does not communicate the actual HP LIFE destination or whether an item is an embedded homepage section.
- A relative course link in the signed-in banner's iframe was exposed as a CMS-host URL. We did not follow it. Site-aware preview routing is a concrete improvement to specify.
- Attribute headings `featureScope`, `requiresAuth` and `category` were visible, but selected values were not reliably exposed in the inspected UI. Exact record membership in the source-defined feed filters remains to be verified. Names alone are not sufficient evidence.
- Translation duplication controls are present. None were used.

## Suitable first read-only milestone

GenericCMS lists the existing site/pages and opens records 13, 851 and 852. GenericLMS renders:

- About record 13 in the preserved HP LIFE public shell.
- Banner 851 in the public-home carousel context.
- Banner 852 in the signed-in-home context after existing portal authentication.

Acceptance: no duplicated header/footer; existing HTML/CSS, imagery and relative links behave correctly; placement and language are visible to editors; previews match the learner site's context at matching widths. No sample content, backend schema change or CMS migration is necessary for this milestone.

## Still unverified

- CMS site code/host and production environment configuration: site ID/name were visible, but the inspected Edit Site screen did not expose a code/host field.
- Exact selected attributes for the sampled records.
- Page ordering and backend filtering rules, publication-date enforcement, revision/approval/rollback behavior.
- Full coverage of templates, headers, footers, assets, managers and translation relationships.
- Whether CMS permissions allow each proposed operation for non-admin editorial accounts.

## References

- [HP LIFE Test CMS site](https://cms.hplife-test.dyd.solutions/sites/1)
- [About record 13](https://cms.hplife-test.dyd.solutions/sites/1/pages/13/edit)
- [Public banner record 851](https://cms.hplife-test.dyd.solutions/sites/1/pages/851/edit)
- [Signed-in banner record 852](https://cms.hplife-test.dyd.solutions/sites/1/pages/852/edit)
- [HP LIFE Test About page](https://www.hplife-test.dyd.solutions/about)
- [Content ownership and rendering map](C:/DYD/DYDLMS/GenericLMS/docs/content-ownership-and-rendering-map.md)
