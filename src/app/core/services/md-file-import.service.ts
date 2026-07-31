import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { EditorStateService } from './editor-state.service';
import { ToastService } from './toast.service';

/**
 * Datos del duplicado pendiente de confirmacion por el usuario.
 * El sidebar usa esta estructura para mostrar el dialogo de reemplazo.
 */
export interface ImportPendingReplace {
  existingId: string;
  title: string;
  content: string;
}

/** Tamano maximo permitido para un archivo importado: 2 MB en bytes. */
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

/** Extensiones de archivo permitidas para importacion. */
const ALLOWED_EXTENSIONS = new Set(['.md', '.markdown']);

/** Longitud maxima del titulo de un documento creado por importacion. */
const MAX_TITLE_LENGTH = 60;

/**
 * Servicio responsable de importar un archivo Markdown (.md / .markdown) desde
 * el sistema de archivos del usuario.
 *
 * Principios aplicados:
 * - SRP: unica responsabilidad, desacoplado del sidebar.
 * - DRY: reutiliza EditorStateService.createFile() y ToastService existentes.
 * - KISS: usa el File API nativo del browser, sin dependencias adicionales.
 *
 * Casos contemplados:
 * 1.  Cancelacion del file picker: se ignora silenciosamente.
 * 2.  Extension invalida: toast de error.
 * 3.  Archivo vacio: se crea documento con titulo del nombre y contenido vacio.
 * 4.  Archivo demasiado grande (> 2 MB): toast de error.
 * 5.  Encoding invalido / contenido binario detectado: toast de error.
 * 6.  Bytes nulos (NUL) en el contenido: toast de error.
 * 7.  H1 presente en el contenido: se usa como titulo del documento.
 * 8.  Sin H1: se usa el nombre del archivo sin extension como titulo.
 * 9.  Titulo demasiado largo (> 60 chars): se trunca.
 * 10. CRLF (Windows line endings): se normalizan a LF antes de guardar.
 * 11. Titulo duplicado: devuelve ImportPendingReplace para que el llamador
 *     muestre una confirmacion al usuario antes de reemplazar.
 */
@Injectable({ providedIn: 'root' })
export class MdFileImportService {
  private readonly doc = inject(DOCUMENT);
  private readonly editorState = inject(EditorStateService);
  private readonly toast = inject(ToastService);

  /**
   * Abre el file picker nativo del browser.
   * - Si el archivo es valido y no hay duplicado de titulo: crea el documento y retorna null.
   * - Si hay un titulo duplicado: retorna `ImportPendingReplace` para que el llamador
   *   muestre una confirmacion al usuario antes de aplicar el reemplazo.
   * - En cualquier error de validacion: muestra toast y retorna null.
   */
  async importFromFile(): Promise<ImportPendingReplace | null> {
    const input = this.createFileInput();
    const file = await this.pickFile(input);
    if (!file) return null;
    return this.importFromDrop(file);
  }

  /**
   * Valida e importa un archivo obtenido directamente desde un evento drag & drop.
   * Reutiliza toda la logica de validacion de importFromFile sin duplicar codigo.
   * @param file Archivo obtenido de DataTransfer.files
   * @returns null si el archivo se proceso sin conflicto, o ImportPendingReplace si hay titulo duplicado.
   */
  async importFromDrop(file: File): Promise<ImportPendingReplace | null> {
    return this.processFile(file);
  }

  /**
   * Aplica el reemplazo de contenido sobre el documento duplicado.
   * Debe llamarse cuando el usuario confirma el dialogo de reemplazo.
   * @param pending Datos del duplicado pendiente.
   */
  async confirmReplace(pending: ImportPendingReplace): Promise<void> {
    await this.editorState.updateActiveFileById(pending.existingId, pending.content);
    this.toast.show('Contenido de "' + pending.title + '" reemplazado', 'success');
  }

  // -- Privado ----------------------------------------------------------------

  /**
   * Crea un <input type="file"> transitorio (no insertado en el DOM)
   * configurado para aceptar solo archivos .md y .markdown.
   */
  private createFileInput(): HTMLInputElement {
    const input = this.doc.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown';
    return input;
  }

