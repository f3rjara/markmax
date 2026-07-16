import { Component, input, output } from '@angular/core';
import { MARKDOWN_TOOLS, MarkdownFormatType } from '../../core/models/markdown-format.model';
import { IconComponent } from '../icon/icon.component';
import { GROUP_ORDER } from '../../shared/constants/markdown-tools-groups.constant';

@Component({
  selector: 'app-markdown-tools-menu',
  imports: [IconComponent],
  template: `
    <!-- Panel del menú -->
    <div class="tools-menu" role="menu" aria-label="Herramientas de formato Markdown">
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
            (click)="onToolClick(tool.type)"
          >
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
  styleUrl: './markdown-tools-menu.component.css',
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
