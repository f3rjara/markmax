import { Injectable, signal } from '@angular/core';
import { EditorThemeName, DEFAULT_THEME_NAME } from '../../components/code-editor/codemirror-themes';

/**
 * Servicio global para almacenar y persistir configuraciones del usuario.
 * Actualmente gestiona el tema del editor CodeMirror.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private static readonly STORAGE_KEY = 'markmax-settings';

  /** Signal que contiene el nombre del tema activo. */
  readonly theme = signal<EditorThemeName>(this.loadTheme());

  /** Cambia el tema y lo persiste en localStorage. */
  setTheme(themeName: EditorThemeName): void {
    this.theme.set(themeName);
    this.saveTheme(themeName);
  }

  private loadTheme(): EditorThemeName {
    try {
      const raw = localStorage.getItem(SettingsService.STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as { theme?: string };
        if (data.theme && this.isValidTheme(data.theme)) {
          return data.theme as EditorThemeName;
        }
      }
    } catch {
      // Ignorar errores y usar tema por defecto.
    }
    return DEFAULT_THEME_NAME;
  }

  private saveTheme(themeName: EditorThemeName): void {
    try {
      const payload = JSON.stringify({ theme: themeName });
      localStorage.setItem(SettingsService.STORAGE_KEY, payload);
    } catch {
      // Ignorar fallos de almacenamiento.
    }
  }

  private isValidTheme(name: string): name is EditorThemeName {
    return (
      name === 'barf' ||
      name === 'dracula' ||
      name === 'coolGlow' ||
      name === 'amy' ||
      name === 'bespin' ||
      name === 'birdsOfParadise' ||
      name === 'boysAndGirls' ||
      name === 'cobalt' ||
      name === 'tomorrow'
    );
  }
}
