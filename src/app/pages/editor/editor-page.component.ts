import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';
import { EditorStateService } from '../../core/services/editor-state.service';
import { ViewMode } from '../../core/models/view-mode.enum';
import { CodeEditorComponent } from '../../components/code-editor/code-editor.component';
import { MarkdownPreviewComponent } from '../../components/markdown-preview/markdown-preview.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { WelcomeComponent } from '../../components/welcome/welcome.component';
import { IconComponent } from '../../components/icon/icon.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { MarkdownToolsMenuComponent } from '../../components/markdown-tools/markdown-tools-menu.component';
import { MarkdownFormatType } from '../../core/models/markdown-format.model';
import { TableBuilderComponent } from '../../components/table-builder/table-builder.component';
import { ImagePickerComponent } from '../../components/image-picker/image-picker.component';
import { ImageUrlPickerComponent } from '../../components/image-url-picker/image-url-picker.component';
import { DatabaseService } from '../../core/services/database.service';
import { ImagePickResult, ImageUrlResult } from '../../shared/models/image-picker.model';

@Component({
  selector: 'app-editor-page',
  imports: [
    CodeEditorComponent,
    MarkdownPreviewComponent,
    SidebarComponent,
    WelcomeComponent,
    IconComponent,
    RelativeTimePipe,
    MarkdownToolsMenuComponent,
    TableBuilderComponent,
    ImagePickerComponent,
    ImageUrlPickerComponent,
  ],
  templateUrl: './editor-page.component.html',
})
export class EditorPageComponent {
  protected readonly editorState = inject(EditorStateService);
  protected readonly db = inject(DatabaseService);
  protected readonly ViewMode = ViewMode;
  protected readonly sidebarOpen = signal(true);
  protected readonly toolsMenuOpen = signal(false);
  protected readonly activeFormat = signal<MarkdownFormatType | null>(null);
  protected readonly tableBuilderOpen = signal(false);
  protected readonly imagePickerOpen = signal(false);
  protected readonly imageUrlPickerOpen = signal(false);

  private readonly codeEditor = viewChild(CodeEditorComponent);
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Listener de pointerdown en fase de captura para cerrar el menú cuando se
   * hace clic fuera del botón trigger o del panel del menú.
   * Se usa captura (capture: true) porque CodeMirror consume los eventos de
   * clic en su propio canvas y nunca los deja burbujear al documento.
   */
  private outsideClickHandler: ((e: PointerEvent) => void) | null = null;

  constructor() {
    // Limpiar listener si el componente se destruye con el menú abierto
    this.destroyRef.onDestroy(() => this.removeOutsideListener());
  }

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

  /** Abre el menú (o lo cierra si ya estaba abierto — toggle). */
  protected openToolsPanel(): void {
    if (this.toolsMenuOpen()) {
      this.closeToolsMenu();
      return;
    }

    const editor = this.codeEditor();
    if (editor) {
      this.activeFormat.set(editor.getLineContext());
    }
    this.toolsMenuOpen.set(true);

    // Diferir el registro del listener para que el click actual que abre el menú
    // no lo cierre inmediatamente.
    setTimeout(() => this.attachOutsideListener(), 0);
  }

  /** Cierra el menú y elimina el listener del documento. */
  protected closeToolsMenu(): void {
    this.toolsMenuOpen.set(false);
    this.removeOutsideListener();
  }

  /** Aplica el formato seleccionado en el editor y cierra el menú. */
  protected onToolSelected(type: MarkdownFormatType): void {
    if (type === MarkdownFormatType.Table) {
      this.closeToolsMenu();
      this.tableBuilderOpen.set(true);
      return;
    }
    if (type === MarkdownFormatType.Image) {
      this.closeToolsMenu();
      this.imagePickerOpen.set(true);
      return;
    }
    if (type === MarkdownFormatType.ImageUrl) {
      this.closeToolsMenu();
      this.imageUrlPickerOpen.set(true);
      return;
    }
    this.codeEditor()?.applyFormat(type);
    this.closeToolsMenu();
  }

  protected onTableInsert(markdown: string): void {
    this.codeEditor()?.insertRaw(markdown);
    this.tableBuilderOpen.set(false);
  }

  protected onTableCancel(): void {
    this.tableBuilderOpen.set(false);
    this.codeEditor()?.focus();
  }

  protected async onImageInsert(result: ImagePickResult): Promise<void> {
    const fileId = this.editorState.activeFileId();
    if (!fileId) return;

    const imageId = await this.db.saveImage({
      data: result.blob,
      mimeType: result.mimeType,
      name: result.name,
      fileId,
      createdAt: Date.now(),
    });

    const title = result.alignment ? `"${result.alignment}"` : '';
    const markdown = `![${result.alt}](mm-image://${imageId}${title ? ' ' + title : ''})`;
    this.codeEditor()?.insertRaw(markdown);
    this.imagePickerOpen.set(false);
  }

  protected onImageCancel(): void {
    this.imagePickerOpen.set(false);
    this.codeEditor()?.focus();
  }

  protected onImageUrlInsert(result: ImageUrlResult): void {
    const title = result.alignment ? `"${result.alignment}"` : '';
    const markdown = `![${result.alt}](${result.url}${title ? ' ' + title : ''})`;
    this.codeEditor()?.insertRaw(markdown);
    this.imageUrlPickerOpen.set(false);
  }

  protected onImageUrlCancel(): void {
    this.imageUrlPickerOpen.set(false);
    this.codeEditor()?.focus();
  }

  protected onContentChange(content: string): void {
    this.editorState.updateContent(content);
  }

  // ── Gestión del listener externo ───────────────────────────────────────────

  private attachOutsideListener(): void {
    this.outsideClickHandler = (e: PointerEvent) => {
      const target = e.target as Node;

      // No cerrar si el clic es sobre el botón trigger
      const trigger = this.doc.getElementById('tools-menu-trigger');
      if (trigger?.contains(target)) return;

      // No cerrar si el clic es dentro del panel del menú
      const menuPanel = this.doc.querySelector('app-markdown-tools-menu');
      if (menuPanel?.contains(target)) return;

      this.closeToolsMenu();
    };

    this.doc.addEventListener('pointerdown', this.outsideClickHandler, { capture: true });
  }

  private removeOutsideListener(): void {
    if (this.outsideClickHandler) {
      this.doc.removeEventListener('pointerdown', this.outsideClickHandler, { capture: true });
      this.outsideClickHandler = null;
    }
  }
}
