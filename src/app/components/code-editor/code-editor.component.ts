import {
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

@Component({
  selector: 'app-code-editor',
  template: `<section #editorHost class="h-full w-full overflow-auto editor-host"></section>`,
  host: { class: 'block h-full w-full' },
})
export class CodeEditorComponent implements OnDestroy {
  readonly content = input<string>('');
  readonly contentChange = output<string>();

  private readonly editorHost = viewChild.required<ElementRef<HTMLDivElement>>('editorHost');
  private readonly hostEl = inject(ElementRef);

  private view: EditorView | null = null;
  private isUpdatingFromOutside = false;

  constructor() {
    afterNextRender(() => {
      this.initEditor();
    });

    effect(() => {
      const newContent = this.content();
      if (this.view && !this.isUpdatingFromOutside) {
        const current = this.view.state.doc.toString();
        if (current !== newContent) {
          this.view.dispatch({
            changes: { from: 0, to: current.length, insert: newContent },
          });
        }
      }
    });
  }

  private initEditor(): void {
    const state = EditorState.create({
      doc: this.content(),
      extensions: [
        basicSetup,
        markdown({ codeLanguages: languages }),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            this.isUpdatingFromOutside = true;
            this.contentChange.emit(update.state.doc.toString());
            this.isUpdatingFromOutside = false;
          }
        }),
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto', fontFamily: 'inherit' },
        }),
      ],
    });

    this.view = new EditorView({
      state,
      parent: this.editorHost().nativeElement,
    });
  }

  ngOnDestroy(): void {
    this.view?.destroy();
    this.view = null;
  }
}
