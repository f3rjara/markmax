import { HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

/**
 * Estilos de sintaxis Markdown (titulos, negrita, cursiva, listas, enlaces, etc.)
 * disenados para complementar cualquier tema de CodeMirror.
 *
 * IMPORTANTE: registrar SIN `{ fallback: true }`. El fallback en CodeMirror es
 * global (no por token): si existe cualquier highlighter no-fallback activo
 * (theme registra uno), los fallback quedan completamente ignorados.
 * Al registrarlo como highlighter normal, sus clases se unen a las del tema
 * (theme no define tags de markdown, asi que no hay conflicto).
 */
export const markdownHighlightStyle = HighlightStyle.define([
  // Headers
  { tag: t.heading1, fontWeight: '700', color: '#E6A36C', fontSize: '1.55em' },
  { tag: t.heading2, fontWeight: '700', color: '#DFA56B', fontSize: '1.4em' },
  { tag: t.heading3, fontWeight: '600', color: '#D7A97C', fontSize: '1.3em' },
  { tag: t.heading4, fontWeight: '600', color: '#C6AE8D', fontSize: '1.15em' },
  { tag: t.heading5, fontWeight: '600', color: '#A8B3CF', fontSize: '1.05em' },
  { tag: t.heading6, fontWeight: '600', color: '#8E99B8' },

  // Formato de texto
  { tag: t.strong, fontWeight: '700', color: '#F5F5F7' },
  { tag: t.emphasis, fontStyle: 'italic', color: '#C9D1D9' },
  { tag: t.strikethrough, textDecoration: 'line-through', color: '#7F849C' },

  // Enlaces
  { tag: t.link, color: '#89B4FA', textDecoration: 'underline' },
  { tag: t.url, color: '#7DC4E4' },

  // Citas
  { tag: t.quote, fontStyle: 'italic', color: '#A6ADC8' },

  // Codigo inline
  { tag: t.monospace, color: '#8edcd9ff' },

  // Sintaxis Markdown (# ** > [])
  { tag: t.processingInstruction, color: '#c1fd8cff' },
]);
