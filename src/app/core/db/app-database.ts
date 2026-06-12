import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { MarkdownFile } from '../models/markdown-file.model';
import { DB_NAME, DB_VERSION } from '../../shared/text.constants';

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
    this.version(DB_VERSION).stores({
      files: '&id, status',
    });
  }
}
