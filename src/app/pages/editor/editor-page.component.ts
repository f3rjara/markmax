import { Component, inject } from '@angular/core';
import { EditorStateService } from '../../core/services/editor-state.service';
import { ViewMode } from '../../core/models/view-mode.enum';
import { CodeEditorComponent } from '../../components/code-editor/code-editor.component';
import { MarkdownPreviewComponent } from '../../components/markdown-preview/markdown-preview.component';

@Component({
  selector: 'app-editor-page',
  imports: [CodeEditorComponent, MarkdownPreviewComponent],
  templateUrl: './editor-page.component.html',
})
export class EditorPageComponent {
  protected readonly editorState = inject(EditorStateService);
  protected readonly ViewMode = ViewMode;

  protected isPreviewMode() {
    return this.editorState.viewMode() === ViewMode.Preview;
  }

  protected onContentChange(content: string): void {
    this.editorState.updateContent(content);
  }
}
