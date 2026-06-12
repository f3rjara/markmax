import { Injectable, computed, inject, signal } from '@angular/core';
import { MarkdownFile } from '../models/markdown-file.model';
import { FileRepository } from '../repositories/file-repository';

@Injectable({ providedIn: 'root' })
export class EditorStateService {
  private readonly repo = inject(FileRepository);

  readonly files = signal<MarkdownFile[]>([]);
  readonly activeFileId = signal<string | null>(null);
  readonly isLoading = signal(false);

  /**
   * Archivo actualmente seleccionado, derivado de `files` y `activeFileId`.
   */
  readonly activeFile = computed(
    () => this.files().find((f) => f.id === this.activeFileId()) ?? null,
  );

  constructor() {
    this.loadFiles();
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
