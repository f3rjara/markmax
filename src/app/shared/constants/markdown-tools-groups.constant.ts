import { MarkdownToolGroup } from '../../core/models/markdown-format.model';

/** Orden de renderizado de los grupos */
export const GROUP_ORDER: MarkdownToolGroup[] = [
  MarkdownToolGroup.Text,
  MarkdownToolGroup.Media,
  MarkdownToolGroup.Tables,
  MarkdownToolGroup.Links,
  MarkdownToolGroup.Lists,
  MarkdownToolGroup.Blocks,
  MarkdownToolGroup.Headings,
];
