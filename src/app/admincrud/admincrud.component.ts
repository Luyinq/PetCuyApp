import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';


@Component({
  selector: 'app-admincrud',
  templateUrl: './admincrud.component.html',
  styleUrls: ['./admincrud.component.scss'],

})
export class AdmincrudComponent  implements OnInit {
  datos: any[] =[];
  filtroRut: string = '';

  constructor(private apiService: ApiService, private route: ActivatedRoute, private alertController: AlertController) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const entidad = params['entidad'];
      this.obtenerDatosEntidad(entidad);
    });
  }
  
  obtenerDatosEntidad(entidad: string) {
    const rutLocalStorage = localStorage.getItem('rut'); // Obtener el rut almacenado en el localStorage
    if (entidad === 'usuario' && rutLocalStorage) {
      this.apiService.getUrlData(entidad).subscribe((response: any) => {
        this.datos = Object.entries(response).map(([key, value]) => value);
  
        // Filtrar los datos para excluir aquellos que tengan el mismo rut
        this.datos = this.datos.filter((dato: any) => dato.rut !== rutLocalStorage);
  
        console.log(this.datos);
      });
    } else {
      this.apiService.getUrlData(entidad).subscribe((response: any) => {
        this.datos = Object.entries(response).map(([key, value]) => value);
        console.log(this.datos);
      });
    }
  }
  esAdminUsuarioURL(): boolean {
    return window.location.href.includes('/admin/usuario');
  }
  esAdminTipo_mascotaURL(): boolean {
    return window.location.href.includes('/admin/tipo_mascota');
  }
  
  async eliminarUsuario(entidad: any) {
    const rut = entidad.rut; // Obtén el rut del objeto 'entidad'
  
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de eliminar este usuario de manera permanente?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Eliminación cancelada');
          }
        },
        {
          text: 'Aceptar',
          handler: () => {
            this.apiService.eliminarUsuario(rut).subscribe(
              () => {
                // Eliminación exitosa
                console.log('Usuario eliminado');
                this.obtenerDatosEntidad('usuario');
              },
              (error) => {
                // Error al eliminar el usuario
                console.error(error);
              }
            );
          }
        }
      ]
    });
  
    await alert.present();
  }
  
  
  
  

  editarUsuario(entidad: string) {
    // Lógica para modificar la entidad con el ID proporcionado
  }

  async mostrarMensajeRutNoEncontrado() {
    const alert = await this.alertController.create({
      header: 'RUT no encontrado',
      message: 'El RUT no existe en la base de datos.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            window.location.reload(); // Recargar la página
          }
        }
      ]
    });
  
    await alert.present();
  }



  // ...

filtrarDatos() {
  const filtroActual = this.filtroRut.trim();

  if (!filtroActual) {
    this.obtenerDatosEntidad('usuario');
    return;
  }

  const regex = /^[0-9]+$/;

  if (!regex.test(filtroActual)) {
    this.mostrarMensajeRutNoEncontrado();
    return;
  }

  const filtro = filtroActual.toLowerCase();
  const resultados = this.datos.filter((dato: any) =>
    dato.rut.toLowerCase().startsWith(filtro)
  );

  if (resultados.length === 0) {
    this.mostrarMensajeRutNoEncontrado();
    return; // Detener la ejecución para evitar la actualización de datos innecesaria
  }

  // Actualizar la lista de datos con los resultados de búsqueda
  this.datos = resultados;
}

filtrarInput(event: any): void {
  const input = event.target.value;
  const regex = /^[0-9kK]*$/;

  if (!regex.test(input)) {
    event.target.value = this.filtroRut;
    return;
  }

  this.filtroRut = input;
}

// ...

  
  

  // Otros métodos y funcionalidades genéricas
}

//196178309