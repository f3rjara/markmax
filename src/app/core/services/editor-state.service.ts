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
    this.loadFiles();
    this.contentChange$
      .pipe(debounceTime(AUTOSAVE_DEBOUNCE_MS), takeUntilDestroyed(this.destroyRef))
      .subscribe((content) => this.updateActiveFile({ content }));
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
   * Carga todos los archivos activos desde el repositorio y actualiza el signal `files`.
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
  async updateActiveFile(changes: Partial<Pick<MarkdownFile, 'title' | 'content'>>): Promise<void> {
    const id = this.activeFileId();
    if (!id) {
      return;
    }
    await this.repo.update(id, changes);
    await this.loadFiles();
  }

  /**
   * Mueve el archivo activo a la papelera y limpia la selección.
   * No hace nada si no hay archivo activo.
   */
  async trashActiveFile(): Promise<void> {
    const id = this.activeFileId();
    if (!id) {
      return;
    }
    await this.repo.moveToTrash(id);
    this.activeFileId.set(null);
    await this.loadFiles();
  }

  /**
   * Archiva el archivo activo y limpia la selección.
   * No hace nada si no hay archivo activo.
   */
  async archiveActiveFile(): Promise<void> {
    const id = this.activeFileId();
    if (!id) {
      return;
    }
    await this.repo.archive(id);
    this.activeFileId.set(null);
    await this.loadFiles();
  }
}
