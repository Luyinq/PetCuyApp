import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MascotaFormComponent } from './mascota-form/mascota-form.component';
import { AnuncioFormComponent } from './anuncio-form/anuncio-form.component';
import { RouterModule } from '@angular/router';
import { FormGroupDirective } from '@angular/forms'; // Import FormGroupDirective
import { ApiService } from '../shared/api.service';

@NgModule({
  declarations: [MascotaFormComponent, AnuncioFormComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  providers: [FormGroupDirective, ApiService], // Add FormGroupDirective to providers
})
export class FormulariosModule { }
