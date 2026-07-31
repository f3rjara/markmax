# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.5.0] - 2026-07-31

### Agregado

- Funcionalidad de arrastrar y soltar archivos (drag & drop) directamente sobre el panel lateral para importar archivos `.md` y `.markdown` desde el sistema de archivos.
- Hint informativo "Arrastra archivos aqui" fijo en el sidebar: visible en hover cuando hay 12 o menos archivos activos, posicionado entre la lista de recientes y las secciones de Archivados/Eliminados.
- Overlay fantasma animado "Suelta aqui para cargar" que cubre el sidebar durante el arrastre, con icono pulsante y efecto de fondo desenfocado.
- Nuevo icono `upload-cloud` al catalogo de iconos SVG disponibles (`icon.type.ts`).
- Bloqueo de drop en el area del editor y preview para evitar que el navegador navegue al archivo soltado fuera del sidebar.

### Modificado

- `MdFileImportService`: metodo `importFromDrop(file: File)` expuesto publicamente para reutilizar la logica de validacion (extension, tamano, encoding, duplicados) desde el drag & drop, sin duplicar codigo.
- `SidebarComponent`: incorpora handlers nativos de drag & drop (`dragenter`, `dragover`, `dragleave`, `drop`) con contador de entradas para evitar parpadeo del overlay en eventos de hijos. Reutiliza el dialogo de confirmacion de reemplazo existente para titulos duplicados al soltar.

---

## [1.4.2] - 2026-07-30

### Agregado

- Pagina de configuracion (`/settings`) con componente dedicado y estilos propios.
- Ruta lazy para la pagina de configuracion en el enrutador principal.
- Acceso directo a configuracion desde el sidebar mediante icono de ajustes.
- Nuevo icono `settings` al catalogo de iconos disponibles (`icon.type.ts`).

### Modificado

- `SidebarComponent` actualizado para incluir navegacion hacia la ruta de configuracion.

---

## [1.4.1] - 2026-07-30

### Corregido

- Solucion a vulnaribilidades transitivas

## [1.4.0] - 2026-07-29

### Agregado

- Permite subir archivos mediante el boton de importacion de la barra lateral

### Modificado

- Diálogo de confirmación de reemplazo de importación
- Permite al usuario confirmar el reemplazo de un archivo existente al importar uno nuevo con el mismo nombre.

## [1.3.5] - 2026-07-23

### Agregado

- Nuevas fuentes de texto
  - CodeMirror: JetBrains Mono
  - Preview: Space Grotesk

### Modificado

- Actualización de estilos globales para code, soporte lenguajes en bloques de codigo

## [1.3.4] - 2026-07-23

### Agregado

- Botón de copiado de URL en los enlaces del visualizador de Markdown al hacer hover, permitiendo copiar la dirección al portapapeles de forma directa.

## [1.3.3] - 2026-07-22

### Corregido

- Los enlaces en el visualizador de Markdown se abrían dentro de la misma PWA. Se configuraron para abrirse en una pestaña nueva o en el navegador externo del sistema (`target="_blank"`, `rel="noopener noreferrer"`).
- Se actualizaron las reglas del sanitizador DOMPurify para no remover los atributos `target` y `rel` de los enlaces procesados.

## [1.3.2] - 2026-07-22

### Corregido

- Desplazamiento involuntario del cursor al inicio del editor durante el autoguardado, causado por la recarga completa de la lista de archivos desde IndexedDB en cada ciclo de persistencia.
- Perdida de contenido escrito en los ultimos 400ms del debounce al cambiar de archivo, archivar o eliminar, por falta de flush del buffer pendiente.

### Modificado

- Refactorizacion del servicio `EditorStateService` para implementar actualizaciones optimistas del signal `files` sin recargar desde la base de datos en cada autoguardado.
- Implementacion de una cola de escritura serializada (`saveQueue`) en IndexedDB para evitar condiciones de carrera entre el debounce y las acciones del usuario.
- El componente `CodeEditorComponent` ahora recibe el `fileId` como input para detectar cambios de archivo y reinicializar el estado del editor solo cuando corresponde.
- El metodo `loadFiles()` ya no activa el indicador de carga (`isLoading`) para evitar parpadeos innecesarios en el sidebar.

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
