import { EditorView } from '@codemirror/view';

/**
 * Tema visual del editor: layout, fuentes, scrollbar y colores de cromo
 * (fondo, gutter, cursor, seleccion, linea activa).
 *
 * Separado del highlight de sintaxis para facilitar el cambio de tema
 * sin perder el resaltado de Markdown y codigo.
 */
export const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: '#11111B',
    color: '#CDD6F4',
    fontFamily: 'var(--font-editor)',
    fontSize: '14px',
  },

  '.cm-content': {
    caretColor: '#89B4FA',
    padding: '18px 22px',
    lineHeight: '1.7',
    fontSmoothing: 'antialiased',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
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
    fontFamily: 'var(--font-editor)',
    fontSize: '12px',
  },

  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'inherit',
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
