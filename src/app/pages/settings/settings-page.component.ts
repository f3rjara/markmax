import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../components/icon/icon.component';

/**
 * Pagina de Configuracion de la aplicacion.
 * Contiene un menu lateral izquierdo no enumerado y una zona de contenido.
 */
@Component({
  selector: 'app-settings-page',
  imports: [IconComponent],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.css',
})
export class SettingsPageComponent {
  private readonly router = inject(Router);
  protected _showGeneralSettings = signal<boolean>(true);

  protected goToEditor(): void {
    void this.router.navigate(['/']);
  }

  protected showGeneralSettings(): void {
    if (!this._showGeneralSettings()) {
      this._showGeneralSettings.set(true);
    }
  }
}
