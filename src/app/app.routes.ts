import { Routes } from '@angular/router';
import { ProdutosComponent } from './pages/produtos/produtos.component';
import { IngredientesComponent } from './pages/ingredientes/ingredientes.component';
import { FichaTecnicaComponent } from './pages/ficha-tecnica/ficha-tecnica.component';

export const routes: Routes = [
  { path: '', redirectTo: 'produtos', pathMatch: 'full' },
  { path: 'produtos', component: ProdutosComponent },
  { path: 'produtos/:id/ficha-tecnica', component: FichaTecnicaComponent },
  { path: 'ingredientes', component: IngredientesComponent },
  { path: '**', redirectTo: 'produtos' },
];
