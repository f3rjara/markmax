import { Component, computed, inject, output, signal, DestroyRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
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
  styles: `
    .sidebar-context-menu {
      position: absolute;
      z-index: 50;
      width: 160px;
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
      transition: background 0.1s ease, color 0.1s ease;
    }

    .context-menu-item:hover:not(.context-menu-item--disabled) {
      background: var(--color-mm-surface-hover);
      color: var(--color-mm-text);
    }

    .context-menu-item:focus-visible {
      outline: 2px solid var(--color-mm-accent);
      outline-offset: -2px;
    }

    .context-menu-item--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .context-menu-item--danger {
      color: #ef4444;
    }
    
    .context-menu-item--danger:hover:not(.context-menu-item--disabled) {
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
  `,
})
export class SidebarComponent {
  protected readonly editorState = inject(EditorStateService);
  protected readonly searchTerm = signal('');
  readonly closeRequest = output<void>();

  // Estado para menú contextual
  protected readonly activeMenuFileId = signal<string | null>(null);
  protected readonly menuPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });
  protected readonly editingFileId = signal<string | null>(null);

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
      return; // No seleccionar mientras se edita el nombre
    }
    this.editorState.selectFile(id);
  }

  protected createFile(): void {
    void this.editorState.createFile();
  }

  protected onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  // Métodos del menú contextual
  protected openMenu(event: MouseEvent, fileId: string): void {
    event.stopPropagation();
    event.preventDefault();

    const button = event.currentTarget as HTMLElement;
    const buttonRect = button.getBoundingClientRect();
    const navEl = this.doc.getElementById('sidebar-nav');
    if (!navEl) return;
    const navRect = navEl.getBoundingClientRect();

    const top = buttonRect.bottom - navRect.top + 4;
    const left = buttonRect.right - navRect.left - 160;

    this.menuPosition.set({ top, left });
    this.activeMenuFileId.set(fileId);
    this.attachOutsideListener();
  }

  protected openMenuFromRightClick(event: MouseEvent, fileId: string): void {
    event.stopPropagation();
    event.preventDefault();

    const navEl = this.doc.getElementById('sidebar-nav');
    if (!navEl) return;
    const navRect = navEl.getBoundingClientRect();

    const top = event.clientY - navRect.top;
    const left = Math.min(event.clientX - navRect.left, navRect.width - 168);

    this.menuPosition.set({ top, left });
    this.activeMenuFileId.set(fileId);
    this.attachOutsideListener();
  }

  protected closeMenu(): void {
    this.activeMenuFileId.set(null);
    this.removeOutsideListener();
  }

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

  private attachOutsideListener(): void {
    this.removeOutsideListener();

    this.outsideClickHandler = (e: PointerEvent) => {
      const target = e.target as Node;

      // No cerrar si el clic es dentro de la lista o dentro del menú contextual
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
