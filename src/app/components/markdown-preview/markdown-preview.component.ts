import { Component, computed, input } from '@angular/core';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });
// Las tablas GFM estan habilitadas por defecto en markdown-it v14.
// Sin embargo MarkdownIt({}) las desactiva salvo que se pase el preset 'default'.
// Habilitamos el preset completo manualmente:
md.enable('table');

@Component({
  selector: 'app-markdown-preview',
  templateUrl: './markdown-preview.component.html',
  host: { class: 'block h-full w-full' },
})
export class MarkdownPreviewComponent {
  readonly content = input<string>('');

  readonly renderedHtml = computed(() => {
    const raw = md.render(this.content());
    // ADD_ATTR permite preservar el atributo 'style' generado por markdown-it
    // para la alineacion de columnas (text-align: left|center|right).
    return DOMPurify.sanitize(raw, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['style'],
    });
  });
}
