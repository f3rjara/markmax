import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { injectHotkeys } from '@tanstack/angular-hotkeys';
import { EditorStateService } from './editor-state.service';
import { UiStateService } from './ui-state.service';
import { ToastService } from './toast.service';
import { ViewMode } from '../models/view-mode.enum';

@Injectable({ providedIn: 'root' })
export class HotkeyService {
  private readonly editorState = inject(EditorStateService);
  private readonly uiState = inject(UiStateService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);

  constructor() {
    this.registerHotkeys();
    this.setupGlobalBlockers();
  }

  private registerHotkeys(): void {
    injectHotkeys([
      {
        hotkey: 'Mod+S',
        callback: (e) => {
          e.preventDefault();
          const activeFile = this.editorState.activeFile();
          if (activeFile) {
            void this.editorState.flushPendingSave().then(() => {
              this.toast.show('Cambios guardados', 'success');
            });
          }
        },
      },
      {
        hotkey: 'Mod+Alt+N',
        callback: (e) => {
          e.preventDefault();
          void this.editorState.createFile().then(() => {
            this.toast.show('Nuevo archivo creado', 'success');
          });
        },
      },
      {
        hotkey: 'Mod+O',
        callback: (e) => {
          e.preventDefault();
          this.uiState.importRequest$.next();
        },
      },
      {
        hotkey: 'Mod+B',
        callback: (e) => {
          e.preventDefault();
          this.uiState.toggleSidebar();
        },
      },
      {
        hotkey: 'Mod+E',
        callback: (e) => {
          e.preventDefault();
          if (this.editorState.activeFile()) {
            this.editorState.toggleViewMode();
          }
        },
      },
      {
        hotkey: 'Mod+Shift+F',
        callback: (e) => {
          e.preventDefault();
          if (this.editorState.activeFile() && this.editorState.viewMode() === ViewMode.Code) {
            this.uiState.toolsMenuRequest$.next();
          }
        },
      },
      {
        hotkey: 'Mod+Enter',
        callback: (e) => {
          e.preventDefault();
          this.triggerRename();
        },
      },
      {
        hotkey: 'F2',
        callback: (e) => {
          e.preventDefault();
          this.triggerRename();
        },
      },
      {
        hotkey: 'Mod+Shift+P',
        callback: (e) => {
          e.preventDefault();
          const activeId = this.editorState.activeFileId();
          if (activeId) {
            void this.editorState.togglePinFile(activeId).then(() => {
              const isPinned = this.editorState.files().find((f) => f.id === activeId)?.pinned;
              this.toast.show(
                isPinned ? 'Archivo fijado' : 'Archivo desfijado',
                isPinned ? 'info' : 'warning',
              );
            });
          }
        },
      },
      {
        hotkey: 'Mod+Shift+Backspace',
        callback: (e) => {
          e.preventDefault();
          const activeId = this.editorState.activeFileId();
          if (activeId) {
            void this.editorState.archiveFile(activeId).then(() => {
              this.toast.show('Archivo movido a Archivados', 'info');
            });
          }
        },
      },
      {
        hotkey: 'Mod+,',
        callback: (e) => {
          e.preventDefault();
          void this.router.navigate(['/configuracion']);
        },
      },
    ]);
  }

  private setupGlobalBlockers(): void {
    const win = this.doc.defaultView;
    if (!win) return;

    win.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        const isMod = e.ctrlKey || e.metaKey;
        const key = e.key.toLowerCase();

        // 1. Bloquear Ctrl+Shift+I solo en PWA instalada
        const isStandalone = win.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone && isMod && e.shiftKey && key === 'i') {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        // 2. Bloquear Mod+D, Mod+A, Mod+F, Mod+G fuera de CodeMirror
        if (isMod && (key === 'd' || key === 'a' || key === 'f' || key === 'g')) {
          const target = e.target as HTMLElement;
          const insideEditor = target?.closest?.('.cm-editor');
          if (!insideEditor) {
            e.preventDefault();
            e.stopPropagation();
          }
        }

        // 3. Atajo Mod+Enter / F2 global garantizado para renombrar
        if ((isMod && key === 'enter') || e.key === 'F2') {
          e.preventDefault();
          e.stopPropagation();
          this.triggerRename();
          return;
        }
      },
      { capture: true },
    );
  }

  private triggerRename(): void {
    const activeFile = this.editorState.activeFile();
    if (activeFile) {
      if (!this.uiState.sidebarOpen()) {
        this.uiState.sidebarOpen.set(true);
      }
      this.uiState.renameRequest$.next();
    }
  }
}
