import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { MarkdownFile } from '../models/markdown-file.model';
import { DB_NAME } from '../../shared/text.constants';

/**
 * Definición del esquema de la base de datos IndexedDB.
 *
 * Responsabilidad única: inicializar Dexie y declarar las tablas e índices.
 * No contiene lógica de negocio ni operaciones CRUD.
 */
@Injectable({ providedIn: 'root' })
export class AppDatabase extends Dexie {
  files!: Table<MarkdownFile, string>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      files: '&id, status',
    });
    // Version 2: agrega campo deletedAt (campo JS, no requiere indice nuevo).
    this.version(2).stores({
      files: '&id, status',
    });
  }
}
