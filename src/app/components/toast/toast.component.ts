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
  styles: `
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 240px;
      max-width: 340px;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
      border: 1px solid transparent;
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.4),
        0 2px 6px rgba(0, 0, 0, 0.25);
      pointer-events: auto;
      animation: toast-in 0.2s ease-out;
      backdrop-filter: blur(10px);
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(8px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .toast--success {
      background: rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.25);
      color: #6ee7b7;
    }

    .toast--info {
      background: rgba(139, 92, 246, 0.12);
      border-color: rgba(139, 92, 246, 0.25);
      color: #c4b5fd;
    }

    .toast--warning {
      background: rgba(245, 158, 11, 0.12);
      border-color: rgba(245, 158, 11, 0.25);
      color: #fcd34d;
    }

    .toast--error {
      background: rgba(239, 68, 68, 0.12);
      border-color: rgba(239, 68, 68, 0.25);
      color: #fca5a5;
    }

    .toast-dismiss {
      margin-left: auto;
      flex-shrink: 0;
      background: transparent;
      border: none;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.15s;
      padding: 2px;
      border-radius: 4px;
      color: inherit;
      line-height: 0;
    }

    .toast-dismiss:hover {
      opacity: 1;
    }

    .toast-dismiss:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
  `,
  template: `
    @for (toast of toastService.toasts(); track toast.id) {
      <div
        role="status"
        class="toast"
        [class]="'toast toast--' + toast.type"
        [attr.aria-label]="toast.message">
        <app-icon [name]="iconFor(toast.type)" [size]="14" />
        <span class="flex-1">{{ toast.message }}</span>
        <button
          type="button"
          class="toast-dismiss"
          aria-label="Cerrar notificacion"
          (click)="toastService.dismiss(toast.id)">
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
