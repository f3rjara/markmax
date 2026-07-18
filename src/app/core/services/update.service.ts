import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from './toast.service';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly updateAvailable = signal<boolean>(false);

  constructor() {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    // Escuchar actualizaciones listas
    this.swUpdate.versionUpdates
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
      )
      .subscribe(() => {
        this.updateAvailable.set(true);
      });

    // Escuchar fallos de instalacion de version
    this.swUpdate.versionUpdates
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((evt) => evt.type === 'VERSION_INSTALLATION_FAILED')
      )
      .subscribe(() => {
        this.updateAvailable.set(false);
        this.toastService.show(
          'Error al instalar la nueva versión. La aplicación sigue funcionando con la versión actual.',
          'error'
        );
      });

    // Polling de actualizaciones cada 60 segundos
    setInterval(() => {
      void this.checkForUpdate();
    }, 60000);
  }

  async checkForUpdate(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      try {
        await this.swUpdate.checkForUpdate();
      } catch (err) {
        console.error('Error buscando actualizaciones:', err);
      }
    }
  }

  async activateUpdate(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      try {
        await this.swUpdate.activateUpdate();
        document.location.reload();
      } catch (err) {
        console.error('Error activando la actualizacion:', err);
        this.toastService.show('Error al activar la nueva versión. Intente recargar manualmente.', 'error');
      }
    } else {
      document.location.reload();
    }
  }
}
