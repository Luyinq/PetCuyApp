import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-admincrud',
  templateUrl: './admincrud.component.html',
  styleUrls: ['./admincrud.component.scss'],
})
export class AdmincrudComponent  implements OnInit {
  datos: any[] =[];

  constructor(private apiService: ApiService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const entidad = params['entidad'];
      this.obtenerDatosEntidad(entidad);
    });
  }
  
  obtenerDatosEntidad(entidad: string) {
    this.apiService.getUrlData(entidad).subscribe((response: any) => {
      this.datos = Object.entries(response).map(([key, value]) => value);
      console.log(this.datos)
    });
  }
  esAdminUsuarioURL(): boolean {
    return window.location.href.includes('/admin/usuario');
  }
  esAdminTipo_mascotaURL(): boolean {
    return window.location.href.includes('/admin/tipo_mascota');
  }
  
  eliminarUsuario(entidad:string) {
    // Lógica para eliminar la entidad con el ID proporcionado
  }

  editarUsuario(entidad: string) {
    // Lógica para modificar la entidad con el ID proporcionado
  }

  // Otros métodos y funcionalidades genéricas
}