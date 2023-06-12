import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { FormControl, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-admincrud',
  templateUrl: './admincrud.component.html',
  styleUrls: ['./admincrud.component.scss'],

})
export class AdmincrudComponent  implements OnInit {
  datos: any[] =[];
  filtroRut: string = '';
  nombrePutError!: string;
  apellidoPutError!: string;
  correoPutError!: string;
  celularPutError!: string;
  datosOriginales: any[] = []; // Variable para almacenar los datos originales

  campoEditado: string = '';
  valorOriginal: string = '';
  cambiosRealizados: { campo: string, valorOriginal: string, valorNuevo: string }[] = [];



  updateForm = new FormGroup({
    nombre: new FormControl('',[Validators.required, Validators.minLength(2), Validators.maxLength(20)]),
    apellido: new FormControl('',[Validators.required, Validators.minLength(2), Validators.maxLength(20)]),
    correo: new FormControl('',[Validators.required, Validators.email]),
    celular: new FormControl('',[Validators.required, Validators.min(900000000), Validators.max(999999999)])
  });

  constructor(private apiService: ApiService, 
    private route: ActivatedRoute, 
    public alertController: AlertController) { 

    }
  getErrorMessage(controlName: string) {
    const control = this.updateForm.get(controlName);
    if (control?.hasError('required')) {
      return 'El campo es requerido.';
    }
    if (control?.hasError('minlength')) {
      return `El campo debe tener al menos ${control?.errors?.['minlength']?.requiredLength} caracteres.`;
    }
    if (control?.hasError('maxlength')) {
      return `El campo no puede tener más de ${control?.errors?.['maxlength']?.requiredLength} caracteres.`;
    }
    if (control?.hasError('pattern')) {
      return 'El campo solo puede contener letras y números.';
    }
    if (control?.hasError('email')) {
      return 'Ingrese un correo válido.';
    }
    if (control?.hasError('min')) {
      return 'Ingrese un número válido.';
    }
    if (control?.hasError('max')) {
      return 'Ingrese un número válido.';
    }
    return '';
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const entidad = params['entidad'];
      this.obtenerDatosEntidad(entidad);
    });
  }
  
  obtenerDatosEntidad(entidad: string) {
    const rutLocalStorage = localStorage.getItem('rut');
  
    if (entidad === 'usuario' && rutLocalStorage) {
      this.apiService.getUrlData(entidad).subscribe((response: any) => {
        this.datosOriginales = Object.entries(response).map(([key, value]) => value);
        this.datos = this.datosOriginales.filter((dato: any) => dato.rut !== rutLocalStorage);
        this.actualizarEstadoToggle();
        console.log(this.datos);
      });
    } else {
      this.apiService.getUrlData(entidad).subscribe((response: any) => {
        this.datosOriginales = Object.entries(response).map(([key, value]) => value);
        this.datos = this.datosOriginales;
        this.actualizarEstadoToggle();
        console.log(this.datos);
      });
    }
  }
  actualizarEstadoToggle() {
    for (const entidad of this.datos) {
      entidad.isAdminToggle = entidad.isAdmin;
    }
  }

  esAdminUsuarioURL(): boolean {
    return window.location.href.includes('/admin/usuario');
  }
  esAdminTipo_mascotaURL(): boolean {
    return window.location.href.includes('/admin/tipo_mascota');
  }
  esAdminTipo_anuncioURL(): boolean {
    return window.location.href.includes('/admin/tipo_anuncio');
  }
  esAdminEstadoURL(): boolean {
    return window.location.href.includes('/admin/estado');
  }
  esAdminMascotaURL(): boolean {
    return window.location.href.includes('/admin/mascota');
  }
  esAdminAnuncioURL(): boolean {
    return window.location.href.includes('/admin/anuncio');
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

// ...

editarUsuario(entidad: any) {
  // Lógica para enviar la solicitud de modificación de la entidad con el ID proporcionado
  const rut = entidad.rut; // Obtén el rut del objeto 'entidad'
  const data = {
    nombre: entidad.nombre as string,
    apellido: entidad.apellido as string,
    correo: entidad.correo as string,
    celular: entidad.celular as string
  };
  this.apiService.editarUsuario(rut, data).subscribe(
    () => {
      // Edición exitosa
      console.log('Usuario editado');
      this.obtenerDatosEntidad('usuario');
      this.mostrarAlertaModificacion(data);
    },
    (error) => {
      // Error al editar el usuario
      console.error(error);
      if (error.error.error.details) {
          console.log(error.error.error.details)
          if (error.error.error.details.nombre) {
            this.nombrePutError = error.error.error.details.nombre[0];
            this.presentAlert("Error", this.nombrePutError);
            this.obtenerDatosEntidad('usuario');
          }
          if (error.error.error.details.apellido){
            this.apellidoPutError = error.error.error.details.apellido[0];
            this.presentAlert("Error", this.apellidoPutError);
            this.obtenerDatosEntidad('usuario');
          }
          if (error.error.error.details.correo){
            this.correoPutError = error.error.error.details.correo[0];
            this.presentAlert("Error", this.correoPutError);
            this.obtenerDatosEntidad('usuario');
          }
          if (error.error.error.details.celular){
            this.celularPutError = error.error.error.details.celular[0];
            this.presentAlert("Error", this.celularPutError);
            console.log(this.celularPutError)
            this.obtenerDatosEntidad('usuario');
          }
        }else{
        this.presentAlert("Error", "No se ha realizado el cambio");
        this.obtenerDatosEntidad('usuario');
      }
    }
  );
}

mostrarCampoEditado(campo: string, valor: string) {
  const cambioRealizado = this.cambiosRealizados.find(cambio => cambio.campo === campo);

  if (cambioRealizado) {
    cambioRealizado.valorNuevo = valor;
  } else {
    this.cambiosRealizados.push({ campo: campo, valorOriginal: valor, valorNuevo: valor });
  }
}

mostrarAlertaModificacion(data: any) {
  const cambiosRealizados: { campo: string, valorOriginal: string, valorNuevo: string }[] = [];

  let valorNuevo: string = ''; // Valor predeterminado

  this.cambiosRealizados.forEach(cambio => {
    if (cambio.campo === 'Nombre') {
      valorNuevo = data.nombre;
    } else if (cambio.campo === 'Apellido') {
      valorNuevo = data.apellido;
    } else if (cambio.campo === 'Correo') {
      valorNuevo = data.correo;
    } else if (cambio.campo === 'Celular') {
      valorNuevo = data.celular;
    }

    if (valorNuevo !== cambio.valorOriginal) {
      cambiosRealizados.push({
        campo: cambio.campo,
        valorOriginal: cambio.valorOriginal,
        valorNuevo: valorNuevo
      });
    }
  });

  if (cambiosRealizados.length > 0) {
    let mensaje = '\n\n';
    cambiosRealizados.forEach(cambio => {
      mensaje += `${cambio.campo}: ${cambio.valorOriginal} --> ${cambio.valorNuevo}\n`;
    });
    this.presentAlert('Modificación Exitosa', mensaje);
    this.obtenerDatosEntidad('usuario');
  }
}

cambiarAdminUsuario(entidad:any) {
  entidad.isAdmin = !entidad.isAdmin; // Cambia el estado de isAdmin
  console.log(entidad.isAdmin)

  const rut = entidad.rut; // Obtén el rut del objeto 'entidad'
  const data = {
    isAdmin: entidad.isAdmin as boolean // Agrega la propiedad 'isAdmin' al objeto 'data'
  };

  // Enviar solicitud a la API para actualizar el estado de administrador del usuario
  this.apiService.editarUsuario(rut, data).subscribe(
    () => {
      // Edición exitosa
      console.log('Estado de administrador cambiado');
      if(entidad.isAdmin == true){
        this.presentAlert('Cambio exitoso', 'Has convertido al usuario '+entidad.nombre+' en administrador.');
        this.obtenerDatosEntidad('usuario');
      }else{
        this.presentAlert('Cambio exitoso', 'El usuario '+entidad.nombre+' ya no es administrador.');
        this.obtenerDatosEntidad('usuario');
      }
      
    },
    (error) => {
      // Error al editar el usuario
      console.error(error);
      this.presentAlert("Error", "No se ha realizado el cambio");
      this.obtenerDatosEntidad('usuario');
    }
  );
}






async eliminarTipoMascota(entidad: any) {
  const mascota = entidad.id; // Obtén el rut del objeto 'entidad'
  
  const alert = await this.alertController.create({
    header: 'Confirmar eliminación',
    message: '¿Estás seguro de eliminar este tipo de mascota: '+'"'+entidad.nombre+'"'+' de manera permanente?',
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
          this.apiService.eliminarTipoMascota(mascota).subscribe(
            () => {
              // Eliminación exitosa
              console.log('Tipo de mascota eliminado');
              this.obtenerDatosEntidad('tipo_mascota');
            },
            (error) => {
              // Error al eliminar el tipo mascota
              console.error(error);
            }
          );
        }
      }
    ]
  });

  await alert.present();
  
}

