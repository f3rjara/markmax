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
import { EditorState, Extension, Prec } from '@codemirror/state';
import { syntaxHighlighting, bracketMatching } from '@codemirror/language';
import { history, historyKeymap } from '@codemirror/commands';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { lintKeymap } from '@codemirror/lint';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';

import { CODEMIRROR_PHRASES_ES } from './codemirror-phrases-es';
import { editorTheme } from './codemirror-theme';
import { markdownHighlightStyle } from './codemirror-highlight-markdown';
import { codeHighlightStyle } from './codemirror-highlight-code';
import { EDITOR_THEMES, DEFAULT_THEME_NAME, EditorThemeName } from './codemirror-themes';

/**
 * Conjunto base de extensiones de CodeMirror (equivalente a un basicSetup personalizado).
 * Incluye numeracion de lineas, resaltado, historial y atajos de teclado.
 */
const baseSetup: Extension[] = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  bracketMatching(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([...historyKeymap, ...searchKeymap, ...lintKeymap]),
];

/**
 * Construye el arreglo completo de extensiones para el editor.
 *
 * @param onDocChange - Callback que se invoca cuando el documento cambia.
 * @param themeName   - Nombre del tema a aplicar (por defecto: DEFAULT_THEME_NAME).
 */
export function buildEditorExtensions(
  onDocChange: (content: string) => void,
  themeName: EditorThemeName = DEFAULT_THEME_NAME,
): Extension[] {
  const colorTheme = EDITOR_THEMES[themeName] ?? EDITOR_THEMES[DEFAULT_THEME_NAME];

  return [
    baseSetup,
    markdown({ codeLanguages: languages }),
    colorTheme,
    Prec.highest(syntaxHighlighting(markdownHighlightStyle)),
    Prec.highest(syntaxHighlighting(codeHighlightStyle)),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onDocChange(update.state.doc.toString());
      }
    }),
    EditorView.lineWrapping,
    editorTheme,
    EditorState.phrases.of(CODEMIRROR_PHRASES_ES),
  ];
}
