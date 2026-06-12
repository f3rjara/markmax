import { Component, computed, input } from '@angular/core';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

@Component({
  selector: 'app-markdown-preview',
  templateUrl: './markdown-preview.component.html',
  host: { class: 'block h-full w-full' },
})
export class MarkdownPreviewComponent {
  readonly content = input<string>('');

  readonly renderedHtml = computed(() => {
    const raw = md.render(this.content());
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
  });
}
