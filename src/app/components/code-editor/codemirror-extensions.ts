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
import { EditorState, Extension } from '@codemirror/state';
import { syntaxHighlighting, HighlightStyle, bracketMatching } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { history, historyKeymap } from '@codemirror/commands';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { lintKeymap } from '@codemirror/lint';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { coolGlow } from 'thememirror';
import { CODEMIRROR_PHRASES_ES } from './codemirror-phrases-es';

/**
 * Conjunto base de extensiones de CodeMirror (equivalente a un basicSetup personalizado).
 * Incluye numeracion de lineas, resaltado, plegado, historial y atajos de teclado.
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

/** Tema personalizado del editor. */
const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: '#11111B',
    color: '#CDD6F4',
  },

  '.cm-content': {
    caretColor: '#89B4FA',
    padding: '18px 22px',
    lineHeight: '1.7',
  },

  '.cm-cursor': {
    borderLeftColor: '#89B4FA',
  },

  '.cm-selectionBackground': {
    background: '#313244',
  },

  '.cm-activeLine': {
    background: '#181825',
  },

  '.cm-activeLineGutter': {
    background: '#181825',
  },

  '.cm-gutters': {
    background: '#11111B',
    color: '#6C7086',
    border: 'none',
  },

  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont',
  },

  '.cm-scroller::-webkit-scrollbar': {
    width: '12px',
    height: '12px',
  },

  '.cm-scroller::-webkit-scrollbar-track': {
    background: '#11111B',
  },

  '.cm-scroller::-webkit-scrollbar-thumb': {
    background: '#313244',
    borderRadius: '6px',
    border: '3px solid #11111B',
  },

  '.cm-scroller::-webkit-scrollbar-thumb:hover': {
    background: '#89B4FA',
  },
});

/**
 * Estilos de sintaxis Markdown (títulos, negrita, cursiva, listas, enlaces, etc.)
 * diseñados para complementar el tema coolGlow, que no incluye soporte nativo
 * para estas etiquetas de @lezer/highlight.
 *
 * IMPORTANTE: registrar SIN `{ fallback: true }`. El fallback en CodeMirror es
 * global (no por token): si existe cualquier highlighter no-fallback activo
 * (coolGlow registra uno), los fallback quedan completamente ignorados.
 * Al registrarlo como highlighter normal, sus clases se unen a las del tema
 * (coolGlow no define tags de markdown, así que no hay conflicto).
 */
const markdownHighlightStyle = HighlightStyle.define([
  // Headers
  {
    tag: t.heading1,
    fontWeight: '700',
    color: '#E6A36C',
    fontSize: '1.55em',
  },
  {
    tag: t.heading2,
    fontWeight: '700',
    color: '#DFA56B',
    fontSize: '1.4em',
  },
  {
    tag: t.heading3,
    fontWeight: '600',
    color: '#D7A97C',
    fontSize: '1.3em',
  },
  {
    tag: t.heading4,
    fontWeight: '600',
    color: '#C6AE8D',
    fontSize: '1.15em',
  },
  {
    tag: t.heading5,
    fontWeight: '600',
    color: '#A8B3CF',
    fontSize: '1.05em',
  },
  {
    tag: t.heading6,
    fontWeight: '600',
    color: '#8E99B8',
  },

  // Strong
  {
    tag: t.strong,
    fontWeight: '700',
    color: '#F5F5F7',
  },

  // Italic
  {
    tag: t.emphasis,
    fontStyle: 'italic',
    color: '#C9D1D9',
  },

  // Strike
  {
    tag: t.strikethrough,
    textDecoration: 'line-through',
    color: '#7F849C',
  },

  // Links
  {
    tag: t.link,
    color: '#89B4FA',
    textDecoration: 'underline',
  },

  {
    tag: t.url,
    color: '#7DC4E4',
  },

  // Quotes
  {
    tag: t.quote,
    fontStyle: 'italic',
    color: '#A6ADC8',
    borderLeft: '3px solid #5B6DAA',
    paddingLeft: '10px',
  },

  // Inline code
  {
    tag: t.monospace,
    color: '#A6D189',
  },

  // Markdown syntax (# ** > [])
  {
    tag: t.processingInstruction,
    color: '#6C7086',
  },
]);

/**
 * Construye el arreglo completo de extensiones para el editor.
 * Recibe un callback de cambio de documento para mantener la
 * comunicacion reactiva con el componente Angular.
 */
export function buildEditorExtensions(onDocChange: (content: string) => void): Extension[] {
  return [
    baseSetup,
    markdown({ codeLanguages: languages }),
    coolGlow,
    syntaxHighlighting(markdownHighlightStyle),
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
