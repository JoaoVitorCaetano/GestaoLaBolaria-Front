import { Routes } from '@angular/router';
import { ProdutosComponent } from './pages/produtos/produtos.component';
import { IngredientesComponent } from './pages/ingredientes/ingredientes.component';
import { FichaTecnicaComponent } from './pages/ficha-tecnica/ficha-tecnica.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'produtos', pathMatch: 'full' },
  { path: 'produtos', component: ProdutosComponent, canActivate: [authGuard] },
  {
    path: 'produtos/:id/ficha-tecnica',
    component: FichaTecnicaComponent,
    canActivate: [authGuard],
  },
  {
    path: 'ingredientes',
    component: IngredientesComponent,
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'produtos' },
];
