import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/editor/editor-page.component').then((m) => m.EditorPageComponent),
  },
  { path: '**', redirectTo: '' },
];
