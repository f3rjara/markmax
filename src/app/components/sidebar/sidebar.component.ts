import { Component, computed, inject, output, signal } from '@angular/core';
import { EditorStateService } from '../../core/services/editor-state.service';
import { IconComponent } from '../icon/icon.component';

/**
 * Panel lateral con lista de archivos Markdown y búsqueda local.
 */
@Component({
  selector: 'app-sidebar',
  imports: [IconComponent],
  host: {
    class: 'block h-full overflow-hidden',
  },
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  protected readonly editorState = inject(EditorStateService);
  protected readonly searchTerm = signal('');
  readonly closeRequest = output<void>();

  protected readonly filteredFiles = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      return this.editorState.files();
    }
    return this.editorState
      .files()
      .filter(
        (f) =>
          f.title.toLowerCase().includes(term) || (f.excerpt ?? '').toLowerCase().includes(term),
      );
  });

  protected isActive(id: string): boolean {
    return this.editorState.activeFileId() === id;
  }

  protected selectFile(id: string): void {
    this.editorState.selectFile(id);
  }

  protected createFile(): void {
    void this.editorState.createFile();
  }

  protected onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }
}
