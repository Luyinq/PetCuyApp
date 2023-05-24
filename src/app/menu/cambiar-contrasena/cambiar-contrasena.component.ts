import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl,
FormGroup, Validators} from '@angular/forms';
import {  AlertController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';




@Component({
  selector: 'app-cambiar-contrasena',
  templateUrl: './cambiar-contrasena.component.html',
  styleUrls: ['./cambiar-contrasena.component.scss'],
})
export class CambiarContrasenaComponent  implements OnInit {

  vieja_contrasenaPutError!: string;
  passwordPutError!: string;
  updatePassForm!: FormGroup;
  show = false;
  showPassword1: boolean = false;
  showPassword2: boolean = false;
  showPassword3: boolean = false;

  ionViewWillLeave() {
    const activeElement = document.activeElement as HTMLElement;
    activeElement.blur(); // Remove focus from the active element
  }

  togglePasswordVisibility1() {
    this.showPassword1 = !this.showPassword1;
  }

  togglePasswordVisibility2() {
    this.showPassword2 = !this.showPassword2;
  }

  togglePasswordVisibility3() {
    this.showPassword3 = !this.showPassword3;
  }


  getErrorMessage(controlName: string) {
    const control = this.updatePassForm.get(controlName);
    if (control?.hasError('required')) {
      return 'El campo es requerido.';
    }
    if (control?.hasError('not_matching')) {
      return 'Las contraseñas deben coincidir.';
    }
    if (control?.hasError('pattern')) {
      return 'El campo debe contener una letra mayúscula, minúscula y número.';
    }
    return '';
  }

  constructor(private router: Router, public alertController: AlertController, public fb: FormBuilder, private http: HttpClient, private location: Location) { }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Reset the variables when navigating to another page
        this.vieja_contrasenaPutError = '';
        this.passwordPutError = '';
      }
    });

    this.updatePassForm = this.fb.group({
      vieja_contrasena: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(20), Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{6,}')]),
      password: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(20), Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{6,}')]),
      confirmPassword: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(20), Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{6,}')]),
    },
      {
        validator: this.matchingPasswords
      });
  }

  matchingPasswords(control: AbstractControl) {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    const currentErrors = control.get('confirmPassword')?.errors
    const confirmControl = control.get('confirmPassword')

    if (compare(password, confirmPassword)) {
      confirmControl?.setErrors({ ...currentErrors, not_matching: true });
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

  submitForm(control: AbstractControl) {
    if (control && control.valid) {
      const vieja_contrasena = control.get('vieja_contrasena')?.value;
      const nueva_contrasena = control.get('password')?.value;
      if (vieja_contrasena === nueva_contrasena) {
        this.presentAlert("Error", "La nueva contraseña no puede ser igual a la actual.");
      } else {
        const loginUrl = `https://luyinq.pythonanywhere.com/login/`;
        const loginHeaders = new HttpHeaders({
          'Content-Type': 'application/json',
        });
        const loginBody = {
          'rut': localStorage.getItem('rut'),
          'contrasena': vieja_contrasena
        };
        this.http.post(loginUrl, loginBody, { headers: loginHeaders })
          .subscribe(
            (loginResponse: any) => {
              if (loginResponse.success) {
                const url = `https://luyinq.pythonanywhere.com/usuario/` + localStorage.getItem('rut') + '/';
                const headers = new HttpHeaders({
                  'Content-Type': 'application/json',
                  'Authorization': `Token ` + localStorage.getItem('token')
                });
                const body = {
                  'contrasena': nueva_contrasena
                };
                this.http.put(url, body, { headers })
                  .subscribe(
                    (response: any) => {
                      if (response.success) {
                        this.presentAlert('Éxito', response.message);
                      } else {
                        this.presentAlert('Error', response.message);
                      }
                    },
                    error => {
                      this.presentAlert('Error', error.error.message);
                    }
                  );
              } else {
                this.presentAlert('Error', loginResponse.error.message);
              }
            },
            error => {
              this.presentAlert('Error', error.error.message);
            }
          );
      }
    }
  }

}

function compare(password: string, confirmPassword: string) {
  return password !== confirmPassword && confirmPassword !== ''
}