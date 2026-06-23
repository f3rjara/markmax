import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime } from 'rxjs';
import { MarkdownFile } from '../models/markdown-file.model';
import { ViewMode } from '../models/view-mode.enum';
import { FileRepository } from '../repositories/file-repository';
import { AUTOSAVE_DEBOUNCE_MS } from '../../shared/text.constants';

@Injectable({ providedIn: 'root' })
export class EditorStateService {
  private readonly repo = inject(FileRepository);
  private readonly destroyRef = inject(DestroyRef);
  private readonly contentChange$ = new Subject<string>();

  readonly files = signal<MarkdownFile[]>([]);
  readonly archivedFiles = signal<MarkdownFile[]>([]);
  readonly deletedFiles = signal<MarkdownFile[]>([]);
  readonly activeFileId = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly viewMode = signal<ViewMode>(ViewMode.Code);

  /**
   * Archivo actualmente seleccionado, derivado de `files` y `activeFileId`.
   */
  readonly activeFile = computed(
    () => this.files().find((f) => f.id === this.activeFileId()) ?? null,
  );

  constructor() {
    this.loadAll();
    this.contentChange$
      .pipe(debounceTime(AUTOSAVE_DEBOUNCE_MS), takeUntilDestroyed(this.destroyRef))
      .subscribe((content) => {
        const activeFile = this.activeFile();
        if (!activeFile) return;

        const changes: Partial<MarkdownFile> = { content };
        if (!activeFile.hasCustomTitle) {
          const firstLine = content.split('\n')[0] ?? '';
          if (firstLine.startsWith('# ')) {
            const extracted = firstLine.slice(2).trim();
            if (extracted) {
              changes.title = extracted;
            }
          }
        }
        void this.updateActiveFile(changes);
      });
  }

  /**
   * Alterna el modo de visualización entre código y preview.
   */
  toggleViewMode(): void {
    this.viewMode.update((mode) => (mode === ViewMode.Code ? ViewMode.Preview : ViewMode.Code));
  }

  /**
   * Encola un cambio de contenido para persistirlo con debounce (400ms).
   * @param content Nuevo contenido Markdown del archivo activo.
   */
  updateContent(content: string): void {
    this.contentChange$.next(content);
  }

  /**
   * Carga todos los archivos (activos, archivados y eliminados) en paralelo.
   */
  async loadAll(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [active, archived, deleted] = await Promise.all([
        this.repo.getActive(),
        this.repo.getArchived(),
        this.repo.getDeleted(),
      ]);
      this.files.set(active);
      this.archivedFiles.set(archived);
      this.deletedFiles.set(deleted);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Recarga solo la lista de archivos activos.
   */
  async loadFiles(): Promise<void> {
    this.isLoading.set(true);
    try {
      const active = await this.repo.getActive();
      this.files.set(active);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Recarga los archivos eliminados (útil tras una purga automática).
   */
  async reloadDeleted(): Promise<void> {
    const deleted = await this.repo.getDeleted();
    this.deletedFiles.set(deleted);
  }

  /**
   * Selecciona un archivo como activo, o limpia la selección si `id` es `null`.
   * @param id Identificador del archivo a seleccionar.
   */
  selectFile(id: string | null): void {
    this.activeFileId.set(id);
  }

  /**
   * Crea un nuevo archivo, recarga la lista y lo selecciona automáticamente.
   * @param title Título del archivo. Por defecto `'Untitled'`.
   * @returns El identificador UUID del archivo creado.
   */
  async createFile(title = 'Untitled'): Promise<string> {
    const id = await this.repo.create({ title, content: '' });
    await this.loadFiles();
    this.activeFileId.set(id);
    return id;
  }

  /**
   * Actualiza el título y/o contenido del archivo actualmente seleccionado.
   * No hace nada si no hay archivo activo.
   * @param changes Campos a modificar.
   */
  async updateActiveFile(changes: Partial<MarkdownFile>): Promise<void> {
    const id = this.activeFileId();
    if (!id) {
      return;
    }
    await this.repo.update(id, changes);
    await this.loadFiles();
  }

  /**
   * Alterna el estado de fijado (pin) de un archivo por su identificador.
   * @param id Identificador del archivo.
   */
  async togglePinFile(id: string): Promise<void> {
    const file = this.files().find((f) => f.id === id);
    if (!file) {
      return;
    }
    const pinned = !file.pinned;
    await this.repo.update(id, { pinned });
    await this.loadFiles();
  }

  /**
   * Cambia el título de un archivo de manera explícita por el usuario.
   * @param id Identificador del archivo.
   * @param newTitle Nuevo título del archivo.
   */
  async renameFile(id: string, newTitle: string): Promise<void> {
    await this.repo.update(id, { title: newTitle, hasCustomTitle: true });
    await this.loadFiles();
  }

  /**
   * Archiva un archivo por su id (desde activos o papelera).
   * Si el archivo estaba activo y seleccionado, limpia la selección.
   * @param id Identificador del archivo.
   */
  async archiveFile(id: string): Promise<void> {
    await this.repo.archive(id);
    if (this.activeFileId() === id) {
      this.activeFileId.set(null);
    }
    await this.loadAll();
  }

  /**
   * Mueve un archivo a la papelera por su id.
   * Si el archivo estaba activo y seleccionado, limpia la selección.
   * @param id Identificador del archivo.
   */
  async trashFile(id: string): Promise<void> {
    await this.repo.moveToTrash(id);
    if (this.activeFileId() === id) {
      this.activeFileId.set(null);
    }
    await this.loadAll();
  }

  /**
   * Restaura un archivo archivado o eliminado al estado activo.
   * @param id Identificador del archivo.
   */
  async restoreFile(id: string): Promise<void> {
    await this.repo.restore(id);
    await this.loadAll();
  }

  /**
   * Elimina permanentemente un archivo de la base de datos.
   * @param id Identificador del archivo.
   */
  async deleteFileForever(id: string): Promise<void> {
    await this.repo.deleteForever(id);
    await this.loadAll();
  }
}