  /**
   * Abre el picker y resuelve con el archivo seleccionado o null si el usuario cancela.
   */
  private pickFile(input: HTMLInputElement): Promise<File | null> {
    return new Promise((resolve) => {
      input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true });
      // El evento 'cancel' solo esta disponible en navegadores modernos
      input.addEventListener('cancel', () => resolve(null), { once: true });
      input.click();
    });
  }

  /**
   * Valida, sanitiza el archivo y decide si crearlo o indicar duplicado.
   * @returns null si el archivo se proceso sin conflicto, o ImportPendingReplace si hay titulo duplicado.
   */
  private async processFile(file: File): Promise<ImportPendingReplace | null> {
    // Caso 2: Extension no permitida
    if (!this.isValidExtension(file.name)) {
      this.toast.show('Solo se permiten archivos .md o .markdown', 'error');
      return null;
    }

    // Caso 4: Archivo demasiado grande
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.toast.show('El archivo supera el limite de 2 MB', 'error');
      return null;
    }

    // Caso 3: Archivo vacio
    if (file.size === 0) {
      const title = this.extractTitleFromFileName(file.name);
      await this.editorState.createFile(title);
      this.toast.show('Archivo "' + title + '" importado', 'success');
      return null;
    }

    let rawText: string;
    try {
      rawText = await file.text();
    } catch {
      // Caso 5: Error de lectura / encoding invalido
      this.toast.show('El archivo no parece ser texto valido', 'error');
      return null;
    }

    // Caso 5 (adicional): Detectar contenido no decodificable
    if (this.looksLikeBinary(rawText)) {
      this.toast.show('El archivo no parece ser texto valido', 'error');
      return null;
    }

    // Caso 6: Bytes nulos (NUL) indican contenido binario
    if (rawText.includes('\0')) {
      this.toast.show('El contenido no es texto legible', 'error');
      return null;
    }

    // Caso 10: Normalizar CRLF a LF
    const content = this.normalizeCrlf(rawText);

    // Casos 7 y 8: Extraer titulo desde H1 o usar el nombre del archivo
    const title = this.extractTitleFromContent(content) ?? this.extractTitleFromFileName(file.name);

    // Caso 9: Truncar titulo si supera el maximo
    const finalTitle = this.truncateTitle(title);

    // Caso 11: Detectar duplicado — devolver al llamador para que confirme
    const existingId = this.findExistingByTitle(finalTitle);
    if (existingId) {
      return { existingId, title: finalTitle, content };
    }

    await this.editorState.createFile(finalTitle, content);
    this.toast.show('Archivo "' + finalTitle + '" importado', 'success');
    return null;
  }

  /**
   * Busca un archivo activo cuyo titulo coincida exactamente (case-insensitive)
   * con el titulo proporcionado.
   * @param title Titulo a buscar.
   * @returns El id del archivo encontrado o null.
   */
  private findExistingByTitle(title: string): string | null {
    const lower = title.toLowerCase();
    const found = this.editorState.files().find((f) => f.title.toLowerCase() === lower);
    return found?.id ?? null;
  }

  /**
   * Valida que el nombre de archivo tenga una extension permitida.
   * La comparacion es case-insensitive para cubrir .MD, .Md, etc.
   */
  private isValidExtension(fileName: string): boolean {
    const lower = fileName.toLowerCase();
    for (const ext of ALLOWED_EXTENSIONS) {
      if (lower.endsWith(ext)) return true;
    }
    return false;
  }

  /**
   * Heuristica para detectar contenido binario basada en la proporcion de
   * caracteres de reemplazo Unicode (U+FFFD) que genera el TextDecoder cuando
   * encuentra bytes invalidos en UTF-8. Un archivo de texto normal no deberia
   * tener mas de 1% de caracteres de este tipo.
   */
  private looksLikeBinary(text: string): boolean {
    if (text.length === 0) return false;
    const replacementCount = (text.match(/\uFFFD/g) ?? []).length;
    return replacementCount / text.length > 0.01;
  }

  /**
   * Normaliza los saltos de linea estilo Windows (CRLF) a Unix (LF).
   */
  private normalizeCrlf(text: string): string {
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  /**
   * Extrae el texto del primer encabezado H1 del contenido Markdown.
   * Retorna null si no hay ningun H1 en las primeras 20 lineas.
   */
  private extractTitleFromContent(content: string): string | null {
    const lines = content.split('\n').slice(0, 20);
    for (const line of lines) {
      if (line.startsWith('# ')) {
        const extracted = line.slice(2).trim();
        if (extracted) return extracted;
      }
    }
    return null;
  }

  /**
   * Genera un titulo a partir del nombre del archivo eliminando la extension
   * y normalizando guiones y guiones bajos a espacios.
   */
  private extractTitleFromFileName(fileName: string): string {
    const withoutExtension = fileName.replace(/\.(md|markdown)$/i, '');
    return withoutExtension.replace(/[-_]+/g, ' ').trim() || 'Untitled';
  }

  /**
   * Trunca el titulo a MAX_TITLE_LENGTH caracteres si es necesario.
   */
  private truncateTitle(title: string): string {
    return title.length > MAX_TITLE_LENGTH ? title.slice(0, MAX_TITLE_LENGTH).trim() : title;
  }
}
