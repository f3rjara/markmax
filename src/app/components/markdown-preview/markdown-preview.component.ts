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
import DOMPurify from 'dompurify';
import { DatabaseService } from '../../core/services/database.service';
import { md } from './markdown-renderer';
import { injectCopyButtons, setupCopyClickHandler } from './copy-button.helper';
import { resolveContent } from './image-resolver.helper';

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
  private readonly contentVersionRef = { current: 0 };

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
      void resolveContent(content, this.contentVersionRef, this.dataUrlMap, this.db, this.resolvedContent);
    });

    afterEveryRender(() => {
      injectCopyButtons(this.el.nativeElement);
    });

    afterNextRender(() => {
      setupCopyClickHandler(this.el.nativeElement, (fn) => this.destroyRef.onDestroy(fn));
    });
  }
}
