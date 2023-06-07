import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/shared/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-anuncio-form',
  templateUrl: './anuncio-form.component.html',
  styleUrls: ['./anuncio-form.component.scss'],
})
export class AnuncioFormComponent implements OnInit {

  isEdit: boolean;
  botonDeshabilitado: boolean = false;
  categoriaOptions: any[] = [];
  mascotaOptions: any[] = [];
  mascotaSeleccionada: any;
  position = {
    latitude: 0,
    longitude: 0
  }
  errorMessage! : string;

  anuncioForm = new FormGroup({
    descripcion: new FormControl('', [Validators.required, Validators.minLength(10)]),
    categoria: new FormControl('', [Validators.required]),
    mascota: new FormControl('', [Validators.required])
  });

  getErrorMessage(controlName: string) {
    const control = this.anuncioForm.get(controlName);
    if (control?.hasError('required')) {
      return 'El campo es requerido.';
    }
    if (control?.hasError('minlength')) {
      return `El campo debe tener al menos ${control?.errors?.['minlength']?.requiredLength} carácteres.`;
    }
    return '';
  }

  constructor(private api: ApiService, private route: ActivatedRoute, private router : Router, private cdr: ChangeDetectorRef) {
    this.isEdit = false;
  }

  ngOnInit() {
    this.ionViewWillEnter(); // Llama a ionViewWillEnter al inicializar la página
  }

  ionViewWillEnter() {
    this.listMascotaOptions();
    this.listCategoriaOptions();
    this.route.queryParams.subscribe(params => {
      const latitude = (params['latitude']);
      const longitude = (params['longitude']);
      this.position = { latitude, longitude };
    });
    console.log(this.position)
  }

  
  listMascotaOptions() {
    this.api.listPets()
      .then((response: any[]) => {
        this.mascotaOptions = response;
        console.log(this.mascotaOptions);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  listCategoriaOptions() {
    this.api.listTipoAnuncio()
      .then((response: any[]) => {
        this.categoriaOptions = response;
      })
      .catch((error) => {
        console.error(error);
      });
  }

  onMascotaChange(event: any) {
    this.mascotaSeleccionada = event.target.value;
    this.errorMessage = "";
    this.cdr.detectChanges(); // Manually trigger change detection
  }

  getFotoMascotaSeleccionada() {
    const mascota = this.mascotaOptions.find(option => option.id === this.mascotaSeleccionada);
    return mascota ? mascota.foto_1 : '';
  }

  guardarAnuncio() {
    const descripcion = this.anuncioForm.get('descripcion')?.value!;
    const categoria = parseInt(this.anuncioForm.get('categoria')?.value!);
    const mascota = parseInt(this.anuncioForm.get('mascota')?.value!);
  
    this.botonDeshabilitado = true;
  
    this.api.createAnuncio(descripcion, categoria, mascota).subscribe(
      (response: any) => {
        // La solicitud de creación de anuncio se completó correctamente
        console.log('Anuncio creado:', response);
        console.log(this.position);
  
        // Llamar a la función createPosicion para enviar la posición
        this.api.createPosicion(this.position.latitude, this.position.longitude, response.data.id).subscribe(
          (posicionResponse: any) => {
            this.api.presentToast("Anuncio creado exitosamente")
            console.log('Posición creada:', posicionResponse);
            this.resetForm();
            this.router.navigate(["/home"])
          },
          (posicionError: any) => {
            this.errorMessage = posicionError.message;
            this.cdr.detectChanges(); // Manually trigger change detection
            this.botonDeshabilitado = false;
            console.error('Error al crear la posición:', posicionError);            
          }
        );
      },
      (error: any) => {
        this.errorMessage = error.error.message;
        this.botonDeshabilitado = false;
        this.cdr.detectChanges()
        console.error('Error al crear el anuncio:', error);        
      }
    );
  }
  
  resetForm() {
    this.botonDeshabilitado = false;
    this.position = {
      latitude: 0,
      longitude: 0
    };
  }
  
  
  

}