async editarTipoMascota(entidad: any) {
  const alert = await this.alertController.create({
    header: 'Confirmar edición',
    message: '¿Estás seguro de editar este tipo de mascota: '+'"'+entidad.nombre+'"'+' ?',
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel',
        handler: () => {
          this.obtenerDatosEntidad('tipo_mascota');
          console.log('Edición cancelada');
        }
      },
      {
        text: 'Aceptar',
        handler: () => {
          this.apiService.editarTipoMascota(entidad).subscribe(
            () => {
              // Eliminación exitosa
              console.log('Tipo de mascota editado');
              this.obtenerDatosEntidad('tipo_mascota');
            },
            (error) => {
              // Error al eliminar el tipo mascota
              console.error(error);
            }
          );
        }
      }
    ]
  });

  await alert.present();

}




// ...


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

async presentAlert(title: string, message: string) {
  const alert = await this.alertController.create({
    header: title,
    message: message,
    buttons: [
      {
        text: 'OK',
        handler: () => {
           // Recargar la página
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
    return console.log(filtroActual);
  }

  const regex = /^[0-9]+$/;

  if (!regex.test(filtroActual)) {
    this.mostrarMensajeRutNoEncontrado();
    return console.log(filtroActual);
  }

  const filtro = filtroActual.toLowerCase();
  const resultados = this.datosOriginales.filter((dato: any) =>
    dato.rut.toLowerCase().startsWith(filtro) && dato.rut !== localStorage.getItem('rut')
  );

  if (resultados.length === 0) {
    this.mostrarMensajeRutNoEncontrado();
    return;
  }

  this.datos = resultados;
}


filtrarInput(event: any): void {
  const input = event.target.value;
  const filteredInput = input.replace(/[^0-9kK]/g, '');

  if (filteredInput !== input) {
    event.target.value = filteredInput;
    this.filtroRut = filteredInput;
  }
}



// ...

  
  

  // Otros métodos y funcionalidades genéricas
}

//196178309