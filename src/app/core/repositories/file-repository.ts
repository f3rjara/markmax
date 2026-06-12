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
  abstract update(
    id: string,
    changes: Partial<Pick<MarkdownFile, 'title' | 'content'>>,
  ): Promise<void>;

  /**
   * Mueve un archivo a la papelera (estado `deleted`).
   * @param id Identificador del archivo.
   */
  abstract moveToTrash(id: string): Promise<void>;

  /**
   * Archiva un archivo (estado `archived`).
   * @param id Identificador del archivo.
   */
  abstract archive(id: string): Promise<void>;
}
