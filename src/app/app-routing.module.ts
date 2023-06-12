import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './inicio-sesion/login/login.component';
import { OlvideContrasenaComponent } from './inicio-sesion/olvide-contrasena/olvide-contrasena.component';
import { RegistroComponent } from './inicio-sesion/registro/registro.component';
import { CambiarContrasenaComponent } from './menu/cambiar-contrasena/cambiar-contrasena.component';
import { EditarPerfilComponent } from './menu/editar-perfil/editar-perfil.component';
import { MisMascotasComponent } from './menu/mis-mascotas/mis-mascotas.component';
import { VerPerfilComponent } from './menu/ver-perfil/ver-perfil.component';
import { VerAnuncioComponent } from './menu/ver-anuncio/ver-anuncio.component';
import { MascotaFormComponent } from './formularios/mascota-form/mascota-form.component';
import { AnuncioFormComponent } from './formularios/anuncio-form/anuncio-form.component';
import { AuthGuardGuard } from './guards/auth-guard.guard';
import { LoggedInGuard } from './guards/logged-in.guard';

import { AdmincrudComponent } from './admincrud/admincrud.component'

import { MisAnunciosComponent } from './menu/mis-anuncios/mis-anuncios.component';
import { TutorialComponent } from './tutorial/tutorial.component';


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
    path: 'admin/:entidad',
    component: AdmincrudComponent,
    canActivate: [AuthGuardGuard]
  },
  {
    path: 'anuncio',
    component: VerAnuncioComponent,
    canActivate: [AuthGuardGuard]
  },
  {
    path: 'mascota-form',
    component: MascotaFormComponent,
    canActivate: [AuthGuardGuard]
  },
  {
    path: 'mascota-form/:isEdit/:petId',
    component: MascotaFormComponent,
    canActivate: [AuthGuardGuard]
  },
  {
    path: 'anuncio-form',
    component: AnuncioFormComponent,
    canActivate: [AuthGuardGuard]
  },
  {
    path: 'mis-anuncios',
    component: MisAnunciosComponent,
    canActivate: [AuthGuardGuard]
  },
  {
    path: 'tutorial',
    component: TutorialComponent
  },
  {
    path: '',
    redirectTo: localStorage.getItem('tutorial') === 'true' ? 'home' : 'tutorial', // Redirect based
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
