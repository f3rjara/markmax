import { Component, input, output } from '@angular/core';
import {
  MARKDOWN_TOOLS,
  MarkdownFormatType,
  MarkdownToolGroup,
} from '../../core/models/markdown-format.model';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icon.component';

/** Orden de renderizado de los grupos */
const GROUP_ORDER: MarkdownToolGroup[] = [
  MarkdownToolGroup.Text,
  MarkdownToolGroup.Links,
  MarkdownToolGroup.Lists,
  MarkdownToolGroup.Blocks,
  MarkdownToolGroup.Headings,
];

@Component({
  selector: 'app-markdown-tools-menu',
  imports: [IconComponent],
  template: `
    <!-- Panel del menú -->
    <div
      class="tools-menu"
      role="menu"
      aria-label="Herramientas de formato Markdown">
      @for (group of groups; track group.name; let last = $last) {
        <!-- Etiqueta del grupo -->
        <p class="tools-group-label">{{ group.name }}</p>

        <!-- Herramientas del grupo -->
        @for (tool of group.tools; track tool.type) {
          <button
            type="button"
            role="menuitem"
            class="tools-item"
            [class.tools-item--active]="activeFormat() === tool.type"
            [attr.aria-label]="tool.label"
            [attr.aria-pressed]="activeFormat() === tool.type"
            (click)="onToolClick(tool.type)">
            <app-icon [name]="$any(tool.iconName)" [size]="15" class="tools-item-icon" />
            <span class="tools-item-label">{{ tool.label }}</span>
          </button>
        }

        <!-- Separador entre grupos (no en el último) -->
        @if (!last) {
          <div class="tools-separator" role="separator"></div>
        }
      }
    </div>
  `,
  styles: `
    :host {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      z-index: 50;
      display: block;
    }

    .tools-menu {
      position: relative;
      z-index: 50;
      min-width: 200px;
      max-height: 480px;
      overflow-y: auto;
      background: var(--color-mm-sidebar);
      border: 1px solid var(--color-mm-border);
      border-radius: 10px;
      padding: 6px;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.45),
        0 2px 8px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(139, 92, 246, 0.08);
      animation: tools-fade-in 0.15s ease-out;
      scrollbar-width: thin;
      scrollbar-color: rgba(139, 92, 246, 0.25) transparent;
    }

    .tools-menu::-webkit-scrollbar {
      width: 4px;
    }

    .tools-menu::-webkit-scrollbar-track {
      background: transparent;
    }

    .tools-menu::-webkit-scrollbar-thumb {
      background: rgba(139, 92, 246, 0.3);
      border-radius: 2px;
    }

    @keyframes tools-fade-in {
      from {
        opacity: 0;
        transform: translateY(-6px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .tools-group-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--color-mm-text-secondary);
      padding: 4px 8px 2px;
      margin: 0;
      user-select: none;
    }

    .tools-item {
      display: flex;
      align-items: center;
      gap: 9px;
      width: 100%;
      padding: 6px 8px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--color-mm-text);
      font-size: 13px;
      font-weight: 400;
      cursor: pointer;
      text-align: left;
      transition: background 0.12s ease, color 0.12s ease;
    }

    .tools-item:hover {
      background: var(--color-mm-surface-hover);
      color: var(--color-mm-text);
    }

    .tools-item:focus-visible {
      outline: 2px solid var(--color-mm-accent);
      outline-offset: -2px;
    }

    .tools-item--active {
      background: rgba(124, 58, 237, 0.18);
      color: #c4b5fd;
    }

    .tools-item--active:hover {
      background: rgba(124, 58, 237, 0.26);
    }

    .tools-item-icon {
      color: var(--color-mm-text-secondary);
      flex-shrink: 0;
    }

    .tools-item--active .tools-item-icon {
      color: var(--color-mm-accent-hover);
    }

    .tools-item-label {
      flex: 1;
      white-space: nowrap;
    }

    .tools-separator {
      height: 1px;
      background: var(--color-mm-border);
      margin: 4px 4px;
    }
  `,
})
export class MarkdownToolsMenuComponent {
  readonly activeFormat = input<MarkdownFormatType | null>(null);
  readonly toolSelected = output<MarkdownFormatType>();
  readonly closeRequest = output<void>();

  /** Herramientas agrupadas en el orden definido */
  protected readonly groups = GROUP_ORDER.map((groupName) => ({
    name: groupName,
    tools: MARKDOWN_TOOLS.filter((t) => t.group === groupName),
  })).filter((g) => g.tools.length > 0);

  protected onToolClick(type: MarkdownFormatType): void {
    this.toolSelected.emit(type);
  }
}
