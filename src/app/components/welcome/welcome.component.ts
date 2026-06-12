import { Component, inject } from '@angular/core';
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

  protected createFile(): void {
    void this.editorState.createFile();
  }
}
