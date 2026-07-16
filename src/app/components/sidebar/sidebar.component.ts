import { Component, computed, inject, output, signal, DestroyRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { EditorStateService } from '../../core/services/editor-state.service';
import { ToastService } from '../../core/services/toast.service';
import { DatabaseService } from '../../core/services/database.service';
import { IconComponent } from '../icon/icon.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ExportDialogComponent } from '../export-dialog/export-dialog.component';
import { TRASH_EXPIRY_DAYS } from '../../shared/text.constants';
import JSZip from 'jszip';

/** Seccion del sidebar que origino la apertura del menu contextual. */
type MenuSection = 'active' | 'archived' | 'deleted';

/**
 * Panel lateral con lista de archivos Markdown, busqueda local,
 * y secciones de Archivados y Eliminados.
 */
@Component({
  selector: 'app-sidebar',
  imports: [IconComponent, ConfirmDialogComponent, ExportDialogComponent],
  host: {
    class: 'block h-full overflow-hidden',
  },
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  protected readonly editorState = inject(EditorStateService);
  protected readonly toastService = inject(ToastService);
  protected readonly db = inject(DatabaseService);
  protected readonly searchTerm = signal('');
  readonly closeRequest = output<void>();

  /** Dias de retension en la papelera, para mostrarlo en el template */
  protected readonly trashExpiryDays = TRASH_EXPIRY_DAYS;

  // Estado del menu contextual
  protected readonly activeMenuFileId = signal<string | null>(null);
  protected readonly menuPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });
  protected readonly menuSection = signal<MenuSection>('active');
  protected readonly editingFileId = signal<string | null>(null);

  // Estado del dialogo de confirmacion
  protected readonly confirmDeleteId = signal<string | null>(null);
  protected readonly confirmDeleteName = signal('');

  // Estado del dialogo de exportacion
  protected readonly exportDialogFileId = signal<string | null>(null);
  protected readonly exportDialogFileName = signal('');
  protected readonly exportDialogImageCount = signal(0);

  // Estado de secciones colapsables
  protected readonly archivedExpanded = signal(false);
  protected readonly deletedExpanded = signal(false);

  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private outsideClickHandler: ((e: PointerEvent) => void) | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.removeOutsideListener());
  }

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
    if (this.editingFileId() === id) {
      return;
    }
    this.editorState.selectFile(id);
  }

  protected createFile(): void {
    void this.editorState.createFile();
  }

  protected onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  // --- Métodos del menu contextual ---

  /**
   * Altura estimada del menu segun la seccion, para calcular si cabe hacia abajo.
   * Activos: fijar + renombrar + sep + archivar + eliminar = ~172px
   * Archivados/Eliminados: restaurar + sep + eliminar = ~112px
   */
  private menuHeightFor(section: MenuSection): number {
    // Activos: fijar + renombrar + sep + descargar + archivar + eliminar = ~202px
    // Archivados/Eliminados: restaurar + sep + eliminar = ~112px
    return section === 'active' ? 202 : 112;
  }

  protected openMenu(event: MouseEvent, fileId: string, section: MenuSection = 'active'): void {
    event.stopPropagation();
    event.preventDefault();

    const button = event.currentTarget as HTMLElement;
    const buttonRect = button.getBoundingClientRect();
    const navEl = this.doc.getElementById('sidebar-nav');
    if (!navEl) return;
    const navRect = navEl.getBoundingClientRect();

    const menuH = this.menuHeightFor(section);
    const spaceBelow = navRect.bottom - buttonRect.bottom;
    const openUpward = spaceBelow < menuH + 8;

    const top = openUpward
      ? buttonRect.top - navRect.top - menuH - 4
      : buttonRect.bottom - navRect.top + 4;
    const left = buttonRect.right - navRect.left - 180;

    this.menuPosition.set({ top, left });
    this.activeMenuFileId.set(fileId);
    this.menuSection.set(section);
    this.attachOutsideListener();
  }

  protected openMenuFromRightClick(
    event: MouseEvent,
    fileId: string,
    section: MenuSection = 'active',
  ): void {
    event.stopPropagation();
    event.preventDefault();

    const navEl = this.doc.getElementById('sidebar-nav');
    if (!navEl) return;
    const navRect = navEl.getBoundingClientRect();

    const menuH = this.menuHeightFor(section);
    const clickY = event.clientY - navRect.top;
    const spaceBelow = navRect.height - clickY;
    const openUpward = spaceBelow < menuH + 8;

    const top = openUpward ? clickY - menuH : clickY;
    const left = Math.min(event.clientX - navRect.left, navRect.width - 188);

    this.menuPosition.set({ top, left });
    this.activeMenuFileId.set(fileId);
    this.menuSection.set(section);
    this.attachOutsideListener();
  }

  protected closeMenu(): void {
    this.activeMenuFileId.set(null);
    this.removeOutsideListener();
  }

  // --- Acciones de archivos (seccion activos) ---

  protected togglePin(fileId: string): void {
    void this.editorState.togglePinFile(fileId);
    this.closeMenu();
  }

  protected startRename(fileId: string): void {
    this.editingFileId.set(fileId);
    this.closeMenu();

    setTimeout(() => {
      const inputEl = this.doc.getElementById(`rename-input-${fileId}`) as HTMLInputElement;
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }
    }, 0);
  }

  protected saveRename(fileId: string, newTitle: string): void {
    const trimmed = newTitle.trim();
    if (trimmed) {
      void this.editorState.renameFile(fileId, trimmed);
    }
    this.editingFileId.set(null);
  }

  protected cancelRename(): void {
    this.editingFileId.set(null);
  }

  protected isFilePinned(id: string | null): boolean {
    if (!id) return false;
    return this.editorState.files().find((f) => f.id === id)?.pinned ?? false;
  }

  protected archiveFile(fileId: string): void {
    void this.editorState.archiveFile(fileId);
    this.closeMenu();
    this.toastService.show('Archivo movido a Archivados', 'info');
  }

  protected downloadFile(fileId: string): void {
    const file = this.editorState.files().find((f) => f.id === fileId);
    if (!file) return;

    const imageCount = this.countLocalImages(file.content);
    if (imageCount > 0) {
      this.exportDialogFileId.set(fileId);
      this.exportDialogFileName.set(file.title);
      this.exportDialogImageCount.set(imageCount);
    } else {
      this.downloadMd(fileId, file.content);
    }
  }

  protected async onExportBase64(): Promise<void> {
    const fileId = this.exportDialogFileId();
    const file = this.editorState.files().find((f) => f.id === fileId);
    if (!file) return;

    this.closeExportDialog();
    const content = await this.resolveImagesBase64(file.content);
    this.downloadMdBlob(content, file.title);
    this.toastService.show(`Descargando "${file.title}"`, 'success');
  }

  protected async onExportZip(): Promise<void> {
    const fileId = this.exportDialogFileId();
    const file = this.editorState.files().find((f) => f.id === fileId);
    if (!file) return;

    this.closeExportDialog();
    const zip = new JSZip();

    const imagesDir = zip.folder('images');
    const content = await this.resolveImagesZip(file.content, imagesDir!);

    zip.file(`${file.title.replace(/[^a-z0-9_\-\s]/gi, '').trim() || 'untitled'}.md`, content);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const anchor = this.doc.createElement('a');
    anchor.href = url;
    anchor.download = `${file.title.replace(/[^a-z0-9_\-\s]/gi, '').trim() || 'untitled'}.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.closeMenu();
    this.toastService.show(`Descargando "${file.title}.zip"`, 'success');
  }

  protected closeExportDialog(): void {
    this.exportDialogFileId.set(null);
  }

  private countLocalImages(content: string): number {
    const re = /mm-image:\/\//g;
    let count = 0;
    while (re.exec(content) !== null) count++;
    return count;
  }

  private downloadMd(fileId: string, content: string): void {
    const file = this.editorState.files().find((f) => f.id === fileId);
    if (!file) return;
    this.downloadMdBlob(content, file.title);
    this.closeMenu();
    this.toastService.show(`Descargando "${file.title}"`, 'success');
  }

  private downloadMdBlob(content: string, title: string): void {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = this.doc.createElement('a');
    anchor.href = url;
    anchor.download = `${title.replace(/[^a-z0-9_\-\s]/gi, '').trim() || 'untitled'}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private async resolveImagesBase64(content: string): Promise<string> {
    const uuidRe = /mm-image:\/\/([a-f0-9-]+)/g;
    const uuids = new Set<string>();
    let match;
    while ((match = uuidRe.exec(content)) !== null) {
      uuids.add(match[1]);
    }
    if (uuids.size === 0) return content;

    let resolved = content;
    for (const uuid of uuids) {
      const img = await this.db.getImageById(uuid);
      if (!img) continue;

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(img.data);
      });

      resolved = resolved.replace(
        new RegExp(`\\(mm-image://${uuid}(\\s+"[^"]*")?\\)`, 'g'),
        `(${dataUrl}$1)`,
      );
    }
    return resolved;
  }

  private async resolveImagesZip(content: string, imagesDir: JSZip): Promise<string> {
    const uuidRe = /mm-image:\/\/([a-f0-9-]+)/g;
    const uuids = new Set<string>();
    let match;
    while ((match = uuidRe.exec(content)) !== null) {
      uuids.add(match[1]);
    }
    if (uuids.size === 0) return content;

    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'image/bmp': '.bmp',
      'image/avif': '.avif',
    };

    let resolved = content;
    for (const uuid of uuids) {
      const img = await this.db.getImageById(uuid);
      if (!img) continue;

      const ext = extMap[img.mimeType] || '.bin';
      const filename = `${uuid}${ext}`;
      imagesDir.file(filename, img.data);

      resolved = resolved.replace(
        new RegExp(`\\(mm-image://${uuid}(\\s+"[^"]*")?\\)`, 'g'),
        `(images/${filename}$1)`,
      );
    }
    return resolved;
  }

  protected trashFile(fileId: string): void {
    void this.editorState.trashFile(fileId);
    this.closeMenu();
    this.toastService.show(
      `Archivo movido a Eliminados. Se borrara permanentemente en ${TRASH_EXPIRY_DAYS} dias.`,
      'warning',
    );
  }

  // --- Acciones de archivos (seccion archivados) ---

  protected restoreFromArchive(fileId: string): void {
    void this.editorState.restoreFile(fileId);
    this.closeMenu();
    this.toastService.show('Archivo restaurado a Recientes', 'success');
  }

  protected trashFromArchive(fileId: string): void {
    void this.editorState.trashFile(fileId);
    this.closeMenu();
    this.toastService.show(
      `Archivo movido a Eliminados. Se borrara permanentemente en ${TRASH_EXPIRY_DAYS} dias.`,
      'warning',
    );
  }

  // --- Acciones de archivos (seccion eliminados) ---

  protected restoreFromTrash(fileId: string): void {
    void this.editorState.restoreFile(fileId);
    this.closeMenu();
    this.toastService.show('Archivo restaurado a Recientes', 'success');
  }

  protected requestDeleteForever(fileId: string): void {
    const file =
      this.editorState.deletedFiles().find((f) => f.id === fileId) ??
      this.editorState.archivedFiles().find((f) => f.id === fileId);
    this.confirmDeleteId.set(fileId);
    this.confirmDeleteName.set(file?.title ?? 'Archivo');
    this.closeMenu();
  }

  protected confirmDeleteForever(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    void this.editorState.deleteFileForever(id);
    this.confirmDeleteId.set(null);
    this.toastService.show('Archivo eliminado definitivamente', 'error');
  }

  protected cancelDeleteForever(): void {
    this.confirmDeleteId.set(null);
  }

  // --- Utilidades para el countdown de la papelera ---

  /**
   * Calcula los dias restantes antes de la eliminacion automatica.
   * @param deletedAt Timestamp en ms de cuando se elimino el archivo.
   */
  protected daysRemaining(deletedAt: number | undefined): number {
    if (!deletedAt) return TRASH_EXPIRY_DAYS;
    const msRemaining = deletedAt + TRASH_EXPIRY_DAYS * 24 * 60 * 60 * 1000 - Date.now();
    return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
  }

  protected daysLabel(deletedAt: number | undefined): string {
    const days = this.daysRemaining(deletedAt);
    if (days === 0) return 'Hoy';
    if (days === 1) return '1 dia';
    return `${days} dias`;
  }

  protected isUrgent(deletedAt: number | undefined): boolean {
    return this.daysRemaining(deletedAt) <= 1;
  }

  // --- Toggle de secciones ---

  protected toggleArchived(): void {
    this.archivedExpanded.update((v) => !v);
  }

  protected toggleDeleted(): void {
    this.deletedExpanded.update((v) => !v);
  }

  // --- Gestion del listener externo ---

  private attachOutsideListener(): void {
    this.removeOutsideListener();

    this.outsideClickHandler = (e: PointerEvent) => {
      const target = e.target as Node;

      const menu = this.doc.querySelector('.sidebar-context-menu');
      if (menu?.contains(target)) return;

      const optionButtons = this.doc.querySelectorAll('.file-options-trigger');
      let clickedButton = false;
      optionButtons.forEach((btn) => {
        if (btn.contains(target)) clickedButton = true;
      });
      if (clickedButton) return;

      this.closeMenu();
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
