import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OlvideContrasenaComponent } from './olvide-contrasena/olvide-contrasena.component';
import { RegistroComponent } from './registro/registro.component';
import { RouterModule } from '@angular/router';
import { FormGroupDirective } from '@angular/forms'; // Import FormGroupDirective

@NgModule({
  declarations: [LoginComponent, OlvideContrasenaComponent, RegistroComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  providers: [FormGroupDirective], // Add FormGroupDirective to providers
})
export class InicioSesionModule { }
