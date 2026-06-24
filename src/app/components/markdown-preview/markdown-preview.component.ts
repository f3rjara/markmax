import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import { DatabaseService } from '../../core/services/database.service';

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });
md.enable('table');

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
