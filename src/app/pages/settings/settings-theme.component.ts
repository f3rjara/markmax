import { Component, inject } from '@angular/core';
import { SettingsService } from '../../core/services/settings.service';
import { EditorThemeName } from '../../components/code-editor/codemirror-themes';
import { IconComponent } from '../../components/icon/icon.component';

interface ThemeOption {
  id: EditorThemeName;
  name: string;
  description: string;
  isDark: boolean;
  accentColor: string;
  bgColor: string;
}

/**
 * Componente de configuracion para la seleccion del tema del editor CodeMirror.
 */
@Component({
  selector: 'app-settings-theme',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './settings-theme.component.html',
  styleUrl: './settings-theme.component.css',
})
export class SettingsThemeComponent {
  private readonly settingsService = inject(SettingsService);

  protected readonly currentTheme = this.settingsService.theme;

  protected readonly themes: ThemeOption[] = [
    {
      id: 'barf',
      name: 'Barf',
      description: 'Tema por defecto de Markmax con tonos oscuros equilibrados',
      isDark: true,
      accentColor: '#69c',
      bgColor: '#15191e',
    },
    {
      id: 'dracula',
      name: 'Dracula',
      description: 'Gama de colores góticos oscuros y vibrantes',
      isDark: true,
      accentColor: '#bd93f9',
      bgColor: '#282a36',
    },
    {
      id: 'coolGlow',
      name: 'Cool Glow',
      description: 'Resaltado de neón brillante sobre fondo noche',
      isDark: true,
      accentColor: '#00f6ff',
      bgColor: '#060a17',
    },
    {
      id: 'amy',
      name: 'Amy',
      description: 'Fondo violeta profundo con acentos cian y ámbar',
      isDark: true,
      accentColor: '#9d7cce',
      bgColor: '#200020',
    },
    {
      id: 'bespin',
      name: 'Bespin',
      description: 'Inspirado en tonos cálidos y contrastes terrosos',
      isDark: true,
      accentColor: '#f9ee98',
      bgColor: '#28211c',
    },
    {
      id: 'birdsOfParadise',
      name: 'Birds of Paradise',
      description: 'Colores de temática tropical y cálida',
      isDark: true,
      accentColor: '#ef5d32',
      bgColor: '#2a1f1d',
    },
    {
      id: 'boysAndGirls',
      name: 'Boys & Girls',
      description: 'Fondo oscuro sobrio con acentos de color pastel',
      isDark: true,
      accentColor: '#f3a0c0',
      bgColor: '#1e1e24',
    },
    {
      id: 'cobalt',
      name: 'Cobalt',
      description: 'Fondo azul cobalto de alto contraste',
      isDark: true,
      accentColor: '#ff9d00',
      bgColor: '#002240',
    },
    {
      id: 'tomorrow',
      name: 'Tomorrow',
      description: 'Apariencia limpia y nocturna de bajo brillo',
      isDark: true,
      accentColor: '#81a2be',
      bgColor: '#1d1f21',
    },
  ];

  protected selectTheme(themeId: EditorThemeName): void {
    this.settingsService.setTheme(themeId);
  }
}
