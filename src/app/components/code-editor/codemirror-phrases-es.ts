/**
 * Diccionario de traduccion al espanol para las frases internas de CodeMirror 6.
 * Se utiliza con `EditorState.phrases.of(...)` para internacionalizar
 * los paneles de busqueda, plegado, diagnosticos y accesibilidad.
 */
export const CODEMIRROR_PHRASES_ES: Record<string, string> = {
  // Panel de busqueda y reemplazo
  'Find': 'Buscar',
  'Replace': 'Reemplazar',
  'next': 'Siguiente',
  'previous': 'Anterior',
  'all': 'Todos',
  'match case': 'May/min',
  'regexp': 'Expresion regular',
  'by word': 'Palabra completa',
  'replace': 'Reemplazar',
  'replace all': 'Reemplazar todo',
  'close': 'Cerrar',

  // Mensajes de busqueda
  'of': 'de',
  'No results': 'Sin resultados',
  'current match': 'coincidencia actual',
  'on line': 'en linea',
  'Go to line': 'Ir a linea',
  'go': 'ir',

  // Plegado de codigo (code folding)
  'Fold line': 'Plegar linea',
  'Unfold line': 'Desplegar linea',
  'folded code': 'codigo plegado',
  'unfold': 'desplegar',
  'to': 'hasta',

  // Panel de diagnosticos (lint)
  'Diagnostics': 'Diagnosticos',
  'No diagnostics': 'Sin diagnosticos',

  // Accesibilidad
  'Control character': 'Caracter de control',
  'Completions': 'Sugerencias',
  'Selection deleted': 'Seleccion eliminada',
};
