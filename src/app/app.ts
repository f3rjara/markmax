import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TrashCleanupService } from './core/services/trash-cleanup.service';
import { EditorStateService } from './core/services/editor-state.service';
import { ToastComponent } from './components/toast/toast.component';
import { UpdateBannerComponent } from './components/update-banner/update-banner.component';
import { UpdateService } from './core/services/update.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, UpdateBannerComponent],
  template: `
    <app-update-banner />
    <router-outlet />
    <app-toast />
  `,
})
export class App implements OnInit, OnDestroy {
  private readonly trashCleanup = inject(TrashCleanupService);
  private readonly editorState = inject(EditorStateService);
  private readonly updateService = inject(UpdateService); // Inicializa la escucha de actualizaciones

  ngOnInit(): void {
    this.trashCleanup.start((count) => {
      // Cuando la purga automatica elimina archivos, recargamos la lista de eliminados
      void this.editorState.reloadDeleted();
    });
  }

  ngOnDestroy(): void {
    this.trashCleanup.stop();
  }
}
