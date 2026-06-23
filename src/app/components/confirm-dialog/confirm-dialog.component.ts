import { Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/**
 * Dialogo modal de confirmacion para acciones destructivas.
 * Se muestra cuando el usuario intenta eliminar un archivo definitivamente.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [IconComponent],
  host: {
    class: 'fixed inset-0 z-[300] flex items-center justify-center',
    role: 'dialog',
    'aria-modal': 'true',
  },
  styles: `
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      animation: backdrop-in 0.15s ease-out;
    }

    @keyframes backdrop-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .dialog-panel {
      position: relative;
      z-index: 1;
      width: 360px;
      background: var(--color-mm-sidebar);
      border: 1px solid var(--color-mm-border);
      border-radius: 14px;
      padding: 24px;
      box-shadow:
        0 24px 60px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(139, 92, 246, 0.08);
      animation: dialog-in 0.18s ease-out;
    }

    @keyframes dialog-in {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(8px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .dialog-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #ef4444;
      margin-bottom: 16px;
    }

    .dialog-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-mm-text);
      margin-bottom: 8px;
    }

    .dialog-body {
      font-size: 13px;
      color: var(--color-mm-text-secondary);
      line-height: 1.5;
      margin-bottom: 24px;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }

    .btn:focus-visible {
      outline: 2px solid var(--color-mm-accent);
      outline-offset: 2px;
    }

    .btn--cancel {
      background: transparent;
      border-color: var(--color-mm-border);
      color: var(--color-mm-text-secondary);
    }

    .btn--cancel:hover {
      background: var(--color-mm-surface-hover);
      color: var(--color-mm-text);
    }

    .btn--danger {
      background: #ef4444;
      color: #fff;
    }

    .btn--danger:hover {
      background: #dc2626;
    }
  `,
  template: `
    <div class="dialog-backdrop" (click)="cancel.emit()" aria-hidden="true"></div>

    <div class="dialog-panel" [attr.aria-labelledby]="'confirm-title-' + dialogId()">
      <div class="dialog-icon-wrap">
        <app-icon name="trash-2" [size]="20" />
      </div>

      <p class="dialog-title" [id]="'confirm-title-' + dialogId()">
        Eliminar definitivamente
      </p>

      <p class="dialog-body">
        <strong class="text-mm-text">{{ fileName() }}</strong> sera eliminado permanentemente
        y no podra ser recuperado.
      </p>

      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn--cancel"
          id="confirm-cancel-btn"
          (click)="cancel.emit()">
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn--danger"
          id="confirm-delete-btn"
          (click)="confirm.emit()">
          Eliminar definitivamente
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly dialogId = input.required<string>();
  readonly fileName = input.required<string>();
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
