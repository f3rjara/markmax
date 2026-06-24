export enum MarkdownFormatType {
  Bold = 'bold',
  Italic = 'italic',
  Strikethrough = 'strikethrough',
  Link = 'link',
  UnorderedList = 'unordered-list',
  OrderedList = 'ordered-list',
  TaskList = 'task-list',
  BlockQuote = 'block-quote',
  InlineCode = 'inline-code',
  CodeBlock = 'code-block',
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
  H4 = 'h4',
  H5 = 'h5',
  H6 = 'h6',
  HR = 'hr',
  Table = 'table',
}

export enum MarkdownToolGroup {
  Text = 'Texto',
  Links = 'Links',
  Lists = 'Listas',
  Blocks = 'Bloques',
  Headings = 'Encabezados',
  Tables = 'Tablas',
}

export interface MarkdownTool {
  type: MarkdownFormatType;
  label: string;
  iconName: string;
  group: MarkdownToolGroup;
}

export const MARKDOWN_TOOLS: MarkdownTool[] = [
  // Grupo: Texto
  { type: MarkdownFormatType.Bold, label: 'Negrita', iconName: 'bold', group: MarkdownToolGroup.Text },
  { type: MarkdownFormatType.Italic, label: 'Cursiva', iconName: 'italic', group: MarkdownToolGroup.Text },
  { type: MarkdownFormatType.Strikethrough, label: 'Tachado', iconName: 'strikethrough', group: MarkdownToolGroup.Text },

  // Grupo: Links
  { type: MarkdownFormatType.Link, label: 'Enlace', iconName: 'link', group: MarkdownToolGroup.Links },

  // Grupo: Listas
  { type: MarkdownFormatType.UnorderedList, label: 'Lista sin orden', iconName: 'list', group: MarkdownToolGroup.Lists },
  { type: MarkdownFormatType.OrderedList, label: 'Lista ordenada', iconName: 'list-ordered', group: MarkdownToolGroup.Lists },
  { type: MarkdownFormatType.TaskList, label: 'Lista de tareas', iconName: 'list-check', group: MarkdownToolGroup.Lists },

  // Grupo: Bloques
  { type: MarkdownFormatType.BlockQuote, label: 'Cita', iconName: 'quote', group: MarkdownToolGroup.Blocks },
  { type: MarkdownFormatType.InlineCode, label: 'Código inline', iconName: 'code-inline', group: MarkdownToolGroup.Blocks },
  { type: MarkdownFormatType.CodeBlock, label: 'Bloque de código', iconName: 'code-block', group: MarkdownToolGroup.Blocks },

  // Grupo: Encabezados
  { type: MarkdownFormatType.H1, label: 'Título 1', iconName: 'h1', group: MarkdownToolGroup.Headings },
  { type: MarkdownFormatType.H2, label: 'Título 2', iconName: 'h2', group: MarkdownToolGroup.Headings },
  { type: MarkdownFormatType.H3, label: 'Título 3', iconName: 'h3', group: MarkdownToolGroup.Headings },
  { type: MarkdownFormatType.H4, label: 'Título 4', iconName: 'h4', group: MarkdownToolGroup.Headings },
  { type: MarkdownFormatType.H5, label: 'Título 5', iconName: 'h5', group: MarkdownToolGroup.Headings },
  { type: MarkdownFormatType.H6, label: 'Título 6', iconName: 'h6', group: MarkdownToolGroup.Headings },
  { type: MarkdownFormatType.HR, label: 'Línea horizontal', iconName: 'minus', group: MarkdownToolGroup.Headings },

  // Grupo: Tablas
  { type: MarkdownFormatType.Table, label: 'Tabla', iconName: 'table', group: MarkdownToolGroup.Tables },
];
