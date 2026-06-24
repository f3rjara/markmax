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

export interface ImagePickResult {
  blob: Blob;
  mimeType: string;
  name: string;
  alt: string;
  alignment: ImageAlignment;
}

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
  styles: `
    :host.image-picker-host {
      position: fixed;
      inset: 0;
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ip-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(4px);
      animation: ip-backdrop-in 0.15s ease-out;
    }

    @keyframes ip-backdrop-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .ip-panel {
      position: relative;
      z-index: 1;
      width: 480px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 48px);
      display: flex;
      flex-direction: column;
      background: var(--color-mm-sidebar);
      border: 1px solid var(--color-mm-border);
      border-radius: 14px;
      padding: 24px;
      box-shadow: 0 24px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(139,92,246,.08);
      animation: ip-panel-in 0.18s ease-out;
    }

    @keyframes ip-panel-in {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .ip-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-mm-text);
      margin: 0 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .ip-title-icon {
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

    .ip-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 32px 16px;
      border: 1px dashed var(--color-mm-border);
      border-radius: 10px;
      background: var(--color-mm-surface);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      flex-shrink: 0;
    }

    .ip-zone:hover {
      border-color: var(--color-mm-accent);
      background: rgba(139,92,246,.06);
    }

    .ip-zone:focus-visible {
      outline: 2px solid var(--color-mm-accent);
      outline-offset: 2px;
    }

    .ip-zone-icon {
      color: var(--color-mm-text-secondary);
    }

    .ip-zone-text {
      font-size: 13px;
      color: var(--color-mm-text-secondary);
      text-align: center;
    }

    .ip-zone-text strong {
      color: var(--color-mm-accent);
    }

    .ip-preview-wrap {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex-shrink: 0;
    }

    .ip-preview {
      width: 100%;
      max-height: 200px;
      border-radius: 8px;
      border: 1px solid var(--color-mm-border);
      background: var(--color-mm-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .ip-preview img {
      max-width: 100%;
      max-height: 200px;
      object-fit: contain;
      display: block;
    }

    .ip-filename {
      font-size: 12px;
      color: var(--color-mm-text-secondary);
      text-align: center;
      word-break: break-all;
    }

    .ip-fields {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex-shrink: 0;
    }

    .ip-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .ip-field-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-mm-text-secondary);
    }

    .ip-field-input {
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

    .ip-field-input:focus {
      border-color: var(--color-mm-accent);
      box-shadow: 0 0 0 2px rgba(139,92,246,.15);
    }

    .ip-field-input::placeholder {
      color: var(--color-mm-text-secondary);
    }

    .ip-align-group {
      display: flex;
      gap: 4px;
      background: var(--color-mm-surface);
      border: 1px solid var(--color-mm-border);
      border-radius: 8px;
      padding: 3px;
      align-self: flex-start;
    }

    .ip-align-btn {
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

    .ip-align-btn:hover { background: var(--color-mm-surface-hover); color: var(--color-mm-text); }

    .ip-align-btn--active {
      background: rgba(139,92,246,.18);
      border-color: rgba(139,92,246,.35);
      color: var(--color-mm-accent);
    }

    .ip-align-btn:focus-visible { outline: 2px solid var(--color-mm-accent); outline-offset: 1px; }

    .ip-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
      flex-shrink: 0;
    }

    .ip-btn {
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }

    .ip-btn:focus-visible { outline: 2px solid var(--color-mm-accent); outline-offset: 2px; }

    .ip-btn--cancel {
      background: transparent;
      border-color: var(--color-mm-border);
      color: var(--color-mm-text-secondary);
    }

    .ip-btn--cancel:hover { background: var(--color-mm-surface-hover); color: var(--color-mm-text); }

    .ip-btn--insert {
      background: var(--color-mm-accent);
      color: #fff;
    }

    .ip-btn--insert:hover { background: var(--color-mm-accent-hover); }

    .ip-btn--insert:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `,
  template: `
    <div class="ip-backdrop" (click)="cancelRequest.emit()" aria-hidden="true"></div>

    <div class="ip-panel">
      <h2 class="ip-title" id="image-picker-title">
        <span class="ip-title-icon" aria-hidden="true">
          <app-icon name="image" [size]="16" />
        </span>
        Insertar imagen
      </h2>

      @if (!selectedFile()) {
        <!-- Zona de selección -->
        <div
          class="ip-zone"
          role="button"
          tabindex="0"
          aria-label="Seleccionar imagen"
          (click)="fileInput()?.nativeElement?.click()"
          (keydown.enter)="fileInput()?.nativeElement?.click()">
          <app-icon name="image" [size]="32" class="ip-zone-icon" />
          <p class="ip-zone-text">
            Haz clic para <strong>seleccionar una imagen</strong>
          </p>
        </div>
      } @else {
        <!-- Preview -->
        <div class="ip-preview-wrap">
          <div class="ip-preview">
            <img [src]="previewUrl()" [alt]="altText() || 'Vista previa'" />
          </div>
          <p class="ip-filename">{{ selectedFile()?.name }}</p>
        </div>

        <!-- Campos -->
        <div class="ip-fields">
          <div class="ip-field">
            <label class="ip-field-label" for="ip-alt">Texto alternativo</label>
            <input
              id="ip-alt"
              class="ip-field-input"
              type="text"
              placeholder="Descripción de la imagen"
              [value]="altText()"
              (input)="altText.set($any($event.target).value)" />
          </div>

          <div class="ip-field">
            <span class="ip-field-label">Alineación</span>
            <div class="ip-align-group" role="group" aria-label="Alineación de la imagen">
              <button
                type="button"
                class="ip-align-btn"
                [class.ip-align-btn--active]="alignment() === null"
                aria-label="Sin alineación"
                [attr.aria-pressed]="alignment() === null"
                (click)="alignment.set(null)">
                <app-icon name="minus" [size]="14" />
              </button>
              <button
                type="button"
                class="ip-align-btn"
                [class.ip-align-btn--active]="alignment() === 'left'"
                aria-label="Alinear a la izquierda"
                [attr.aria-pressed]="alignment() === 'left'"
                (click)="alignment.set('left')">
                <app-icon name="align-left" [size]="14" />
              </button>
              <button
                type="button"
                class="ip-align-btn"
                [class.ip-align-btn--active]="alignment() === 'center'"
                aria-label="Centrar"
                [attr.aria-pressed]="alignment() === 'center'"
                (click)="alignment.set('center')">
                <app-icon name="align-center" [size]="14" />
              </button>
              <button
                type="button"
                class="ip-align-btn"
                [class.ip-align-btn--active]="alignment() === 'right'"
                aria-label="Alinear a la derecha"
                [attr.aria-pressed]="alignment() === 'right'"
                (click)="alignment.set('right')">
                <app-icon name="align-right" [size]="14" />
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Acciones -->
      <div class="ip-actions">
        <button type="button" class="ip-btn ip-btn--cancel" (click)="cancelRequest.emit()">
          Cancelar
        </button>
        @if (selectedFile()) {
          <button #insertBtn type="button" class="ip-btn ip-btn--insert" (click)="handleInsert()">
            Insertar imagen
          </button>
        }
      </div>

      <!-- File input oculto -->
      <input
        #fileInputEl
        type="file"
        accept="image/*"
        style="display:none"
        aria-hidden="true"
        (change)="onFileSelected($any($event))" />
    </div>
  `,
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
