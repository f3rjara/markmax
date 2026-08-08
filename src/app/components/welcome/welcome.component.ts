import { Component, computed, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { EditorStateService } from '../../core/services/editor-state.service';
import { IconComponent } from '../icon/icon.component';

/**
 * Pantalla de bienvenida mostrada cuando no hay ningún archivo activo.
 */
@Component({
  selector: 'app-welcome',
  imports: [IconComponent],
  host: {
    class: 'flex h-full',
  },
  templateUrl: './welcome.component.html',
})
export class WelcomeComponent {
  private readonly editorState = inject(EditorStateService);
  private readonly doc = inject(DOCUMENT);

  protected readonly isMac = computed(() =>
    /Mac|iPhone|iPod|iPad/.test(this.doc.defaultView?.navigator.userAgent ?? '')
  );

  protected createFile(): void {
    void this.editorState.createFile();
  }
}
