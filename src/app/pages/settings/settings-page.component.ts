import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../components/icon/icon.component';
import { TooltipDirective } from '../../shared/directives/tooltip.directive';
import { UiStateService } from '../../core/services/ui-state.service';
import { DOCUMENT } from '@angular/common';

/**
 * Pagina de Configuracion de la aplicacion.
 * Contiene un menu lateral izquierdo no enumerado y una zona de contenido.
 */
@Component({
  selector: 'app-settings-page',
  imports: [IconComponent, TooltipDirective],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.css',
})
export class SettingsPageComponent {
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);
  protected readonly uiState = inject(UiStateService);

  protected readonly activeSection = signal<'general' | 'shortcuts'>('general');

  /** Detecta si el sistema operativo es macOS. */
  protected readonly isMac = computed(() => {
    const ua = this.doc.defaultView?.navigator.userAgent ?? '';
    return /Mac|iPhone|iPod|iPad/.test(ua);
  });

  protected goToEditor(): void {
    void this.router.navigate(['/']);
  }

  protected showSection(section: 'general' | 'shortcuts'): void {
    this.activeSection.set(section);
  }

  protected toggleSidebar(): void {
    this.uiState.toggleSidebar();
  }
}
