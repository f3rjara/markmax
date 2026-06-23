import { MarkdownFile } from '../models/markdown-file.model';

/**
 * Contrato abstracto para el repositorio de archivos Markdown.
 *
 * Define las operaciones de persistencia independientemente de su implementación.
 * Permite desacoplar la capa de estado ({@link EditorStateService}) de la capa
 * de acceso a datos ({@link DatabaseService}), facilitando pruebas unitarias
 * y posibles migraciones de motor de persistencia.
 */
export abstract class FileRepository {
  /**
   * Retorna todos los archivos activos ordenados por fecha de modificación descendente.
   */
  abstract getActive(): Promise<MarkdownFile[]>;

  /**
   * Retorna todos los archivos archivados ordenados por fecha de modificación descendente.
   */
  abstract getArchived(): Promise<MarkdownFile[]>;

  /**
   * Retorna todos los archivos en la papelera ordenados por deletedAt descendente.
   */
  abstract getDeleted(): Promise<MarkdownFile[]>;

  /**
   * Retorna un archivo por su identificador único.
   * @param id Identificador UUID del archivo.
   */
  abstract getById(id: string): Promise<MarkdownFile | undefined>;

  /**
   * Crea un nuevo archivo Markdown con estado activo.
   * @param data Título y contenido inicial.
   * @returns El identificador UUID del archivo creado.
   */
  abstract create(data: Pick<MarkdownFile, 'title' | 'content'>): Promise<string>;

  /**
   * Actualiza los campos editables de un archivo.
   * @param id Identificador del archivo a actualizar.
   * @param changes Campos a modificar (título y/o contenido).
   */
  abstract update(id: string, changes: Partial<MarkdownFile>): Promise<void>;

  /**
   * Mueve un archivo a la papelera (estado `deleted`) y registra el timestamp.
   * @param id Identificador del archivo.
   */
  abstract moveToTrash(id: string): Promise<void>;

  /**
   * Archiva un archivo (estado `archived`).
   * @param id Identificador del archivo.
   */
  abstract archive(id: string): Promise<void>;

  /**
   * Restaura un archivo archivado o eliminado al estado activo.
   * @param id Identificador del archivo.
   */
  abstract restore(id: string): Promise<void>;

  /**
   * Elimina permanentemente un archivo de la base de datos.
   * @param id Identificador del archivo.
   */
  abstract deleteForever(id: string): Promise<void>;

  /**
   * Elimina permanentemente todos los archivos en la papelera cuyo `deletedAt`
   * sea anterior al timestamp de corte proporcionado.
   * @param cutoffMs Timestamp en ms. Los archivos con `deletedAt < cutoffMs` se eliminan.
   * @returns Cantidad de archivos eliminados.
   */
  abstract purgeExpired(cutoffMs: number): Promise<number>;
}
