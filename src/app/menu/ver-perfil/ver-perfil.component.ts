import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiService } from 'src/app/shared/api.service';

@Component({
  selector: 'app-ver-perfil',
  templateUrl: './ver-perfil.component.html',
  styleUrls: ['./ver-perfil.component.scss']
})
export class VerPerfilComponent implements OnInit {
  usuario: any; // Supongamos que tienes una propiedad para almacenar los datos del usuario

  constructor(private http: HttpClient, private api: ApiService) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.obtenerDatosUsuario(this.api.rut);
  }

  obtenerDatosUsuario(rut: string) {
    if (rut.length != 0) {
      const url = `https://luyinq.pythonanywhere.com/usuario/` + rut + '/';
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Token ' + localStorage.getItem('token')
      });

      this.http.get(url, { headers: headers }).subscribe(
        (response: any) => {
          this.usuario = response; // Supongamos que la respuesta contiene todos los datos del usuario
          // Asegúrate de que los campos existan en la respuesta antes de asignarlos
          this.usuario.nombre = response.nombre;
          this.usuario.apellido = response.apellido;
          this.usuario.celular = response.celular;
          this.usuario.correo = response.correo;
          this.usuario.foto = response.foto;
          console.log(response)
        },
        (error) => {
          console.log('Error al obtener los datos del usuario:', error);
        }
      );
    }
  }

  get storedCelular(): string {
    return localStorage.getItem('celular') || '';
  }

  get storedCorreo(): string {
    return localStorage.getItem('correo') || '';
  }
}