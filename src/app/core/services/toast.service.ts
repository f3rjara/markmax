import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

/**
 * Servicio de notificaciones tipo toast.
 * Expone un signal reactivo con la lista de toasts activos.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private static readonly DURATION_MS = 3000;

  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'info'): void {
    const id = crypto.randomUUID();
    this.toasts.update((list) => [...list, { id, message, type }]);

    setTimeout(() => this.dismiss(id), ToastService.DURATION_MS);
  }

  dismiss(id: string): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
