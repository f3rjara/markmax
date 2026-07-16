import { ToastType } from '../types/toast.type';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
