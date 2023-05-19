import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HttpClientModule, HttpHeaders } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormGroup } from '@angular/forms';

@NgModule({
  imports: [
    // ...
    HttpClientModule
  ],
  // ...
})
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient, private router: Router) { }

  getUserData(updateForm: FormGroup) {
    const url = `https://luyinq.pythonanywhere.com/usuario/` + localStorage.getItem('rut') + '/';
    const headers = new HttpHeaders({
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    const options = { headers: headers };
    this.http.get(url, options).subscribe((response: any) => {
      if (updateForm) { 
        // check if updateForm is defined
        // Rellena los campos del formulario con los datos obtenidos de la API
        updateForm.patchValue({
          nombre: response.nombre,
          apellido: response.apellido,
          correo: response.correo,
          celular: response.celular
        });
      }
      this.router.navigate(['/editar-perfil']);
    }, (error: any) => {
      console.error(error);
    });
  }

}