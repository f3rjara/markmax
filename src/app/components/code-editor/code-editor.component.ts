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
import {
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
  keymap,
  EditorView,
} from '@codemirror/view';
import { EditorState, SelectionRange } from '@codemirror/state';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
} from '@codemirror/language';
import { history, historyKeymap } from '@codemirror/commands';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { lintKeymap } from '@codemirror/lint';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import { MarkdownFormatType } from '../../core/models/markdown-format.model';

@Component({
  selector: 'app-code-editor',
  template: `<section #editorHost class="h-full w-full overflow-hidden editor-host"></section>`,
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
      if (this.view) {
        const current = this.view.state.doc.toString();
        if (current !== newContent) {
          this.isUpdatingFromOutside = true;
          this.view.dispatch({
            changes: { from: 0, to: current.length, insert: newContent },
          });
          this.isUpdatingFromOutside = false;
        }
      }
    });
  }

  /**
   * Aplica un formato Markdown en la posición del cursor o selección actual.
   * Comportamiento por categoría:
   * - Inline wrap: envuelve la selección o inserta placeholder
   * - Line prefix: alterna el prefijo en la línea actual
   * - Block insert: inserta bloque en nueva línea
   */
  applyFormat(type: MarkdownFormatType): void {
    if (!this.view) return;

    switch (type) {
      case MarkdownFormatType.Bold:
        this.applyInlineWrap('**', '**', 'texto en negrita');
        break;
      case MarkdownFormatType.Italic:
        this.applyInlineWrap('*', '*', 'texto en cursiva');
        break;
      case MarkdownFormatType.Strikethrough:
        this.applyInlineWrap('~~', '~~', 'texto tachado');
        break;
      case MarkdownFormatType.InlineCode:
        this.applyInlineWrap('`', '`', 'código');
        break;
      case MarkdownFormatType.Link:
        this.applyLink();
        break;
      case MarkdownFormatType.H1:
        this.applyLinePrefix('# ');
        break;
      case MarkdownFormatType.H2:
        this.applyLinePrefix('## ');
        break;
      case MarkdownFormatType.H3:
        this.applyLinePrefix('### ');
        break;
      case MarkdownFormatType.H4:
        this.applyLinePrefix('#### ');
        break;
      case MarkdownFormatType.H5:
        this.applyLinePrefix('##### ');
        break;
      case MarkdownFormatType.H6:
        this.applyLinePrefix('###### ');
        break;
      case MarkdownFormatType.UnorderedList:
        this.applyLinePrefix('- ');
        break;
      case MarkdownFormatType.OrderedList:
        this.applyLinePrefix('1. ');
        break;
      case MarkdownFormatType.TaskList:
        this.applyLinePrefix('- [ ] ');
        break;
      case MarkdownFormatType.BlockQuote:
        this.applyLinePrefix('> ');
        break;
      case MarkdownFormatType.CodeBlock:
        this.insertBlock('```\n\n```', 4);
        break;
      case MarkdownFormatType.HR:
        this.insertBlock('---', 3);
        break;
      case MarkdownFormatType.Table:
        // La tabla se inserta via insertRaw() desde el EditorPageComponent
        // cuando el TableBuilderComponent emite el Markdown generado.
        break;
    }

    this.view.focus();
  }

  /**
   * Inserta texto literal en la posicion actual del cursor (nueva linea antes si
   * la linea actual no esta vacia) y posiciona el cursor al final del bloque insertado.
   */
  insertRaw(text: string): void {
    if (!this.view) return;

    const { head } = this.view.state.selection.main;
    const line = this.view.state.doc.lineAt(head);
    const prefix = line.text.trim().length > 0 ? '\n\n' : '\n';
    const insert = prefix + text;

    this.view.dispatch({
      changes: { from: line.to, insert },
      selection: { anchor: line.to + insert.length },
    });

    this.view.focus();
  }

  /** Devuelve el foco al editor CodeMirror. */
  focus(): void {
    this.view?.focus();
  }

  /**
   * Detecta el prefijo de la línea donde está el cursor y retorna
   * el MarkdownFormatType correspondiente, o null si no hay prefijo reconocido.
   */
  getLineContext(): MarkdownFormatType | null {
    if (!this.view) return null;

    const { head } = this.view.state.selection.main;
    const line = this.view.state.doc.lineAt(head);
    const text = line.text;

    if (/^###### /.test(text)) return MarkdownFormatType.H6;
    if (/^##### /.test(text)) return MarkdownFormatType.H5;
    if (/^#### /.test(text)) return MarkdownFormatType.H4;
    if (/^### /.test(text)) return MarkdownFormatType.H3;
    if (/^## /.test(text)) return MarkdownFormatType.H2;
    if (/^# /.test(text)) return MarkdownFormatType.H1;
    if (/^- \[ \] /.test(text) || /^- \[x\] /i.test(text)) return MarkdownFormatType.TaskList;
    if (/^- /.test(text)) return MarkdownFormatType.UnorderedList;
    if (/^\d+\. /.test(text)) return MarkdownFormatType.OrderedList;
    if (/^> /.test(text)) return MarkdownFormatType.BlockQuote;

    return null;
  }

  // ── Helpers privados ───────────────────────────────────────────────────────

  private applyInlineWrap(open: string, close: string, placeholder: string): void {
    if (!this.view) return;

    const { from, to } = this.view.state.selection.main as SelectionRange;
    const hasSelection = from !== to;
    const selectedText = hasSelection ? this.view.state.sliceDoc(from, to) : placeholder;
    const wrapped = `${open}${selectedText}${close}`;

    this.view.dispatch({
      changes: { from, to, insert: wrapped },
      selection: hasSelection
        ? { anchor: from, head: from + wrapped.length }
        : { anchor: from + open.length, head: from + open.length + placeholder.length },
    });
  }

  private applyLink(): void {
    if (!this.view) return;

    const { from, to } = this.view.state.selection.main as SelectionRange;
    const hasSelection = from !== to;
    const linkText = hasSelection ? this.view.state.sliceDoc(from, to) : 'texto del enlace';
    const insert = `[${linkText}](url)`;

    this.view.dispatch({
      changes: { from, to, insert },
      // Posicionar cursor sobre "url" para que el usuario lo reemplace
      selection: {
        anchor: from + linkText.length + 3,
        head: from + linkText.length + 3 + 3,
      },
    });
  }

  private applyLinePrefix(prefix: string): void {
    if (!this.view) return;

    const { head } = this.view.state.selection.main;
    const line = this.view.state.doc.lineAt(head);
    const lineText = line.text;

    // Detectar si la línea ya tiene algún prefijo de bloque conocido
    const existingPrefixMatch = lineText.match(/^(#{1,6} |> |- \[[ x]\] |- |\d+\. )/i);

    if (existingPrefixMatch) {
      const existingPrefix = existingPrefixMatch[0];
      if (existingPrefix === prefix) {
        // Toggle: quitar el prefijo si ya está activo
        this.view.dispatch({
          changes: { from: line.from, to: line.from + existingPrefix.length, insert: '' },
          selection: { anchor: Math.max(line.from, head - existingPrefix.length) },
        });
      } else {
        // Reemplazar prefijo existente con el nuevo
        this.view.dispatch({
          changes: { from: line.from, to: line.from + existingPrefix.length, insert: prefix },
          selection: { anchor: head - existingPrefix.length + prefix.length },
        });
      }
    } else {
      // Sin prefijo existente: insertar al inicio de la línea
      this.view.dispatch({
        changes: { from: line.from, insert: prefix },
        selection: { anchor: head + prefix.length },
      });
    }
  }

  private insertBlock(block: string, cursorOffset: number): void {
    if (!this.view) return;

    const { head } = this.view.state.selection.main;
    const line = this.view.state.doc.lineAt(head);

    const insertPos = line.to;
    const insert = `\n${block}`;

    this.view.dispatch({
      changes: { from: insertPos, insert },
      selection: { anchor: insertPos + cursorOffset },
    });
  }

  private initEditor(): void {
    const customSetup = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([...historyKeymap, ...searchKeymap, ...lintKeymap]),
    ];

    const state = EditorState.create({
      doc: this.content(),
      extensions: [
        customSetup,
        markdown({ codeLanguages: languages }),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !this.isUpdatingFromOutside) {
            this.contentChange.emit(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto', fontFamily: 'inherit' },
          '.cm-content, .cm-gutter': { minHeight: '100%' },
        }),
        EditorView.exceptionSink.of((error: any) => {
          const msg = error?.message || String(error);
          if (msg.includes('No tile at position')) {
            return;
          }
          console.error(error);
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
