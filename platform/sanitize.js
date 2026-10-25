import xss from 'xss';

// Editorial HTML and CSS come from the CMS and must look exactly as authored, so classes, inline styles and images are kept.
// Scripts, event handlers, javascript: links and unknown embeds are removed before anything reaches the browser.
const embedHosts = ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'];
const common = ['class', 'id', 'style', 'title', 'role', 'lang', 'dir', 'aria-label', 'aria-hidden', 'aria-labelledby', 'aria-describedby'];
const allow = (tags, extra = []) => Object.fromEntries(tags.map(tag => [tag, [...common, ...extra]]));
// Inline SVG (decorative banner shapes and icons) is kept; links, scripts, styles and embedded objects inside it are not.
const svgAttrs = ['viewBox', 'xmlns', 'width', 'height', 'fill', 'fill-rule', 'fill-opacity', 'clip-rule', 'clip-path', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'stroke-miterlimit', 'opacity', 'transform', 'preserveAspectRatio', 'focusable', 'd', 'points', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform', 'patternUnits', 'maskUnits', 'version'];
const svgShapes = Object.fromEntries(['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'defs', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'title', 'desc'].map(tag => [tag.toLowerCase(), [...common, ...svgAttrs]]));
const whiteList = {
  ...allow(['div', 'span', 'p', 'br', 'hr', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside', 'figure', 'figcaption', 'center', 'blockquote', 'pre', 'code', 'em', 'strong', 'b', 'i', 'u', 's', 'small', 'sub', 'sup', 'mark', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'caption', 'colgroup', 'details', 'summary', 'picture', 'button', 'label', 'time', 'abbr', 'cite', 'q']),
  td: [...common, 'colspan', 'rowspan'], th: [...common, 'colspan', 'rowspan'], col: [...common, 'span'],
  a: [...common, 'href', 'target', 'rel', 'name'],
  img: [...common, 'src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'fetchpriority'],
  source: [...common, 'src', 'srcset', 'sizes', 'media', 'type'],
  iframe: [...common, 'src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'loading'],
  video: [...common, 'src', 'poster', 'controls', 'width', 'height'],
  font: [...common, 'color', 'size', 'face'],
  ...svgShapes,
};

const safeUrl = value => /^(https?:|mailto:|tel:|\/(?!\/)|#|\.\.?\/|[^:]*$)/i.test(String(value).trim());
function iframeAllowed(value) {
  const url = String(value).trim();
  if (/^\/(?!\/)/.test(url) || /^[^:/]*$/.test(url)) return true;
  try { const parsed = new URL(url); return parsed.protocol === 'https:' && embedHosts.includes(parsed.hostname); } catch { return false; }
}

const filter = new xss.FilterXSS({
  whiteList,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
  allowCommentTag: false,
  onTagAttr(tag, name, value) {
    if (['href', 'src', 'poster'].includes(name)) {
      const ok = tag === 'iframe' ? iframeAllowed(value) : safeUrl(value);
      return ok ? `${name}="${xss.escapeAttrValue(value)}"` : '';
    }
    if (name === 'srcset') return `${name}="${xss.escapeAttrValue(value)}"`;
    if (name === 'style') return /expression\s*\(|javascript:|behavior\s*:|-moz-binding/i.test(value) ? '' : `style="${xss.escapeAttrValue(value)}"`;
    if (tag === 'a' && name === 'target' && value === '_blank') return 'target="_blank" rel="noopener noreferrer"';
    return undefined;
  },
});

// An image the editor left without alt text is announced as decorative (empty alt), never as a file name.
// Applied to the already filtered markup, so it cannot reintroduce anything.
const withAlt = html => html.replace(/<img\b(?![^>]*\salt=)([^>]*?)\s*\/?>/gi, '<img$1 alt="">');
export const cleanHtml = html => withAlt(filter.process(String(html ?? '')));
// CSS is trusted editorial content; the only thing guarded is closing the <style> element early.
export const cleanCss = css => String(css ?? '').replace(/<\/?style[^>]*>?/gi, '');
export const cleanPage = page => ({ ...page, content: cleanHtml(page.content), style: cleanCss(page.style) });
