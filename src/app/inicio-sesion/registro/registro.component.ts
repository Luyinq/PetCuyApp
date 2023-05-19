import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, 
FormGroup, ValidatorFn, Validators, FormGroupDirective } from '@angular/forms';
import { AlertController, ActionSheetController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss'],
})
export class RegistroComponent implements OnInit {

  public rutErrorMessage!: string;

  /*VALIDAR FORM REGISTRO*/
  registerForm!: FormGroup;
  show = false;
  rutPostError!: string;
  nombrePostError!: string;
  apellidoPostError!: string;
  emailPostError!: string;
  celularPostError!: string;
  contrasenaPostError!: string;
  showPassword1: boolean = false;
  showPassword2: boolean = false;

  togglePasswordVisibility1() {
    this.showPassword1 = !this.showPassword1;
  }

  togglePasswordVisibility2() {
    this.showPassword2 = !this.showPassword2;
  }

  getErrorMessage(controlName: string) {
    const control = this.registerForm.get(controlName);
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
      const patternErrors = control.errors?.['pattern'];
      if (patternErrors?.requiredPattern === '[0-9A-Za-z]+') {
        return 'El campo debe contener solo letras y números.';
      }
      if (patternErrors?.requiredPattern === '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{6,}') {
        return 'El campo debe contener al menos una letra mayúscula, una letra minúscula y un número.';
      }
    }
    if (control?.hasError('invalidRut')) {
      return 'Debe ingresar un rut real.';
    }
    if (control?.hasError('not_matching')) {
      return 'Las contraseñas deben coincidir.';
    }
    if (control?.hasError('email')) {
      return 'Ingresa un correo válido.';
    }
    return '';
  }

  constructor(private router: Router, public alertController: AlertController, public fb:FormBuilder, private http: HttpClient, private actionsheet: ActionSheetController, private formGroupDirective: FormGroupDirective) {}

  // Define an index signature to access dynamic property names
  [key: string]: any;

  // Generic function to reset the corresponding error variable
  resetErrorVariable(fieldName: string) {
    const errorVariableName = `${fieldName}PostError`;
    if (this.hasOwnProperty(errorVariableName)) {
      this[errorVariableName] = '';
    }
  }

  ngOnInit() {
    this.registerForm = this.fb.group({
      rut: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(9), Validators.pattern('[0-9A-Za-z]+'), this.rutValidator()]),
      nombre: new FormControl('',[Validators.required, Validators.minLength(2), Validators.maxLength(20)]),
      apellido: new FormControl('',[Validators.required, Validators.minLength(2), Validators.maxLength(20)]),
      password: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(20), Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{6,}')]),
      confirmPassword: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(20),]),
      email: new FormControl('',[Validators.required, Validators.email]),
      celular: new FormControl('',[Validators.required, Validators.min(900000000), Validators.max(999999999)])
  },
  {
    validator: this.matchingPasswords
  });

      // Add event listeners to the form controls
      const formControls: { fieldName: string; controlName: string }[] = [
        { fieldName: 'rut', controlName: 'rut' },
        { fieldName: 'nombre', controlName: 'nombre' },
        { fieldName: 'apellido', controlName: 'apellido' },
        { fieldName: 'email', controlName: 'email' },
        { fieldName: 'celular', controlName: 'celular' },
        { fieldName: 'contrasena', controlName: 'password' },
      ];
  
      formControls.forEach((field) => {
        const control = this.registerForm.get(field.controlName);
        if (control) {
          control.valueChanges.subscribe(() => {
            this.resetErrorVariable(field.fieldName);
          });
        }
      });
  }

  showPassword(){
    this.show = !this.show;
  }

  async selectImageOptions(){
    const actionsheet = await this.actionsheet.create({
      header: 'Selecciona una imagen',
      buttons: [{
        text: 'Galería',
        handler: ()=>{
          console.log('Imagen Seleccionada desde Galería')
        }
      },
      {
        text: 'Cancelar',
        role: 'cancel'
      }
    ]
    });
    await actionsheet.present();
  }

  getData(){
    return this.http.get('https://luyinq.pythonanywhere.com/usuario/');
  }

  matchingPasswords(control: AbstractControl){
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    const currentErrors = control.get('confirmPassword')?.errors
    const confirmControl = control.get('confirmPassword')

    if(compare(password, confirmPassword)){
      confirmControl?.setErrors({...currentErrors, not_matching: true});
    }
  }
  
  submitForm() {
    if (this.registerForm && this.registerForm.valid) {
      const rutControl = this.registerForm.get('rut');
      const nomControl = this.registerForm.get('nombre');
      const apeControl = this.registerForm.get('apellido');
      const passControl = this.registerForm.get('password');
      const emailControl = this.registerForm.get('email');
      const celControl = this.registerForm.get('celular');
      if (rutControl && nomControl && apeControl && passControl && emailControl && celControl ) {
        const rut = rutControl.value;
        const nombre = nomControl.value;
        const apellido = apeControl.value;
        const password = passControl.value;
        const email = emailControl.value;
        const celular = celControl.value;
        const requestBody = 
        { 
          rut: rut,
          nombre: nombre,
          apellido: apellido,
          contrasena: password,
          correo: email,
          celular: celular
        };
        this.http.post('https://luyinq.pythonanywhere.com/usuario/', requestBody)
          .subscribe((response: any) => {
            if (response.success) {
              this.presentAlert("Felicitaciones", response.message);
              this.registerForm.reset();
              this.router.navigate(['/login']);
            } else {
              this.presentAlert("Error", response.message);
            }
          }, (error: any) => {
            if (error.error.details.rut) {
              this.rutPostError = error.error.details.rut[0];
            }
            if (error.error.details.nombre){
              this.nombrePostError = error.error.details.nombre[0];
            }
            if (error.error.details.apellido){
              this.apellidoPostError = error.error.details.apellido[0];
            }
            if (error.error.details.contrasena){
              this.contrasenaPostError = error.error.details.contrasena[0];
            }
            if (error.error.details.correo){
              this.emailPostError = error.error.details.correo[0];
            }
            if (error.error.details.celular){
              this.celularPostError = error.error.details.celular[0];
            }
            this.presentAlert("Error", "Por favor, verifica los campos.");
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

function compare(password: string, confirmPassword: string) {
  return password !== confirmPassword && confirmPassword !== ''
}
