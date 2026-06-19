import { Injectable, inject } from '@angular/core';
import { AppDatabase } from '../db/app-database';
import { FileStatus, MarkdownFile } from '../models/markdown-file.model';
import { FileRepository } from '../repositories/file-repository';

/**
 * Implementación concreta de {@link FileRepository} usando IndexedDB vía Dexie.
 *
 * Responsabilidad única: operaciones CRUD sobre la tabla `files`.
 * La configuración de la base de datos es responsabilidad de {@link AppDatabase}.
 */
@Injectable({ providedIn: 'root' })
export class DatabaseService extends FileRepository {
  private readonly db = inject(AppDatabase);

  /**
   * Retorna todos los archivos con estado activo,
   * ordenados por fecha de modificación de forma descendente (más reciente primero).
   */
  async getActive(): Promise<MarkdownFile[]> {
    const results = await this.db.files
      .where('status')
      .equals(FileStatus.Active)
      .sortBy('updatedAt');
    const reversed = results.toReversed();
    const pinned = reversed.filter((f) => f.pinned);
    const unpinned = reversed.filter((f) => !f.pinned);
    return [...pinned, ...unpinned];
  }

  /**
   * Retorna un archivo por su identificador único.
   * @param id Identificador UUID del archivo.
   */
  async getById(id: string): Promise<MarkdownFile | undefined> {
    return this.db.files.get(id);
  }

  /**
   * Crea un nuevo archivo Markdown con estado activo.
   * @param data Título y contenido inicial del archivo.
   * @returns El identificador UUID del archivo recién creado.
   */
  async create(data: Pick<MarkdownFile, 'title' | 'content'>): Promise<string> {
    const now = Date.now();
    const file: MarkdownFile = {
      id: crypto.randomUUID(),
      title: data.title,
      content: data.content,
      createdAt: now,
      updatedAt: now,
      status: FileStatus.Active,
    };
    await this.db.files.add(file);
    return file.id;
  }

  /**
   * Actualiza los campos editables de un archivo y su fecha de modificación.
   * @param id Identificador del archivo a actualizar.
   * @param changes Campos a modificar (título y/o contenido).
   */
  async update(
    id: string,
    changes: Partial<MarkdownFile>,
  ): Promise<void> {
    await this.db.files.update(id, { ...changes, updatedAt: Date.now() });
  }

  /**
   * Mueve un archivo a la papelera cambiando su estado a `deleted`.
   * @param id Identificador del archivo.
   */
  async moveToTrash(id: string): Promise<void> {
    await this.db.files.update(id, { status: FileStatus.Deleted, updatedAt: Date.now() });
  }

  /**
   * Archiva un archivo cambiando su estado a `archived`.
   * @param id Identificador del archivo.
   */
  async archive(id: string): Promise<void> {
    await this.db.files.update(id, { status: FileStatus.Archived, updatedAt: Date.now() });
  }
}
