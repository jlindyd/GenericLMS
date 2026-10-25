# CMS API findings (from the CmsAPI source, read only)

Source: `C:\DYD\DYDLMS\API\CMS` (github.com/dyd4g/CmsAPI, commit de04d42, 2026-04-29). Reference only; the API and its database are never changed from this project.

## What the API contains
Controllers: Sites, Pages, Assets, AssetItems, Attributes, Contacts, Permissions, Public. Models: Site, Page, Asset (and items, files, links), Attribute and values, Contact, permissions per site/page/asset, Seo.

**There is no Template, Header, Footer, Stylesheet or Script model or endpoint in this API.** The old CMS screens for them are empty for HP LIFE, and the data does not exist here.

## Answers to open questions in the ownership map
| Question | Answer from source |
|---|---|
| What does saving an Active page do? | `PUT /sites/{siteId}/pages/{pageId}` overwrites the page row in place. Edits to an Active page are public immediately (subject only to the learner site's cache). |
| Revisions, approval, rollback? | None. The `Page` model has one `Content` and one `Style` string, `LastEditDate` and `LastEditorId`. No history table. |
| Is the publish date enforced? | No. Public reads filter only on `Status == Active`. `PublishDate` is only used for ordering the public list (newest first). It is set automatically the first time a page goes Inactive to Active. |
| Do public reads need sign-in? | No. `GET /page` and `GET /pages` have no authorization. The `requiresAuth` attribute is a convention only; the API returns the page regardless, so the learner site must enforce it. |
| Page uniqueness | Path plus language must be unique within a site. Paths are trimmed of leading/trailing slashes. |
| Translations | Separate page rows with the same path and different `Language`. No fallback: a missing language returns 404. |
| Featured image | Stored as a relative URL; public reads prepend the public storage base URL. |
| Who can do what | Policies `SysAdmin`, `SiteAdmin` (create, delete pages), `PageAdmin` (edit one page), `PageViewer` (list). Admin reads and writes need a bearer token. |

## Public read contract
- `GET /page?site={code}|host={host}&language={lang}&path={path}` returns `title, heading, content, style, featuredImageUrl, seo{description, keywords}`.
- `GET /pages?site=...&language=...&{attribute}={value}&page=&resultsPerPage=` returns `title, heading, publishDate, author, description, featuredImageUrl, path, attributes` (newest publish date first).

## Where a theme could live
The API has no theme or site-settings storage (a `Site` has only name, code, host, group). Options:
1. **No backend change:** store the theme as a special Active page (for example path `site-theme`, JSON in `Content`). Works today, but it is public, saves go live immediately, and it has no history.
2. **Proper feature (needs a change to this API, owned by someone else):** a site-level theme or settings table with draft and published versions and revision history, plus endpoints.
Record the choice before building any theme editor.

**Decision (user, 2026-10-25): keep things as they are for now.** No theme editor and no backend change. The HP LIFE look stays as in the existing site. Enhancements such as themes are deferred until the apps are running.

## Consequences for GenericCMS and GenericLMS
- GenericCMS should warn before saving an Active page ("this goes live now") and offer Inactive drafts as the safe path. It cannot offer rollback without backend support; it could keep a local copy of the previous content before each save.
- GenericLMS must decide itself whether to show `requiresAuth` pages, and must treat `Content` and `Style` as trusted editorial HTML (sanitize or isolate before rendering).
- Language fallback and ordering are client concerns.

## Verified against HP LIFE Test (read only, 2026-10-25)
- The deployed public `GET /page` also returns `header`, `footer`, `stylesheets` and `scripts` fields (all null or empty for the About page). The cloned CmsAPI source (commit de04d42) has no such fields, so the deployed API is newer than that clone. Treat those fields as optional and ask for the newer source before building anything that depends on them.
- The admin list `GET /sites/1/pages` returns 819 pages for HP LIFE (all eight languages, Active and Inactive). `GET /sites` returns only the sites the signed-in account may see; an account without site permissions gets an empty list (not an error).
- Attributes come back as `{ featureScope: ["news-banners-before-login"] }` on list rows, and as grouped lists with ids on the single-page read.
