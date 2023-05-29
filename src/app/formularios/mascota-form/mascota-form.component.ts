import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/shared/api.service';


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
    nombre: new FormControl('', [Validators.required, Validators.minLength(3)]),
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
    return '';
  }

  constructor(private api : ApiService, private formBuilder: FormBuilder, private http: HttpClient, private route: ActivatedRoute) {
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

  guardarMascota() {
    if (this.mascotaForm.valid && this.fotos.length > 0 && this.fotos.length <= 2) {
      const mascota = {
        nombre: this.mascotaForm.value.nombre,
        foto_1: this.fotos[0],
        foto_2: this.fotos[1],
        tipoMascota: this.mascotaForm.value.tipoMascota
      };

      if (this.isEdit) {
        // Realizar una solicitud PUT al servidor para actualizar la mascota existente
        const petIdParam = this.route.snapshot.paramMap.get('petId');
        this.http.put(`https://luyinq.pythonanywhere.com/mascota/${petIdParam}` + '/', mascota)
          .subscribe(response => {
            // Lógica adicional después de la actualización exitosa
          }, error => {
            // Lógica para manejar el error en caso de fallar la actualización
          });
      } else {
        // Realizar una solicitud POST al servidor para crear una nueva mascota
        this.http.post('https://luyinq.pythonanywhere.com/mascota/', mascota)
          .subscribe(response => {
            // Lógica adicional después de la creación exitosa
          }, error => {
            // Lógica para manejar el error en caso de fallar la creación
          });
      }
    } else {
      // Formulario inválido o número incorrecto de fotos seleccionadas
      // Puedes mostrar un mensaje de error o realizar la lógica adecuada aquí
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
