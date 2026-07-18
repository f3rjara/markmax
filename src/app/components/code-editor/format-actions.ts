import { MarkdownFormatType } from '../../core/models/markdown-format.model';

/**
 * Cada entrada del mapa define como se aplica un formato Markdown.
 * - `inlineWrap`: envuelve la seleccion con marcadores (open/close) o inserta un placeholder.
 * - `linePrefix`: alterna un prefijo al inicio de la linea actual.
 * - `block`: inserta un bloque en nueva linea con un offset para posicionar el cursor.
 */
export type FormatAction =
  | { kind: 'inlineWrap'; open: string; close: string; placeholder: string }
  | { kind: 'linePrefix'; prefix: string }
  | { kind: 'block'; block: string; cursorOffset: number };

/**
 * Mapa declarativo que asocia cada MarkdownFormatType con la accion
 * que el editor debe ejecutar. Los tipos no listados aqui (como Table, Image)
 * se manejan externamente con flujos especiales.
 */
export const FORMAT_ACTIONS = new Map<MarkdownFormatType, FormatAction>([
  // Formato inline
  [MarkdownFormatType.Bold, { kind: 'inlineWrap', open: '**', close: '**', placeholder: 'texto en negrita' }],
  [MarkdownFormatType.Italic, { kind: 'inlineWrap', open: '*', close: '*', placeholder: 'texto en cursiva' }],
  [MarkdownFormatType.Strikethrough, { kind: 'inlineWrap', open: '~~', close: '~~', placeholder: 'texto tachado' }],
  [MarkdownFormatType.InlineCode, { kind: 'inlineWrap', open: '`', close: '`', placeholder: 'codigo' }],

  // Prefijos de linea
  [MarkdownFormatType.H1, { kind: 'linePrefix', prefix: '# ' }],
  [MarkdownFormatType.H2, { kind: 'linePrefix', prefix: '## ' }],
  [MarkdownFormatType.H3, { kind: 'linePrefix', prefix: '### ' }],
  [MarkdownFormatType.H4, { kind: 'linePrefix', prefix: '#### ' }],
  [MarkdownFormatType.H5, { kind: 'linePrefix', prefix: '##### ' }],
  [MarkdownFormatType.H6, { kind: 'linePrefix', prefix: '###### ' }],
  [MarkdownFormatType.UnorderedList, { kind: 'linePrefix', prefix: '- ' }],
  [MarkdownFormatType.OrderedList, { kind: 'linePrefix', prefix: '1. ' }],
  [MarkdownFormatType.TaskList, { kind: 'linePrefix', prefix: '- [ ] ' }],
  [MarkdownFormatType.BlockQuote, { kind: 'linePrefix', prefix: '> ' }],

  // Bloques
  [MarkdownFormatType.CodeBlock, { kind: 'block', block: '```\n\n```', cursorOffset: 4 }],
  [MarkdownFormatType.HR, { kind: 'block', block: '---', cursorOffset: 3 }],
]);
