import { Extension } from '@codemirror/state';
import {
  barf,
  dracula,
  coolGlow,
  amy,
  bespin,
  birdsOfParadise,
  boysAndGirls,
  cobalt,
  tomorrow,
} from 'thememirror';

/** Identificadores de los temas disponibles. */
export type EditorThemeName =
  | 'barf'
  | 'dracula'
  | 'coolGlow'
  | 'amy'
  | 'bespin'
  | 'birdsOfParadise'
  | 'boysAndGirls'
  | 'cobalt'
  | 'tomorrow';

/** Mapa de nombre → extension de tema de CodeMirror. */
export const EDITOR_THEMES: Record<EditorThemeName, Extension> = {
  barf,
  dracula,
  coolGlow,
  amy,
  bespin,
  birdsOfParadise,
  boysAndGirls,
  cobalt,
  tomorrow,
};

/** Tema por defecto al iniciar el editor. */
export const DEFAULT_THEME_NAME: EditorThemeName = 'dracula';
