import { Component, computed, inject } from '@angular/core';
import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { APP_VERSION } from '../../version';

/**
 * Componente que presenta las especificaciones generales, detalles del sistema y filosofia de Markmax.
 */
@Component({
  selector: 'app-about',
  imports: [NgOptimizedImage, IconComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent {
  private readonly doc = inject(DOCUMENT);

  protected readonly appVersion = APP_VERSION;
  protected readonly buildDate = '2026-08-22';
  protected readonly licenseType = 'Licencia GPLv3';
  protected readonly storageType = 'Local-first (Dexie / IndexedDB)';

  /** Determina el sistema operativo del usuario. */
  protected readonly osName = computed(() => {
    const ua = this.doc.defaultView?.navigator.userAgent ?? '';
    if (/Mac|iPhone|iPod|iPad/.test(ua)) {
      return 'macOS';
    }
    if (/Windows/.test(ua)) {
      return 'Windows';
    }
    if (/Linux/.test(ua)) {
      return 'Linux';
    }
    return 'Web';
  });
}
