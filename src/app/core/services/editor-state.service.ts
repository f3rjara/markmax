import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime } from 'rxjs';
import { MarkdownFile } from '../models/markdown-file.model';
import { ViewMode } from '../models/view-mode.enum';
import { FileRepository } from '../repositories/file-repository';
import { AUTOSAVE_DEBOUNCE_MS } from '../../shared/constants/text.constants';

@Injectable({ providedIn: 'root' })
export class EditorStateService {
  private readonly repo = inject(FileRepository);
  private readonly destroyRef = inject(DestroyRef);
  private readonly contentChange$ = new Subject<void>();
  /** Último contenido emitido por el editor aún no persistido (ventana del debounce). */
  private pendingSave: { id: string; content: string } | null = null;
  /** Cola serializada de escrituras para que el debounce y los flush no se crucen. */
  private saveQueue: Promise<void> = Promise.resolve();

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
      .subscribe(() => void this.flushPendingSave());
  }

  /**
   * Alterna el modo de visualización entre código y preview.
   */
  toggleViewMode(): void {
    // Flush para que el preview muestre el contenido recién escrito
    void this.flushPendingSave();
    this.viewMode.update((mode) => (mode === ViewMode.Code ? ViewMode.Preview : ViewMode.Code));
  }

  /**
   * Encola un cambio de contenido para persistirlo con debounce (400ms).
   * El `id` se captura en el momento de la escritura para que el guardado
   * siempre se aplique al archivo que originó el contenido.
   * @param content Nuevo contenido Markdown del archivo activo.
   */
  updateContent(content: string): void {
    const id = this.activeFileId();
    if (!id) {
      return;
    }
    this.pendingSave = { id, content };
    this.contentChange$.next();
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
   * No activa `isLoading`: es una recarga silenciosa para no destruir y
   * recrear el DOM del sidebar (placeholder "Cargando..." → parpadeo).
   * El indicador de carga inicial es responsabilidad de {@link loadAll}.
   */
  async loadFiles(): Promise<void> {
    const active = await this.repo.getActive();
    this.files.set(active);
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
   * Antes de cambiar, guarda de inmediato cualquier contenido pendiente del
   * debounce para no perder lo escrito en los últimos 400ms.
   * @param id Identificador del archivo a seleccionar.
   */
  selectFile(id: string | null): void {
    if (id !== this.activeFileId()) {
      void this.flushPendingSave();
    }
    this.activeFileId.set(id);
  }

  /**
   * Crea un nuevo archivo, recarga la lista y lo selecciona automáticamente.
   * @param title Título del archivo. Por defecto `'Untitled'`.
   * @returns El identificador UUID del archivo creado.
   */
  async createFile(title = 'Untitled'): Promise<string> {
    await this.flushPendingSave();
    const id = await this.repo.create({ title, content: '' });
    await this.loadFiles();
    this.activeFileId.set(id);
    return id;
  }

  /**
   * Actualiza el título y/o contenido del archivo actualmente seleccionado.
   * Actualiza el signal `files` localmente (sin recargar la lista desde la DB)
   * para no cambiar la referencia de `activeFile` en cada autoguardado:
   * eso disparaba el effect del editor y movía el cursor al inicio.
   * No hace nada si no hay archivo activo.
   * @param changes Campos a modificar.
   */
  async updateActiveFile(changes: Partial<MarkdownFile>): Promise<void> {
    const id = this.activeFileId();
    if (!id) {
      return;
    }
    await this.enqueuePersist(id, changes);
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
    // Flush para que el guardado en curso no pise este cambio al recargar la lista
    await this.flushPendingSave();
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
    // Flush para que el guardado en curso (con posible título extraído del H1)
    // no pise el renombrado explícito
    await this.flushPendingSave();
    await this.repo.update(id, { title: newTitle, hasCustomTitle: true });
    await this.loadFiles();
  }

  /**
   * Archiva un archivo por su id (desde activos o papelera).
   * Si el archivo estaba activo y seleccionado, limpia la selección.
   * @param id Identificador del archivo.
   */
  async archiveFile(id: string): Promise<void> {
    if (this.activeFileId() === id) {
      await this.flushPendingSave();
      this.activeFileId.set(null);
    }
    await this.repo.archive(id);
    await this.loadAll();
  }

  /**
   * Mueve un archivo a la papelera por su id.
   * Si el archivo estaba activo y seleccionado, limpia la selección.
   * @param id Identificador del archivo.
   */
  async trashFile(id: string): Promise<void> {
    if (this.activeFileId() === id) {
      await this.flushPendingSave();
      this.activeFileId.set(null);
    }
    await this.repo.moveToTrash(id);
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

  // ── Helpers de autoguardado ─────────────────────────────────────────────

  /**
   * Persiste de inmediato el contenido pendiente de la ventana del debounce.
   * Lo invoca el propio debounce y también cualquier acción que cambie o
   * cierre el archivo activo, para no perder lo escrito en los últimos 400ms.
   */
  private flushPendingSave(): Promise<void> {
    const pending = this.pendingSave;
    if (!pending) {
      return Promise.resolve();
    }
    this.pendingSave = null;
    return this.enqueuePersist(pending.id, this.buildChanges(pending.id, pending.content));
  }

  /**
   * Construye los cambios de un guardado de contenido, incluyendo la
   * extracción del título desde el primer H1 si el archivo no tiene
   * título personalizado.
   */
  private buildChanges(id: string, content: string): Partial<MarkdownFile> {
    const changes: Partial<MarkdownFile> = { content };
    const file = this.files().find((f) => f.id === id);
    if (file && !file.hasCustomTitle) {
      const firstLine = content.split('\n')[0] ?? '';
      if (firstLine.startsWith('# ')) {
        const extracted = firstLine.slice(2).trim();
        if (extracted) {
          changes.title = extracted;
        }
      }
    }
    return changes;
  }

  /**
   * Actualiza el signal `files` localmente de forma optimista (manteniendo la
   * posición del archivo en la lista) y encola la escritura en IndexedDB.
   * Las escrituras se serializan para que un flush al cambiar de archivo
   * no se cruce con un guardado del debounce en curso.
   */
  private enqueuePersist(id: string, changes: Partial<MarkdownFile>): Promise<void> {
    // Signal primero: sidebar, título e indicador de guardado reflejan el
    // cambio al instante, sin recargar la lista ni cambiar la referencia de
    // `activeFile` de forma que dispare el effect del editor.
    this.files.update((list) =>
      list.map((f) => (f.id === id ? { ...f, ...changes, updatedAt: Date.now() } : f)),
    );
    this.saveQueue = this.saveQueue
      .then(() => this.repo.update(id, changes))
      .catch((error: unknown) => {
        // Mantener la cola viva aunque falle una escritura
        console.error('[EditorState] Error al guardar el archivo', error);
      });
    return this.saveQueue;
  }
}
