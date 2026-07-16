import { Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-export-dialog',
  imports: [IconComponent],
  host: {
    class: 'fixed inset-0 z-[300] flex items-center justify-center',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'export-dialog-title',
    '(keydown.escape)': 'cancel.emit()',
  },
  styleUrls: ['./export-dialog.component.css'],
  template: `
    <div class="ed-backdrop" (click)="cancel.emit()" aria-hidden="true"></div>

    <div class="ed-panel">
      <div class="ed-icon-wrap">
        <app-icon name="download" [size]="20" />
      </div>

      <p class="ed-title" id="export-dialog-title">Exportar "{{ fileName() }}"</p>

      <p class="ed-body">
        El archivo contiene <strong>{{ imageCount() }} imagen(es)</strong> local(es). ¿Cómo deseas
        exportarlas?
      </p>

      <div class="ed-options">
        <button type="button" class="ed-option" (click)="base64Export.emit()">
          <span class="ed-option-icon">
            <app-icon name="file-text" [size]="16" />
          </span>
          <span class="ed-option-content">
            <span class="ed-option-title">Archivo único (.md)</span>
            <span class="ed-option-desc"
              >Las imágenes se incrustan en base64. El archivo es autocontenido pero más
              pesado.</span
            >
          </span>
        </button>

        <button type="button" class="ed-option" (click)="zipExport.emit()">
          <span class="ed-option-icon">
            <app-icon name="archive" [size]="16" />
          </span>
          <span class="ed-option-content">
            <span class="ed-option-title">Archivo ZIP (.zip)</span>
            <span class="ed-option-desc"
              >Incluye el .md + carpeta images/ con las imágenes separadas. Compatible con cualquier
              editor.</span
            >
          </span>
        </button>
      </div>

      <div class="ed-actions">
        <button type="button" class="ed-btn" (click)="cancel.emit()">Cancelar</button>
      </div>
    </div>
  `,
})
export class ExportDialogComponent {
  readonly fileName = input.required<string>();
  readonly imageCount = input.required<number>();
  readonly base64Export = output<void>();
  readonly zipExport = output<void>();
  readonly cancel = output<void>();
}
