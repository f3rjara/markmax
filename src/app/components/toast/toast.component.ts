import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'app-toast',
  imports: [IconComponent],
  host: {
    class: 'fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none',
    'aria-live': 'polite',
    'aria-atomic': 'false',
  },
  styleUrl: './toast.component.css',
  template: `
    @for (toast of toastService.toasts(); track toast.id) {
      <div
        role="status"
        class="toast"
        [class]="'toast toast--' + toast.type"
        [attr.aria-label]="toast.message"
      >
        <app-icon [name]="iconFor(toast.type)" [size]="14" />
        <span class="flex-1">{{ toast.message }}</span>
        <button
          type="button"
          class="toast-dismiss"
          aria-label="Cerrar notificacion"
          (click)="toastService.dismiss(toast.id)"
        >
          <app-icon name="x" [size]="12" />
        </button>
      </div>
    }
  `,
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);

  protected iconFor(type: string): IconName {
    const icons: Record<string, IconName> = {
      success: 'check-circle',
      info: 'info',
      warning: 'alert-triangle',
      error: 'alert-circle',
    };
    return icons[type] ?? 'info';
  }
}
