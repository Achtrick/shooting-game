import { Routes } from '@angular/router';
import { ArenaComponent } from './core/arena/arena.component';
import { HomeComponent } from './core/home/home.component';

export const routes: Routes = [
  { path: 'arena/:id', component: ArenaComponent },
  { path: '', component: HomeComponent },
  { path: '', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
