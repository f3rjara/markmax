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
  styles: `
    .ed-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      animation: ed-backdrop-in 0.15s ease-out;
    }

    @keyframes ed-backdrop-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .ed-panel {
      position: relative;
      z-index: 1;
      width: 400px;
      background: var(--color-mm-sidebar);
      border: 1px solid var(--color-mm-border);
      border-radius: 14px;
      padding: 24px;
      box-shadow: 0 24px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(139,92,246,.08);
      animation: ed-panel-in 0.18s ease-out;
    }

    @keyframes ed-panel-in {
      from { opacity: 0; transform: scale(0.95) translateY(8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .ed-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(139,92,246,.12);
      border: 1px solid rgba(139,92,246,.2);
      color: var(--color-mm-accent);
      margin-bottom: 16px;
    }

    .ed-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-mm-text);
      margin-bottom: 8px;
    }

    .ed-body {
      font-size: 13px;
      color: var(--color-mm-text-secondary);
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .ed-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
    }

    .ed-option {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid var(--color-mm-border);
      background: var(--color-mm-surface);
      cursor: pointer;
      transition: border-color 0.12s, background 0.12s;
      text-align: left;
      width: 100%;
      font-family: inherit;
      color: var(--color-mm-text);
    }

    .ed-option:hover {
      border-color: var(--color-mm-accent);
      background: rgba(139,92,246,.06);
    }

    .ed-option:focus-visible {
      outline: 2px solid var(--color-mm-accent);
      outline-offset: 2px;
    }

    .ed-option-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(139,92,246,.1);
      color: var(--color-mm-accent);
      flex-shrink: 0;
      margin-top: 1px;
    }

    .ed-option-content {
      flex: 1;
    }

    .ed-option-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .ed-option-desc {
      font-size: 11px;
      color: var(--color-mm-text-secondary);
      line-height: 1.4;
    }

    .ed-actions {
      display: flex;
      justify-content: flex-end;
    }

    .ed-btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      background: transparent;
      border-color: var(--color-mm-border);
      color: var(--color-mm-text-secondary);
      transition: background 0.15s, color 0.15s;
    }

    .ed-btn:hover {
      background: var(--color-mm-surface-hover);
      color: var(--color-mm-text);
    }

    .ed-btn:focus-visible {
      outline: 2px solid var(--color-mm-accent);
      outline-offset: 2px;
    }
  `,
  template: `
    <div class="ed-backdrop" (click)="cancel.emit()" aria-hidden="true"></div>

    <div class="ed-panel">
      <div class="ed-icon-wrap">
        <app-icon name="download" [size]="20" />
      </div>

      <p class="ed-title" id="export-dialog-title">Exportar "{{ fileName() }}"</p>

      <p class="ed-body">
        El archivo contiene <strong>{{ imageCount() }} imagen(es)</strong> local(es).
        ¿Cómo deseas exportarlas?
      </p>

      <div class="ed-options">
        <button type="button" class="ed-option" (click)="base64Export.emit()">
          <span class="ed-option-icon">
            <app-icon name="file-text" [size]="16" />
          </span>
          <span class="ed-option-content">
            <span class="ed-option-title">Archivo único (.md)</span>
            <span class="ed-option-desc">Las imágenes se incrustan en base64. El archivo es autocontenido pero más pesado.</span>
          </span>
        </button>

        <button type="button" class="ed-option" (click)="zipExport.emit()">
          <span class="ed-option-icon">
            <app-icon name="archive" [size]="16" />
          </span>
          <span class="ed-option-content">
            <span class="ed-option-title">Archivo ZIP (.zip)</span>
            <span class="ed-option-desc">Incluye el .md + carpeta images/ con las imágenes separadas. Compatible con cualquier editor.</span>
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
