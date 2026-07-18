import { Component, inject, signal } from '@angular/core';
import { UpdateService } from '../../core/services/update.service';
import { IconComponent } from '../icon/icon.component';
import { APP_VERSION } from '../../version';

@Component({
  selector: 'app-update-banner',
  imports: [IconComponent],
  template: `
    @if (updateService.updateAvailable() && !isDismissed()) {
      <div class="update-banner" role="alert" aria-live="assertive">
        <div class="update-banner-content">
          <app-icon name="refresh-cw" [size]="16" class="update-icon" />
          <span class="update-message">
            ¡Nueva versión disponible! (Versión actual: v{{ currentVersion }}). Para aplicar los últimos cambios y forzar la actualización, haz clic en actualizar ahora.
          </span>
        </div>
        <div class="update-banner-actions">
          <button
            type="button"
            class="mm-btn-primary update-btn"
            (click)="updateService.activateUpdate()"
          >
            Actualizar ahora
          </button>
          <button
            type="button"
            class="update-dismiss-btn"
            aria-label="Ignorar por ahora"
            (click)="dismiss()"
          >
            <app-icon name="x" [size]="14" />
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: './update-banner.component.css',
})
export class UpdateBannerComponent {
  protected readonly updateService = inject(UpdateService);
  protected readonly currentVersion = APP_VERSION;
  protected readonly isDismissed = signal<boolean>(false);

  protected dismiss(): void {
    this.isDismissed.set(true);
  }
}
