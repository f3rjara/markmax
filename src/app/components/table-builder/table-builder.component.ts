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

  const dataRows = cells.map((row) => `| ${row.map((c) => escapeCell(c) || ' ').join(' | ')} |`);

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
  styleUrl: './table-builder.component.css',
  templateUrl: './table-builder.component.html',
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
  protected readonly cells = signal<string[][]>([
    ['', '', ''],
    ['', '', ''],
  ]);

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
    const markdown = buildTableMarkdown(this.headers(), this.cells(), this.alignments());
    this.tableInsert.emit(markdown);
  }
}
