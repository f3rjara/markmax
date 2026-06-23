import { Component, computed, inject, output, signal, DestroyRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { EditorStateService } from '../../core/services/editor-state.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { TRASH_EXPIRY_DAYS } from '../../shared/text.constants';

/** Seccion del sidebar que origino la apertura del menu contextual. */
type MenuSection = 'active' | 'archived' | 'deleted';

/**
 * Panel lateral con lista de archivos Markdown, busqueda local,
 * y secciones de Archivados y Eliminados.
 */
@Component({
  selector: 'app-sidebar',
  imports: [IconComponent, ConfirmDialogComponent],
  host: {
    class: 'block h-full overflow-hidden',
  },
  templateUrl: './sidebar.component.html',
  styles: `
    .sidebar-context-menu {
      position: absolute;
      z-index: 50;
      width: 180px;
      background: var(--color-mm-sidebar);
      border: 1px solid var(--color-mm-border);
      border-radius: 8px;
      padding: 4px;
      box-shadow:
        0 8px 30px rgba(0, 0, 0, 0.5),
        0 2px 6px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(139, 92, 246, 0.05);
      animation: context-menu-fade-in 0.12s ease-out;
      backdrop-filter: blur(8px);
    }

    @keyframes context-menu-fade-in {
      from {
        opacity: 0;
        transform: translateY(-4px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .context-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 6px 8px;
      border-radius: 5px;
      border: none;
      background: transparent;
      color: var(--color-mm-text);
      font-size: 12px;
      cursor: pointer;
      text-align: left;
      transition:
        background 0.1s ease,
        color 0.1s ease;
    }

    .context-menu-item:hover {
      background: var(--color-mm-surface-hover);
      color: var(--color-mm-text);
    }

    .context-menu-item:focus-visible {
      outline: 2px solid var(--color-mm-accent);
      outline-offset: -2px;
    }

    .context-menu-item--danger {
      color: #ef4444;
    }

    .context-menu-item--danger:hover {
      background: rgba(239, 68, 68, 0.1) !important;
      color: #f87171 !important;
    }

    .context-item-icon {
      color: var(--color-mm-text-secondary);
      flex-shrink: 0;
    }

    .context-menu-item:hover .context-item-icon {
      color: var(--color-mm-accent);
    }

    .context-menu-item--danger:hover .context-item-icon {
      color: #f87171 !important;
    }

    .context-separator {
      height: 1px;
      background: var(--color-mm-border);
      margin: 4px;
    }

    /* Secciones fijas del sidebar */
    .sidebar-section {
      border-top: 1px solid var(--color-mm-border);
      flex-shrink: 0;
    }

    .sidebar-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 16px;
      cursor: pointer;
      user-select: none;
      transition: background 0.1s;
    }

    .sidebar-section-header:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .sidebar-section-header:focus-visible {
      outline: 2px solid var(--color-mm-accent);
      outline-offset: -2px;
    }

    .sidebar-section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-mm-text-secondary);
    }

    .sidebar-section-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 600;
      background: var(--color-mm-surface);
      color: var(--color-mm-text-secondary);
      border: 1px solid var(--color-mm-border);
    }

    .sidebar-section-list {
      max-height: 140px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .days-badge {
      font-size: 10px;
      color: var(--color-mm-text-secondary);
      opacity: 0.7;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .days-badge--urgent {
      color: #f87171;
      opacity: 1;
    }

    .chevron-icon {
      color: var(--color-mm-text-secondary);
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }

    .chevron-icon--open {
      transform: rotate(180deg);
    }
  `,
})
export class SidebarComponent {
  protected readonly editorState = inject(EditorStateService);
  protected readonly toastService = inject(ToastService);
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

    const blob = new Blob([file.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = this.doc.createElement('a');
    anchor.href = url;
    anchor.download = `${file.title.replace(/[^a-z0-9_\-\s]/gi, '').trim() || 'untitled'}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.closeMenu();
    this.toastService.show(`Descargando "${file.title}"`, 'success');
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
