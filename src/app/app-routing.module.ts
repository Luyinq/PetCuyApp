import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './inicio-sesion/login/login.component';
import { OlvideContrasenaComponent } from './inicio-sesion/olvide-contrasena/olvide-contrasena.component';
import { RegistroComponent } from './inicio-sesion/registro/registro.component';
import { AuthGuardGuard } from './guards/auth-guard.guard';
import { LoggedInGuard } from './guards/logged-in.guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule),
    canActivate: [AuthGuardGuard]
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [LoggedInGuard]
  },
  {
    path: 'olvide-contrasena',
    component: OlvideContrasenaComponent,
    canActivate: [LoggedInGuard]
  },
  {
    path: 'registro',
    component: RegistroComponent,
    canActivate: [LoggedInGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
