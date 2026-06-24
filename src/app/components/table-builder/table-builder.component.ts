import {
  Component,
  computed,
  ElementRef,
  output,
  signal,
  viewChild,
  afterNextRender,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

export type ColumnAlignment = 'left' | 'center' | 'right';

/** Escapa pipes para que no rompan el Markdown de tabla */
function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/** Genera el Markdown de una tabla con cabeceras y contenido reales. */
function buildTableMarkdown(
  headers: string[],
  cells: string[][],
  alignments: ColumnAlignment[],
): string {
  const cols = headers.length;

  const headerRow = `| ${headers.map((h, i) => escapeCell(h) || `Col ${i + 1}`).join(' | ')} |`;

  const separator = alignments.slice(0, cols).map((a) => {
    if (a === 'center') return ':---:';
    if (a === 'right') return '---:';
    return ':---';
  });
  const separatorRow = `| ${separator.join(' | ')} |`;

  const dataRows = cells.map(
    (row) => `| ${row.map((c) => escapeCell(c) || ' ').join(' | ')} |`,
  );

  return [headerRow, separatorRow, ...dataRows].join('\n');
}

@Component({
  selector: 'app-table-builder',
  imports: [IconComponent, FormsModule],
  host: {
    class: 'table-builder-host',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'table-builder-title',
    '(keydown.escape)': 'cancelRequest.emit()',
  },
  styles: `
    :host.table-builder-host {
      position: fixed;
      inset: 0;
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tb-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(4px);
      animation: tb-backdrop-in 0.15s ease-out;
    }

    @keyframes tb-backdrop-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .tb-panel {
      position: relative;
      z-index: 1;
      width: 640px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 48px);
      display: flex;
      flex-direction: column;
      background: var(--color-mm-sidebar);
      border: 1px solid var(--color-mm-border);
      border-radius: 14px;
      padding: 24px;
      box-shadow: 0 24px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(139,92,246,.08);
      animation: tb-panel-in 0.18s ease-out;
    }

    @keyframes tb-panel-in {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .tb-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-mm-text);
      margin: 0 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .tb-title-icon {
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

    /* Barra de controles superior */
    .tb-toolbar {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .tb-control-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tb-control-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-mm-text-secondary);
    }

    .tb-stepper {
      display: flex;
      align-items: center;
      background: var(--color-mm-surface);
      border: 1px solid var(--color-mm-border);
      border-radius: 8px;
      overflow: hidden;
    }

    .tb-stepper-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      background: transparent;
      border: none;
      color: var(--color-mm-text-secondary);
      cursor: pointer;
      transition: background 0.12s, color 0.12s;
      flex-shrink: 0;
    }

    .tb-stepper-btn:hover:not(:disabled) {
      background: var(--color-mm-surface-hover);
      color: var(--color-mm-text);
    }

    .tb-stepper-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    .tb-stepper-btn:focus-visible {
      outline: 2px solid var(--color-mm-accent);
      outline-offset: -2px;
    }

    .tb-stepper-value {
      min-width: 28px;
      text-align: center;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-mm-text);
      user-select: none;
    }

    /* Alineacion global */
    .tb-global-align {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-left: auto;
    }

    .tb-align-group {
      display: flex;
      gap: 2px;
      background: var(--color-mm-surface);
      border: 1px solid var(--color-mm-border);
      border-radius: 8px;
      padding: 2px;
    }

    .tb-align-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 6px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--color-mm-text-secondary);
      cursor: pointer;
      transition: background 0.1s, color 0.1s, border-color 0.1s;
      flex-shrink: 0;
    }

    .tb-align-btn:hover { background: var(--color-mm-surface-hover); color: var(--color-mm-text); }

    .tb-align-btn--active {
      background: rgba(139,92,246,.18);
      border-color: rgba(139,92,246,.35);
      color: var(--color-mm-accent);
    }

    .tb-align-btn:focus-visible { outline: 2px solid var(--color-mm-accent); outline-offset: 1px; }

    /* Area de scroll de la tabla */
    .tb-scroll {
      flex: 1;
      overflow: auto;
      border: 1px solid var(--color-mm-border);
      border-radius: 8px;
      background: var(--color-mm-surface);
      margin-bottom: 16px;
      scrollbar-width: thin;
      scrollbar-color: rgba(139,92,246,.25) transparent;
    }

    /* Tabla editable */
    .tb-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      min-width: max-content;
    }

    .tb-table th,
    .tb-table td {
      border: 1px solid var(--color-mm-border);
      padding: 0;
      position: relative;
    }

    /* Fila de cabecera: fondo diferenciado */
    .tb-table thead tr:first-child th {
      background: rgba(139,92,246,.08);
    }

    /* Fila de alineacion */
    .tb-table thead tr:last-child th {
      background: rgba(0,0,0,.15);
      padding: 3px 4px;
    }

    /* Inputs de cabecera */
    .tb-cell-input {
      width: 100%;
      min-width: 80px;
      padding: 6px 8px;
      background: transparent;
      border: none;
      color: var(--color-mm-text);
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      text-align: inherit;
      outline: none;
      box-sizing: border-box;
    }

    .tb-cell-input::placeholder { color: var(--color-mm-text-secondary); font-weight: 400; font-style: italic; }

    .tb-cell-input:focus {
      box-shadow: inset 0 0 0 2px var(--color-mm-accent);
      border-radius: 2px;
    }

    /* Inputs de celda de datos */
    .tb-data-input {
      width: 100%;
      min-width: 80px;
      padding: 5px 8px;
      background: transparent;
      border: none;
      color: var(--color-mm-text);
      font-size: 12px;
      font-family: inherit;
      text-align: inherit;
      outline: none;
      box-sizing: border-box;
    }

    .tb-data-input::placeholder { color: rgba(255,255,255,.2); }

    .tb-data-input:focus {
      box-shadow: inset 0 0 0 2px rgba(139,92,246,.4);
      border-radius: 2px;
    }

    /* Botones de alineacion por columna (fila de controles) */
    .tb-col-align-btns {
      display: flex;
      gap: 1px;
      justify-content: center;
    }

    .tb-col-align-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--color-mm-text-secondary);
      cursor: pointer;
      transition: background 0.1s, color 0.1s, border-color 0.1s;
      flex-shrink: 0;
    }

    .tb-col-align-btn:hover { background: rgba(255,255,255,.07); color: var(--color-mm-text); }

    .tb-col-align-btn--active {
      background: rgba(139,92,246,.25);
      border-color: rgba(139,92,246,.4);
      color: var(--color-mm-accent);
    }

    .tb-col-align-btn:focus-visible { outline: 2px solid var(--color-mm-accent); outline-offset: 1px; }

    /* Acciones */
    .tb-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      flex-shrink: 0;
    }

    .tb-btn {
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }

    .tb-btn:focus-visible { outline: 2px solid var(--color-mm-accent); outline-offset: 2px; }

    .tb-btn--cancel {
      background: transparent;
      border-color: var(--color-mm-border);
      color: var(--color-mm-text-secondary);
    }

    .tb-btn--cancel:hover { background: var(--color-mm-surface-hover); color: var(--color-mm-text); }

    .tb-btn--insert { background: var(--color-mm-accent); color: #fff; }
    .tb-btn--insert:hover { background: var(--color-mm-accent-hover); }
  `,
  template: `
    <div class="tb-backdrop" (click)="cancelRequest.emit()" aria-hidden="true"></div>

    <div class="tb-panel">
      <!-- Titulo -->
      <h2 class="tb-title" id="table-builder-title">
        <span class="tb-title-icon" aria-hidden="true">
          <app-icon name="table" [size]="16" />
        </span>
        Insertar tabla
      </h2>

      <!-- Barra de controles -->
      <div class="tb-toolbar">
        <!-- Columnas -->
        <div class="tb-control-group">
          <span class="tb-control-label">Columnas</span>
          <div class="tb-stepper" role="group" aria-label="Numero de columnas">
            <button type="button" class="tb-stepper-btn" aria-label="Quitar columna"
              [disabled]="cols() <= 1" (click)="removeCols()">
              <app-icon name="minus" [size]="13" />
            </button>
            <span class="tb-stepper-value" aria-live="polite" aria-atomic="true">{{ cols() }}</span>
            <button type="button" class="tb-stepper-btn" aria-label="Agregar columna"
              [disabled]="cols() >= MAX_COLS" (click)="addCols()">
              <app-icon name="plus" [size]="13" />
            </button>
          </div>
        </div>

        <!-- Filas -->
        <div class="tb-control-group">
          <span class="tb-control-label">Filas</span>
          <div class="tb-stepper" role="group" aria-label="Numero de filas">
            <button type="button" class="tb-stepper-btn" aria-label="Quitar fila"
              [disabled]="rows() <= 1" (click)="removeRows()">
              <app-icon name="minus" [size]="13" />
            </button>
            <span class="tb-stepper-value" aria-live="polite" aria-atomic="true">{{ rows() }}</span>
            <button type="button" class="tb-stepper-btn" aria-label="Agregar fila"
              [disabled]="rows() >= MAX_ROWS" (click)="addRows()">
              <app-icon name="plus" [size]="13" />
            </button>
          </div>
        </div>

        <!-- Alineacion global (todas las columnas) -->
        <div class="tb-global-align">
          <span class="tb-control-label">Alinear todas</span>
          <div class="tb-align-group" role="group" aria-label="Alinear todas las columnas">
            <button type="button" class="tb-align-btn"
              [class.tb-align-btn--active]="globalAlignment() === 'left'"
              aria-label="Alinear todo a la izquierda"
              [attr.aria-pressed]="globalAlignment() === 'left'"
              (click)="setGlobalAlignment('left')">
              <app-icon name="align-left" [size]="13" />
            </button>
            <button type="button" class="tb-align-btn"
              [class.tb-align-btn--active]="globalAlignment() === 'center'"
              aria-label="Centrar todo"
              [attr.aria-pressed]="globalAlignment() === 'center'"
              (click)="setGlobalAlignment('center')">
              <app-icon name="align-center" [size]="13" />
            </button>
            <button type="button" class="tb-align-btn"
              [class.tb-align-btn--active]="globalAlignment() === 'right'"
              aria-label="Alinear todo a la derecha"
              [attr.aria-pressed]="globalAlignment() === 'right'"
              (click)="setGlobalAlignment('right')">
              <app-icon name="align-right" [size]="13" />
            </button>
          </div>
        </div>
      </div>

      <!-- Tabla editable -->
      <div class="tb-scroll" role="region" aria-label="Tabla editable">
        <table class="tb-table">
          <thead>
            <!-- Fila de cabeceras editables -->
            <tr>
              @for (col of colsArray(); track $index; let ci = $index) {
                <th [style.text-align]="alignments()[ci] ?? 'left'">
                  <input
                    class="tb-cell-input"
                    type="text"
                    [style.text-align]="alignments()[ci] ?? 'left'"
                    [value]="headers()[ci] ?? ''"
                    [attr.placeholder]="'Col ' + (ci + 1)"
                    [attr.aria-label]="'Cabecera de columna ' + (ci + 1)"
                    (input)="setHeader(ci, $any($event.target).value)" />
                </th>
              }
            </tr>
            <!-- Fila de controles de alineacion por columna -->
            <tr aria-hidden="true">
              @for (col of colsArray(); track $index; let ci = $index) {
                <th>
                  <div class="tb-col-align-btns">
                    <button type="button" class="tb-col-align-btn"
                      [class.tb-col-align-btn--active]="alignments()[ci] === 'left'"
                      [attr.aria-label]="'Col ' + (ci+1) + ' izquierda'"
                      (click)="setAlignment(ci, 'left')">
                      <app-icon name="align-left" [size]="10" />
                    </button>
                    <button type="button" class="tb-col-align-btn"
                      [class.tb-col-align-btn--active]="alignments()[ci] === 'center'"
                      [attr.aria-label]="'Col ' + (ci+1) + ' centrar'"
                      (click)="setAlignment(ci, 'center')">
                      <app-icon name="align-center" [size]="10" />
                    </button>
                    <button type="button" class="tb-col-align-btn"
                      [class.tb-col-align-btn--active]="alignments()[ci] === 'right'"
                      [attr.aria-label]="'Col ' + (ci+1) + ' derecha'"
                      (click)="setAlignment(ci, 'right')">
                      <app-icon name="align-right" [size]="10" />
                    </button>
                  </div>
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rowsArray(); track $index; let ri = $index) {
              <tr>
                @for (col of colsArray(); track $index; let ci = $index) {
                  <td [style.text-align]="alignments()[ci] ?? 'left'">
                    <input
                      class="tb-data-input"
                      type="text"
                      [style.text-align]="alignments()[ci] ?? 'left'"
                      [value]="cells()[ri]?.[ci] ?? ''"
                      placeholder=""
                      [attr.aria-label]="'Fila ' + (ri+1) + ' columna ' + (ci+1)"
                      (input)="setCell(ri, ci, $any($event.target).value)" />
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Acciones -->
      <div class="tb-actions">
        <button type="button" class="tb-btn tb-btn--cancel"
          id="table-builder-cancel" (click)="cancelRequest.emit()">
          Cancelar
        </button>
        <button #insertBtn type="button" class="tb-btn tb-btn--insert"
          id="table-builder-insert" (click)="handleInsert()">
          Insertar tabla
        </button>
      </div>
    </div>
  `,
})
export class TableBuilderComponent {
  readonly tableInsert = output<string>();
  readonly cancelRequest = output<void>();

  protected readonly MAX_COLS = 8;
  protected readonly MAX_ROWS = 20;

  protected readonly cols = signal(3);
  protected readonly rows = signal(2);
  protected readonly headers = signal<string[]>(['', '', '']);
  protected readonly alignments = signal<ColumnAlignment[]>(['left', 'left', 'left']);
  protected readonly cells = signal<string[][]>([['', '', ''], ['', '', '']]);

  /** Alineacion global: el valor comun a todas las columnas, o null si estan mezcladas. */
  protected readonly globalAlignment = computed<ColumnAlignment | null>(() => {
    const a = this.alignments();
    if (a.length === 0) return null;
    const first = a[0];
    return a.every((v) => v === first) ? first : null;
  });

  protected readonly colsArray = computed(() => Array.from({ length: this.cols() }));
  protected readonly rowsArray = computed(() => Array.from({ length: this.rows() }));

  private readonly insertBtnRef = viewChild<ElementRef<HTMLButtonElement>>('insertBtn');

  constructor() {
    afterNextRender(() => {
      this.insertBtnRef()?.nativeElement.focus();
    });
  }

  // ── Mutacion de dimensiones ───────────────────────────────────────────────

  protected addCols(): void {
    if (this.cols() >= this.MAX_COLS) return;
    this.cols.update((c) => c + 1);
    this.headers.update((h) => [...h, '']);
    this.alignments.update((a) => [...a, 'left']);
    this.cells.update((rows) => rows.map((row) => [...row, '']));
  }

  protected removeCols(): void {
    if (this.cols() <= 1) return;
    this.cols.update((c) => c - 1);
    this.headers.update((h) => h.slice(0, -1));
    this.alignments.update((a) => a.slice(0, -1));
    this.cells.update((rows) => rows.map((row) => row.slice(0, -1)));
  }

  protected addRows(): void {
    if (this.rows() >= this.MAX_ROWS) return;
    this.rows.update((r) => r + 1);
    this.cells.update((rows) => [...rows, Array(this.cols()).fill('')]);
  }

  protected removeRows(): void {
    if (this.rows() <= 1) return;
    this.rows.update((r) => r - 1);
    this.cells.update((rows) => rows.slice(0, -1));
  }

  // ── Edicion de contenido ──────────────────────────────────────────────────

  protected setHeader(colIndex: number, value: string): void {
    this.headers.update((h) => {
      const updated = [...h];
      updated[colIndex] = value;
      return updated;
    });
  }

  protected setCell(rowIndex: number, colIndex: number, value: string): void {
    this.cells.update((rows) => {
      const updated = rows.map((row) => [...row]);
      if (updated[rowIndex]) updated[rowIndex][colIndex] = value;
      return updated;
    });
  }

  // ── Alineacion ────────────────────────────────────────────────────────────

  protected setAlignment(colIndex: number, alignment: ColumnAlignment): void {
    this.alignments.update((a) => {
      const updated = [...a];
      updated[colIndex] = alignment;
      return updated;
    });
  }

  protected setGlobalAlignment(alignment: ColumnAlignment): void {
    this.alignments.update((a) => a.map(() => alignment));
  }

  // ── Generacion ────────────────────────────────────────────────────────────

  protected handleInsert(): void {
    const markdown = buildTableMarkdown(
      this.headers(),
      this.cells(),
      this.alignments(),
    );
    this.tableInsert.emit(markdown);
  }
}
