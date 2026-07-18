# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.3.1] - 2026-07-18

### Agregado

- Localización en español de las frases y del panel de búsqueda de CodeMirror.
- Estilos globales para la barra de desplazamiento (scrollbar) adaptados a la identidad visual de la marca.
- Implementación de un tema personalizado (`thememirror`) para el editor de código en sustitución de `@codemirror/theme-one-dark`.

### Modificado

- Refactorización de la configuración y estilos de CodeMirror para modularizar la inicialización, temas, y traducciones.

## [1.3.0] - 2026-07-17

### Agregado

- Servicio de actualización PWA con detección de nuevas versiones y banner de notificación para el usuario.
- Soporte para `window-controls-overlay` en el manifiesto PWA con estilos globales para la barra de título.
- Capturas de pantalla (escritorio y móvil) e ícono de recarga para el manifiesto.
- Script `update-version.js` y variable de versión en `version.ts`.

### Modificado

- Manifiesto PWA ampliado con shortcuts y configuración de display override.
- `app.ts` y `package.json` actualizados para integrar el servicio de actualización.

## [1.2.0] - 2026-07-17

### Corregido

- Se previnieron los errores de selección en CodeMirror agregando extensiones de plegado (`foldGutter` y `foldKeymap`) y refinando el manejo de excepciones en el editor de código.

### Otros

- Actualización de la versión del proyecto a la versión 1.1.0 en `package.json`.
