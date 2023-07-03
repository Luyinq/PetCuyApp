import { Component, OnInit } from '@angular/core';
import { AbstractControl, ValidatorFn , FormControl, FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule, } from '@angular/forms';
import { AlertController  } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AppComponent } from '../../app.component';
import { ApiService } from 'src/app/shared/api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent  implements OnInit {

  showPassword: boolean = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  forgotForm = new FormGroup({
    rut: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(9), Validators.pattern('[0-9A-Za-z]+'), this.rutValidator()]),
    password: new FormControl('')
  });
  
  getErrorMessage(controlName: string) {
    const control = this.forgotForm.get(controlName);
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
    if (control?.hasError('invalidRut')) {
      return 'Debe ingresar un rut real.';
    }
    return '';
  }

  constructor(private router: Router, private api : ApiService, public alertController:AlertController, public formBuilder:FormBuilder, private http: HttpClient, private main: AppComponent) {}

  ngOnInit() {
  }



  submitForm() {
    if (this.forgotForm && this.forgotForm.valid) {
      this.api.showLoading();
      const rutControl = this.forgotForm.get('rut');
      const passwordControl = this.forgotForm.get('password');
      if (rutControl && passwordControl) {
        const rut = rutControl.value;
        const password = passwordControl.value;
        const requestBody = { rut: rut , contrasena: password };
        this.http.post('https://luyinq.pythonanywhere.com/login/', requestBody)
          .subscribe((response: any) => {
            if (response.success) {
              localStorage.setItem('rut', response.data.usuario.rut)
              localStorage.setItem('correo', response.data.usuario.correo)
              localStorage.setItem('nombre', response.data.usuario.nombre)
              localStorage.setItem('apellido', response.data.usuario.apellido)
              localStorage.setItem('foto', response.data.usuario.foto)
              localStorage.setItem('celular', response.data.usuario.celular)
              localStorage.setItem('isActive', response.data.usuario.isActive)
              localStorage.setItem('isAdmin', response.data.usuario.isAdmin)
              localStorage.setItem('token', response.data.tokens[0].key);
              this.api.presentToast(response.message);
              this.main.showMenu = true;
              this.main.ngOnInit();
              this.api.dismissLoading();
              this.router.navigate(['/home']);
            } else {
              this.api.dismissLoading();
              this.api.presentToast(response.message);
            }
          }, (error: any) => {
            this.api.dismissLoading();
            this.api.presentToast(error.error.message);
          });
      }
    } else {
      this.presentAlert("Error", "Completa correctamente los campos.");
    }
  }

  rutValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const rut = control.value;
      if (!rut) {
        return null;
      }
      const isValid = this.validarRut(rut);
      return isValid ? null : { 'invalidRut': true };
    };
  }

  validarRut(rut: string): boolean {
    rut = rut.toUpperCase();
    rut = rut.replace("-", "");
    rut = rut.replace(".", "");
    const aux = rut.slice(0,-1);
    let dv: string = rut.slice(-1);
  
    if (dv === 'K') {
      dv = '10';
    } else if (!dv.match(/^\d+$/)) {
      return false;
    }
  
    if (!aux.match(/^\d+$/)) {
      return false;
    }
  
    const revertido = Array.from(aux, Number).reverse();
    const factors = [2, 3, 4, 5, 6, 7];
    let s = 0;
    let f = 0;
  
    for (let i = 0; i < revertido.length; i++) {
      f = factors[i % factors.length];
      s += revertido[i] * f;
    }
  
    let res = (11 - (s % 11)).toString();
    
    if (res === '11') {
      res = '0';
    }
  
    if (res === dv) {
      return true;
    } else {
      return false;
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
