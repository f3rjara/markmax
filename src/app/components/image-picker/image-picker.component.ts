import {
  Component,
  ElementRef,
  output,
  signal,
  viewChild,
  afterNextRender,
  inject,
  DestroyRef,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { ImageAlignment } from '../../core/models/markdown-image.model';
import { ImagePickResult } from '../../shared/models/image-picker.model';

@Component({
  selector: 'app-image-picker',
  imports: [IconComponent],
  host: {
    class: 'image-picker-host',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'image-picker-title',
    '(keydown.escape)': 'cancelRequest.emit()',
  },
  styleUrls: ['./image-picker.component.css'],
  templateUrl: './image-picker.component.html',
})
export class ImagePickerComponent {
  readonly imageInsert = output<ImagePickResult>();
  readonly cancelRequest = output<void>();

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly altText = signal('');
  protected readonly alignment = signal<ImageAlignment>(null);

  protected readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInputEl');

  private readonly insertBtnRef = viewChild<ElementRef<HTMLButtonElement>>('insertBtn');
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      this.insertBtnRef()?.nativeElement.focus();
    });
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedFile.set(file);
    this.altText.set(file.name.replace(/\.[^.]+$/, ''));

    const url = URL.createObjectURL(file);
    this.previewUrl.set(url);
    this.destroyRef.onDestroy(() => URL.revokeObjectURL(url));
  }

  protected handleInsert(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.imageInsert.emit({
      blob: file,
      mimeType: file.type,
      name: file.name,
      alt: this.altText(),
      alignment: this.alignment(),
    });
  }
}
