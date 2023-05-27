import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './inicio-sesion/login/login.component';
import { OlvideContrasenaComponent } from './inicio-sesion/olvide-contrasena/olvide-contrasena.component';
import { RegistroComponent } from './inicio-sesion/registro/registro.component';
import { CambiarContrasenaComponent } from './menu/cambiar-contrasena/cambiar-contrasena.component';
import { EditarPerfilComponent } from './menu/editar-perfil/editar-perfil.component';
import { MisMascotasComponent } from './menu/mis-mascotas/mis-mascotas.component';
import { VerPerfilComponent } from './menu/ver-perfil/ver-perfil.component';
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
    path: 'cambiar-contrasena',
    component: CambiarContrasenaComponent,
    canActivate: [AuthGuardGuard]
  },
  {
    path: 'editar-perfil',
    component: EditarPerfilComponent,
    canActivate: [AuthGuardGuard]
  },
  {
    path: 'mis-mascotas',
    component: MisMascotasComponent,
    canActivate: [AuthGuardGuard]
  },
  {
    path: 'perfil',
    component: VerPerfilComponent,
    canActivate: [AuthGuardGuard]
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
