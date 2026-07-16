import { Component, ElementRef, output, signal, viewChild, afterNextRender } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { ImageAlignment } from '../../core/models/markdown-image.model';

export interface ImageUrlResult {
  url: string;
  alt: string;
  alignment: ImageAlignment;
}

@Component({
  selector: 'app-image-url-picker',
  imports: [IconComponent],
  host: {
    class: 'image-url-picker-host',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'image-url-picker-title',
    '(keydown.escape)': 'cancelRequest.emit()',
  },
  styleUrl: './image-url-picker.component.css',
  templateUrl: './image-url-picker.component.html',
})
export class ImageUrlPickerComponent {
  readonly imageUrlInsert = output<ImageUrlResult>();
  readonly cancelRequest = output<void>();

  protected readonly imageUrl = signal('');
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly altText = signal('');
  protected readonly alignment = signal<ImageAlignment>(null);

  private readonly insertBtnRef = viewChild<ElementRef<HTMLButtonElement>>('insertBtn');

  constructor() {
    afterNextRender(() => {
      this.insertBtnRef()?.nativeElement.focus();
    });
  }

  protected onUrlChange(url: string): void {
    this.imageUrl.set(url);
    if (
      url &&
      (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))
    ) {
      this.previewUrl.set(url);
    } else {
      this.previewUrl.set(null);
    }
  }

  protected handleInsert(): void {
    const url = this.imageUrl().trim();
    if (!url) return;

    this.imageUrlInsert.emit({
      url,
      alt: this.altText(),
      alignment: this.alignment(),
    });
  }
}
