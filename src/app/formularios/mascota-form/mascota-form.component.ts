import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Route } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ApiService } from 'src/app/shared/api.service';
import { environment } from 'src/environments/environment.prod';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';


@Component({
  selector: 'app-mascota-form',
  templateUrl: './mascota-form.component.html',
  styleUrls: ['./mascota-form.component.scss']
})
export class MascotaFormComponent implements OnInit {
  fotos: File[] = [];
  isEdit: boolean;
  tipoMascotaOptions: any[] = [];

  mascotaForm = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(3), onlyLettersValidator()]),
    fotos: new FormControl('', [Validators.required]),
    tipoMascota: new FormControl('', [Validators.required])
  });

  getErrorMessage(controlName: string) {
    const control = this.mascotaForm.get(controlName);
    if (control?.hasError('required')) {
      return 'El campo es requerido.';
    }
    if (control?.hasError('minlength')) {
      return `El campo debe tener al menos ${control?.errors?.['minlength']?.requiredLength} carácteres.`;
    }
    if (control?.hasError('onlyLetters')) {
      return `El campo solo debe contener letras.`;
    }
    return '';
  }

  constructor(private api : ApiService, private formBuilder: FormBuilder, private http: HttpClient, private route: ActivatedRoute, private router : Router) {
    this.isEdit = false;
  }

  ngOnInit() {
    this.fetchTipoMascotaOptions();
    const isEditParam = this.route.snapshot.paramMap.get('isEdit');
    const petIdParam = this.route.snapshot.paramMap.get('petId');
    this.isEdit = (isEditParam === 'true');
  
    if (this.isEdit && petIdParam) {
      const petId = parseInt(petIdParam, 10);
      this.api.getPet(petId).then(
        (pet: any) => {
          // Asignar los datos de la mascota al formulario
          this.mascotaForm.patchValue({
            nombre: pet.nombre,
            fotos: '',
            tipoMascota: pet.tipo // Asignar la opción encontrada al formulario
          });
        },
        (error: any) => {
          console.error('Error al obtener los datos de la mascota:', error);
        }
      );
    }
  }

  onFotosSelected(event: any) {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      const selectedFiles: File[] = [];
      for (let i = 0; i < files.length && selectedFiles.length < 2; i++) {
        selectedFiles.push(files[i]);
      }
      this.fotos = selectedFiles;
    }
  }

  async guardarMascota() {
    if (this.mascotaForm.valid && this.fotos.length > 0 && this.fotos.length <= 2) {
      this.api.showLoading();
      const mascota: Record<string, any> = {
        nombre: this.mascotaForm.value.nombre ?? '',
        tipo: Number(this.mascotaForm.value.tipoMascota) ?? 0,
        dueno: localStorage.getItem('rut'),
        foto_1: 'a',
        foto_2: ''
      };
  
      const headers = this.api.getAuthorization();
      headers.append('Content-Type', 'application/json');
  
      try {
        // Disable the button
        const button = document.getElementById('guardar-button');
        if (button) {
          button.setAttribute('disabled', 'disabled');
        }
  
        if (this.isEdit) {
          const petIdParam = this.route.snapshot.paramMap.get('petId');
          const response: any = await this.http.put(`https://luyinq.pythonanywhere.com/mascota/${petIdParam}/`, mascota, { headers }).toPromise();
          this.api.presentToast(response.message);
          this.api.dismissLoading();
          await this.uploadPhotos(Number(petIdParam), mascota);
        } else {
          const response: any = await this.http.post('https://luyinq.pythonanywhere.com/mascota/', mascota, { headers }).toPromise();
          const mascotaId = response.data.id;
          await this.uploadPhotos(mascotaId, mascota);
          this.api.dismissLoading();
          this.api.presentToast(response.message);
        }
  
        this.router.navigate(['/mis-mascotas']);
      } catch (error: any) {
        console.log(error);
        this.api.dismissLoading();
        this.api.presentToast(error.message);
      } finally {
        // Enable the button
        const button = document.getElementById('guardar-button');
        if (button) {
          button.removeAttribute('disabled');
        }
      }
    } else {
      this.api.dismissLoading();
      this.api.presentToast("Existe un error en el formulario");
    }
  }
  
  private async uploadPhotos(id: number, mascota: Record<string, any>): Promise<void> {
    const foto1Promise: Promise<string> = this.api.uploadImage(this.fotos[0], `${id}-foto_1`, environment.cloudify.presetMascotas);
    const foto2Promise: Promise<string> | null = this.fotos[1] ? this.api.uploadImage(this.fotos[1], `${id}-foto_2`, environment.cloudify.presetMascotas) : null;
  
    try {
      const [url1, url2] = await Promise.all([foto1Promise, foto2Promise]);
  
      mascota['foto_1'] = url1;
  
      if (url2) {
        mascota['foto_2'] = url2;
      }
  
      const headers = this.api.getAuthorization();
      headers.append('Content-Type', 'application/json');
  
      const response: any = await this.http.put(`https://luyinq.pythonanywhere.com/mascota/${id}/`, mascota, { headers }).toPromise();
  
      if (response.success) {
        this.router.navigate(['/mis-mascotas']);
      }
    } catch (error: any) {
      console.error(error);
      this.api.presentToast(error.message);
    }
  }
  
  
  
  
  


  fetchTipoMascotaOptions() {
    const headers = new HttpHeaders({
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    this.http.get<any[]>('https://luyinq.pythonanywhere.com/tipo_mascota/', {headers})
      .subscribe(
        (response) => {
          this.tipoMascotaOptions = response;
        },
        (error) => {
          console.error('Error recuperando los tipos de mascota:', error);
        }
      );
  }
}

function onlyLettersValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const value = control.value;
    const onlyLettersRegex = /^[A-Za-z]+$/; // Regex to match only letters

    if (value && !onlyLettersRegex.test(value)) {
      return { onlyLetters: true }; // Validation failed
    }

    return null; // Validation passed
  };
}