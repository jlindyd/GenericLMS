// Shows one CMS page body with its own CSS, exactly as authored. HTML and CSS are cleaned on the server (platform/sanitize.js).
export default function CmsContent({ page, id }) {
  return <>
    {page.style ? <style data-cms-style={id} dangerouslySetInnerHTML={{ __html: page.style }} /> : null}
    <div data-cms-page={id} dangerouslySetInnerHTML={{ __html: page.content }} />
  </>;
}
