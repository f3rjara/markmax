import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FileRepository } from '../repositories/file-repository';
import { TRASH_EXPIRY_MS } from '../../shared/text.constants';

/**
 * Servicio de limpieza automática de archivos vencidos en la papelera.
 *
 * En un entorno PWA no hay cronjobs; la limpieza se dispara:
 * 1. Al inicializar la aplicación.
 * 2. Cada vez que el usuario vuelve a la pestaña (evento `visibilitychange`).
 *
 * El servicio debe inyectarse en el componente raíz para que exista
 * durante toda la vida de la aplicación.
 */
@Injectable({ providedIn: 'root' })
export class TrashCleanupService {
  private readonly repo = inject(FileRepository);
  private readonly doc = inject(DOCUMENT);

  /** Callback registrado en el evento visibilitychange. */
  private readonly onVisibilityChange = (): void => {
    if (this.doc.visibilityState === 'visible') {
      void this.purge();
    }
  };

  /**
   * Inicia el servicio: realiza una purga inmediata y se suscribe a
   * `visibilitychange` para purgar cada vez que el usuario regresa a la app.
   *
   * @param onPurged Callback invocado si se eliminaron archivos vencidos,
   *   recibe el número de archivos eliminados.
   */
  start(onPurged?: (count: number) => void): void {
    this.purgedCallback = onPurged ?? null;
    void this.purge();
    this.doc.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  /** Detiene la escucha de visibilitychange. Llamar al destruir el host. */
  stop(): void {
    this.doc.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private purgedCallback: ((count: number) => void) | null = null;

  private async purge(): Promise<void> {
    const cutoff = Date.now() - TRASH_EXPIRY_MS;
    const count = await this.repo.purgeExpired(cutoff);
    if (count > 0 && this.purgedCallback) {
      this.purgedCallback(count);
    }
  }
}
