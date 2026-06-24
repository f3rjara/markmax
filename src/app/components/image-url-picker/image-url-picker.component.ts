import {
  Component,
  ElementRef,
  output,
  signal,
  viewChild,
  afterNextRender,
} from '@angular/core';
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
  styles: `
    :host.image-url-picker-host {
      position: fixed;
      inset: 0;
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .iup-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(4px);
      animation: iup-backdrop-in 0.15s ease-out;
    }

    @keyframes iup-backdrop-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .iup-panel {
      position: relative;
      z-index: 1;
      width: 460px;
      max-width: calc(100vw - 32px);
      display: flex;
      flex-direction: column;
      background: var(--color-mm-sidebar);
      border: 1px solid var(--color-mm-border);
      border-radius: 14px;
      padding: 24px;
      box-shadow: 0 24px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(139,92,246,.08);
      animation: iup-panel-in 0.18s ease-out;
    }

    @keyframes iup-panel-in {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .iup-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-mm-text);
      margin: 0 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .iup-title-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(139,92,246,.15);
      border: 1px solid rgba(139,92,246,.2);
      color: var(--color-mm-accent);
      flex-shrink: 0;
    }

    .iup-fields {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .iup-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .iup-field-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-mm-text-secondary);
    }

    .iup-field-input {
      width: 100%;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--color-mm-border);
      background: var(--color-mm-surface);
      color: var(--color-mm-text);
      font-size: 13px;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.12s;
    }

    .iup-field-input:focus {
      border-color: var(--color-mm-accent);
      box-shadow: 0 0 0 2px rgba(139,92,246,.15);
    }

    .iup-field-input::placeholder {
      color: var(--color-mm-text-secondary);
    }

    .iup-preview {
      width: 100%;
      max-height: 180px;
      border-radius: 8px;
      border: 1px solid var(--color-mm-border);
      background: var(--color-mm-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      min-height: 60px;
    }

    .iup-preview img {
      max-width: 100%;
      max-height: 180px;
      object-fit: contain;
      display: block;
    }

    .iup-preview--empty {
      color: var(--color-mm-text-secondary);
      font-size: 12px;
    }

    .iup-align-group {
      display: flex;
      gap: 4px;
      background: var(--color-mm-surface);
      border: 1px solid var(--color-mm-border);
      border-radius: 8px;
      padding: 3px;
      align-self: flex-start;
    }

    .iup-align-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 6px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--color-mm-text-secondary);
      cursor: pointer;
      transition: background 0.1s, color 0.1s, border-color 0.1s;
      flex-shrink: 0;
    }

    .iup-align-btn:hover { background: var(--color-mm-surface-hover); color: var(--color-mm-text); }

    .iup-align-btn--active {
      background: rgba(139,92,246,.18);
      border-color: rgba(139,92,246,.35);
      color: var(--color-mm-accent);
    }

    .iup-align-btn:focus-visible { outline: 2px solid var(--color-mm-accent); outline-offset: 1px; }

    .iup-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
      flex-shrink: 0;
    }

    .iup-btn {
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }

    .iup-btn:focus-visible { outline: 2px solid var(--color-mm-accent); outline-offset: 2px; }

    .iup-btn--cancel {
      background: transparent;
      border-color: var(--color-mm-border);
      color: var(--color-mm-text-secondary);
    }

    .iup-btn--cancel:hover { background: var(--color-mm-surface-hover); color: var(--color-mm-text); }

    .iup-btn--insert {
      background: var(--color-mm-accent);
      color: #fff;
    }

    .iup-btn--insert:hover { background: var(--color-mm-accent-hover); }

    .iup-btn--insert:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `,
  template: `
    <div class="iup-backdrop" (click)="cancelRequest.emit()" aria-hidden="true"></div>

    <div class="iup-panel">
      <h2 class="iup-title" id="image-url-picker-title">
        <span class="iup-title-icon" aria-hidden="true">
          <app-icon name="link" [size]="16" />
        </span>
        Insertar imagen desde URL
      </h2>

      <div class="iup-fields">
        <!-- URL -->
        <div class="iup-field">
          <label class="iup-field-label" for="iup-url">URL de la imagen</label>
          <input
            id="iup-url"
            class="iup-field-input"
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            [value]="imageUrl()"
            (input)="onUrlChange($any($event).target.value)"
            (keydown.enter)="handleInsert()" />
        </div>

        <!-- Preview -->
        @if (previewUrl()) {
          <div class="iup-preview">
            <img [src]="previewUrl()" alt="Vista previa" />
          </div>
        } @else {
          <div class="iup-preview iup-preview--empty">
            @if (imageUrl()) {
              <span>Vista previa no disponible</span>
            }
          </div>
        }

        <!-- Texto alternativo -->
        <div class="iup-field">
          <label class="iup-field-label" for="iup-alt">Texto alternativo</label>
          <input
            id="iup-alt"
            class="iup-field-input"
            type="text"
            placeholder="Descripción de la imagen"
            [value]="altText()"
            (input)="altText.set($any($event).target.value)" />
        </div>

        <!-- Alineación -->
        <div class="iup-field">
          <span class="iup-field-label">Alineación</span>
          <div class="iup-align-group" role="group" aria-label="Alineación de la imagen">
            <button type="button" class="iup-align-btn"
              [class.iup-align-btn--active]="alignment() === null"
              aria-label="Sin alineación"
              [attr.aria-pressed]="alignment() === null"
              (click)="alignment.set(null)">
              <app-icon name="minus" [size]="14" />
            </button>
            <button type="button" class="iup-align-btn"
              [class.iup-align-btn--active]="alignment() === 'left'"
              aria-label="Alinear a la izquierda"
              [attr.aria-pressed]="alignment() === 'left'"
              (click)="alignment.set('left')">
              <app-icon name="align-left" [size]="14" />
            </button>
            <button type="button" class="iup-align-btn"
              [class.iup-align-btn--active]="alignment() === 'center'"
              aria-label="Centrar"
              [attr.aria-pressed]="alignment() === 'center'"
              (click)="alignment.set('center')">
              <app-icon name="align-center" [size]="14" />
            </button>
            <button type="button" class="iup-align-btn"
              [class.iup-align-btn--active]="alignment() === 'right'"
              aria-label="Alinear a la derecha"
              [attr.aria-pressed]="alignment() === 'right'"
              (click)="alignment.set('right')">
              <app-icon name="align-right" [size]="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Acciones -->
      <div class="iup-actions">
        <button type="button" class="iup-btn iup-btn--cancel" (click)="cancelRequest.emit()">
          Cancelar
        </button>
        <button #insertBtn type="button" class="iup-btn iup-btn--insert"
          [disabled]="!imageUrl()" (click)="handleInsert()">
          Insertar imagen
        </button>
      </div>
    </div>
  `,
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
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))) {
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
