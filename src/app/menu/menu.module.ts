import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CambiarContrasenaComponent } from './cambiar-contrasena/cambiar-contrasena.component';
import { EditarPerfilComponent } from './editar-perfil/editar-perfil.component';
import { VerPerfilComponent } from './ver-perfil/ver-perfil.component';
import { MisMascotasComponent } from './mis-mascotas/mis-mascotas.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FormGroupDirective } from '@angular/forms'; // Import FormGroupDirective
import { ApiService } from '../shared/api.service';
import { VerAnuncioComponent } from './ver-anuncio/ver-anuncio.component';
import { DatePipe } from '@angular/common';

@NgModule({
  declarations: [CambiarContrasenaComponent, EditarPerfilComponent, VerPerfilComponent, MisMascotasComponent, VerAnuncioComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  providers: [FormGroupDirective, ApiService, DatePipe], // Add FormGroupDirective to providers
})
export class MenuModule { }
