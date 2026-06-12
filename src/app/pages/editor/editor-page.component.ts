import { Component, computed, inject, signal } from '@angular/core';
import { EditorStateService } from '../../core/services/editor-state.service';
import { ViewMode } from '../../core/models/view-mode.enum';
import { CodeEditorComponent } from '../../components/code-editor/code-editor.component';
import { MarkdownPreviewComponent } from '../../components/markdown-preview/markdown-preview.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { WelcomeComponent } from '../../components/welcome/welcome.component';
import { IconComponent } from '../../components/icon/icon.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-editor-page',
  imports: [
    CodeEditorComponent,
    MarkdownPreviewComponent,
    SidebarComponent,
    WelcomeComponent,
    IconComponent,
    RelativeTimePipe,
  ],
  templateUrl: './editor-page.component.html',
})
export class EditorPageComponent {
  protected readonly editorState = inject(EditorStateService);
  protected readonly ViewMode = ViewMode;
  protected readonly sidebarOpen = signal(true);

  protected toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  /** Título dinámico: extrae el encabezado H1 del contenido si el título es genérico. */
  protected readonly activeTitle = computed(() => {
    const file = this.editorState.activeFile();
    if (!file) {
      return '';
    }
    if (file.title && file.title !== 'Untitled') {
      return file.title;
    }
    const firstLine = file.content.split('\n')[0] ?? '';
    if (firstLine.startsWith('# ')) {
      return firstLine.slice(2).trim();
    }
    return file.title;
  });

  protected setViewMode(mode: ViewMode): void {
    if (this.editorState.viewMode() !== mode) {
      this.editorState.toggleViewMode();
    }
  }

  protected createFile(): void {
    void this.editorState.createFile();
  }

  /** Placeholder: abrirá el off-canvas de herramientas rápidas en una fase posterior. */
  protected openToolsPanel(): void {
    // off-canvas de herramientas rápidas (Fase 4)
  }

  protected onContentChange(content: string): void {
    this.editorState.updateContent(content);
  }
}
