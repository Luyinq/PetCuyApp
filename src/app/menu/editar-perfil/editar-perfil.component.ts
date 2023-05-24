import { Component, OnInit } from '@angular/core';
import { AbstractControl, EmailValidator, FormBuilder, FormControl, FormGroup, FormsModule, ValidatorFn, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Router, NavigationEnd  } from '@angular/router';
import { ApiService } from 'src/app/shared/api.service';

@Component({
  selector: 'app-editar-perfil',
  templateUrl: './editar-perfil.component.html',
  styleUrls: ['./editar-perfil.component.scss'],
})
export class EditarPerfilComponent  implements OnInit {

  nombrePutError!: string;
  apellidoPutError!: string;
  correoPutError!: string;
  celularPutError!: string;

  updateForm = new FormGroup({
    nombre: new FormControl('',[Validators.required, Validators.minLength(2), Validators.maxLength(20)]),
    apellido: new FormControl('',[Validators.required, Validators.minLength(2), Validators.maxLength(20)]),
    correo: new FormControl('',[Validators.required, Validators.email]),
    celular: new FormControl('',[Validators.required, Validators.min(900000000), Validators.max(999999999)])
  });

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

  constructor( private router: Router, 
    public alertController: AlertController, 
    private http: HttpClient,
    private api: ApiService) { }

  ngOnInit() { 
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Reset the variables when navigating to another page
        this.nombrePutError = '';
        this.apellidoPutError = '';
        this.correoPutError = '';
        this.celularPutError = '';
      }
    });
  }
  
  ionViewWillEnter() {
    this.api.getUserData(this.updateForm)
  }

  submitForm() {
    this.nombrePutError = '';
    this.apellidoPutError = '';
    this.correoPutError = '';
    this.celularPutError = '';
    if (this.updateForm && this.updateForm.valid) {
      const url = `https://luyinq.pythonanywhere.com/usuario/` + localStorage.getItem('rut') + '/';
      const headers = new HttpHeaders({
        'Authorization': 'Token ' + localStorage.getItem('token')
      });
      const data = {
        nombre: this.updateForm.value.nombre as string,
        apellido: this.updateForm.value.apellido as string,
        correo: this.updateForm.value.correo as string,
        celular: this.updateForm.value.celular as string
      };
      // Verificar si el número de celular ha cambiado
      if (localStorage.getItem("celular") == data.celular && localStorage.getItem("nombre")  == this.updateForm.value.nombre && localStorage.getItem("apellido")  == this.updateForm.value.apellido &&
        localStorage.getItem("correo")  == this.updateForm.value.correo) {
        this.presentAlert("Error", "No se ha actualizado ningún campo.");
        return; // Salir de la función sin enviar la solicitud PUT
      }
      this.http.put(url, data, { headers }).subscribe((response: any) => {
        if (response.success) {
          this.presentAlert("Felicitaciones", response.message);
          localStorage.setItem('correo', data.correo)
          localStorage.setItem('nombre', data.nombre)
          localStorage.setItem('apellido', data.apellido)
          localStorage.setItem('celular', data.celular)
          this.router.navigate(['/home']);
        } else {
          this.presentAlert("Error", response.message);
        }
      }, (error: any) => {
        if (error.error.message){
          this.presentAlert("Error", error.error.message);
        }else{
          this.presentAlert("Error", "No se ha realizado el cambio");
        }
        if (error.error.error.details) {
          console.log(error.error.error.details)
          if (error.error.error.details.nombre) {
            this.nombrePutError = error.error.error.details.nombre[0];
          }
          if (error.error.error.details.apellido){
            this.apellidoPutError = error.error.error.details.apellido[0];
          }
          if (error.error.error.details.correo){
            this.correoPutError = error.error.error.details.correo[0];
          }
          if (error.error.error.details.celular){
            this.celularPutError = error.error.error.details.celular[0];
            console.log(this.celularPutError)
          }
        }
      });
    } 
  }

  async presentAlert(titulo: string, msg: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: msg,
      buttons: ['OK'],
    });

    await alert.present();

  }
}