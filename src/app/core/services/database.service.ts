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
   * Retorna todos los archivos archivados ordenados por fecha de modificación descendente.
   */
  async getArchived(): Promise<MarkdownFile[]> {
    const results = await this.db.files
      .where('status')
      .equals(FileStatus.Archived)
      .sortBy('updatedAt');
    return results.toReversed();
  }

  /**
   * Retorna todos los archivos en la papelera ordenados por deletedAt descendente
   * (más recientemente eliminado primero).
   */
  async getDeleted(): Promise<MarkdownFile[]> {
    const results = await this.db.files
      .where('status')
      .equals(FileStatus.Deleted)
      .toArray();
    return results.sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
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
  async update(id: string, changes: Partial<MarkdownFile>): Promise<void> {
    await this.db.files.update(id, { ...changes, updatedAt: Date.now() });
  }

  /**
   * Mueve un archivo a la papelera cambiando su estado a `deleted` y registrando
   * el timestamp de eliminación para calcular el vencimiento de 5 días.
   * @param id Identificador del archivo.
   */
  async moveToTrash(id: string): Promise<void> {
    const now = Date.now();
    await this.db.files.update(id, {
      status: FileStatus.Deleted,
      deletedAt: now,
      updatedAt: now,
    });
  }

  /**
   * Archiva un archivo cambiando su estado a `archived`.
   * @param id Identificador del archivo.
   */
  async archive(id: string): Promise<void> {
    await this.db.files.update(id, {
      status: FileStatus.Archived,
      deletedAt: undefined,
      updatedAt: Date.now(),
    });
  }

  /**
   * Restaura un archivo archivado o eliminado al estado activo.
   * @param id Identificador del archivo.
   */
  async restore(id: string): Promise<void> {
    await this.db.files.update(id, {
      status: FileStatus.Active,
      deletedAt: undefined,
      updatedAt: Date.now(),
    });
  }

  /**
   * Elimina permanentemente un registro de la base de datos.
   * @param id Identificador del archivo.
   */
  async deleteForever(id: string): Promise<void> {
    await this.db.files.delete(id);
  }

  /**
   * Elimina permanentemente todos los archivos en papelera cuyo `deletedAt`
   * sea anterior al timestamp de corte.
   * @param cutoffMs Timestamp en ms. Los archivos con deletedAt < cutoffMs se purgan.
   * @returns Cantidad de archivos eliminados.
   */
  async purgeExpired(cutoffMs: number): Promise<number> {
    const expired = await this.db.files
      .where('status')
      .equals(FileStatus.Deleted)
      .and((f) => (f.deletedAt ?? 0) < cutoffMs)
      .toArray();

    if (expired.length === 0) return 0;

    await this.db.files.bulkDelete(expired.map((f) => f.id));
    return expired.length;
  }
}
