import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UiStateService {
  readonly sidebarOpen = signal(true);
  readonly toolsMenuOpen = signal(false);

  readonly renameRequest$ = new Subject<void>();
  readonly importRequest$ = new Subject<void>();
  readonly toolsMenuRequest$ = new Subject<void>();

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  toggleToolsMenu(): void {
    this.toolsMenuOpen.update((v) => !v);
  }

  closeToolsMenu(): void {
    this.toolsMenuOpen.set(false);
  }
}
