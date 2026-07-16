import {
  afterEveryRender,
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';
import { DatabaseService } from '../../core/services/database.service';

const COPY_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const CHECK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }
    return ''; // use external default escaping
  },
});
md.enable('table');

// Regla personalizada de fence: solo wrapper + header con label (sin boton)
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

const ALIGNMENT_VALUES = new Set(['left', 'center', 'right']);

md.renderer.rules.image = (tokens, idx, _options, _env, _self) => {
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
  if (titleAttr) {
    html += ` title="${md.utils.escapeHtml(titleAttr)}"`;
  }
  if (alignClass) {
    html += ` class="${alignClass}"`;
  }
  html += '>';
  return html;
};

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

@Component({
  selector: 'app-markdown-preview',
  templateUrl: './markdown-preview.component.html',
  host: { class: 'block h-full w-full' },
})
export class MarkdownPreviewComponent {
  readonly content = input<string>('');
  private readonly db = inject(DatabaseService);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  private readonly dataUrlMap = new Map<string, string>();
  private readonly resolvedContent = signal<string>('');
  private contentVersion = 0;

  readonly renderedHtml = computed(() => {
    const text = this.resolvedContent();
    if (!text) return '';
    const raw = md.render(text);
    return DOMPurify.sanitize(raw, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['style', 'class'],
    });
  });

  constructor() {
    effect(() => {
      const content = this.content();
      void this.resolveContent(content);
    });

    // Inyectar botones de copiar via DOM despues de cada render
    afterEveryRender(() => {
      this.injectCopyButtons();
    });

    // Event delegation para manejar clics en botones de copiar
    afterNextRender(() => {
      const host = this.el.nativeElement;
      const handler = (event: MouseEvent) => {
        const btn = (event.target as HTMLElement).closest('.mm-copy-code-btn');
        if (!btn || !(btn instanceof HTMLElement)) return;

        const pre = btn.closest('.mm-code-block-wrapper')?.querySelector('pre');
        if (!pre) return;

        const code = pre.querySelector('code');
        const textToCopy = code ? code.textContent || '' : pre.textContent || '';

        void navigator.clipboard.writeText(textToCopy).then(() => {
          btn.classList.add('mm-copied');
          setTimeout(() => btn.classList.remove('mm-copied'), 1500);
        });
      };
      host.addEventListener('click', handler);
      this.destroyRef.onDestroy(() => host.removeEventListener('click', handler));
    });
  }

  private injectCopyButtons(): void {
    const headers = this.el.nativeElement.querySelectorAll('.mm-code-block-header');
    headers.forEach((header: Element) => {
      if (header.querySelector('.mm-copy-code-btn')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mm-copy-code-btn';
      btn.setAttribute('aria-label', 'Copiar codigo');
      btn.title = 'Copiar codigo';
      btn.innerHTML = `<span class="mm-copy-icon">${COPY_ICON_SVG}</span><span class="mm-check-icon">${CHECK_ICON_SVG}</span>`;
      header.appendChild(btn);
    });
  }

  private async resolveContent(content: string): Promise<void> {
    const version = ++this.contentVersion;

    const uuids = this.extractUuids(content);

    for (const uuid of uuids) {
      if (!this.dataUrlMap.has(uuid)) {
        const img = await this.db.getImageById(uuid);
        if (img) {
          const dataUrl = await blobToDataUrl(img.data);
          this.dataUrlMap.set(uuid, dataUrl);
        }
      }
    }

    for (const [uuid] of this.dataUrlMap) {
      if (!uuids.has(uuid)) {
        this.dataUrlMap.delete(uuid);
      }
    }

    if (version !== this.contentVersion) return;

    let resolved = content;
    for (const [uuid, dataUrl] of this.dataUrlMap) {
      resolved = resolved.replace(
        new RegExp(`\\(mm-image://${uuid}(\\s+"[^"]*")?\\)`, 'g'),
        `(${dataUrl}$1)`,
      );
    }
    this.resolvedContent.set(resolved);
  }

  private extractUuids(content: string): Set<string> {
    const uuids = new Set<string>();
    const re = /mm-image:\/\/([a-f0-9-]+)/g;
    let match;
    while ((match = re.exec(content)) !== null) {
      uuids.add(match[1]);
    }
    return uuids;
  }
}

