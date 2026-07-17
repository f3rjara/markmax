import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

const ALIGNMENT_VALUES = new Set(['left', 'center', 'right']);

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (_) {}
    }
    return '';
  },
});

md.enable('table');

// Regla personalizada de fence: wrapper + header con label
const defaultFenceRenderer = md.renderer.rules.fence!.bind(md.renderer.rules);
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const langLabel = tokens[idx].info.trim() || '';
  const defaultOutput = defaultFenceRenderer(tokens, idx, options, env, self);

  return `<div class="mm-code-block-wrapper">
    <div class="mm-code-block-header">
      ${langLabel ? `<span class="mm-code-lang-label">${md.utils.escapeHtml(langLabel)}</span>` : '<span></span>'}
    </div>
    ${defaultOutput}
  </div>`;
};

// Regla personalizada de imagen con soporte de alineacion via title
md.renderer.rules.image = (tokens, idx) => {
  const token = tokens[idx];
  const src = token.attrGet('src') || '';
  const alt = md.utils.escapeHtml(token.content);
  const title = token.attrGet('title') || '';

  let titleAttr = title;
  let alignClass = '';

  if (ALIGNMENT_VALUES.has(title)) {
    alignClass = `mm-image-align-${title}`;
    titleAttr = '';
  }

  let html = `<img src="${md.utils.escapeHtml(src)}" alt="${alt}"`;
  if (titleAttr) html += ` title="${md.utils.escapeHtml(titleAttr)}"`;
  if (alignClass) html += ` class="${alignClass}"`;
  html += '>';
  return html;
};

export { md };
