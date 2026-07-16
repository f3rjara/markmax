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
  styleUrls: ['./confirm-dialog.component.css'],
  template: `
    <div class="dialog-backdrop" (click)="cancel.emit()" aria-hidden="true"></div>

    <div class="dialog-panel" [attr.aria-labelledby]="'confirm-title-' + dialogId()">
      <div class="dialog-icon-wrap">
        <app-icon name="trash-2" [size]="20" />
      </div>

      <p class="dialog-title" [id]="'confirm-title-' + dialogId()">Eliminar definitivamente</p>

      <p class="dialog-body">
        <strong class="text-mm-text">{{ fileName() }}</strong> sera eliminado permanentemente y no
        podra ser recuperado.
      </p>

      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn--cancel"
          id="confirm-cancel-btn"
          (click)="cancel.emit()"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn--danger"
          id="confirm-delete-btn"
          (click)="confirm.emit()"
        >
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
