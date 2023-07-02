import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/shared/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { PubnubService } from 'src/app/shared/pubnub.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AlertController } from '@ionic/angular';



@Component({
  selector: 'app-anuncio-form',
  templateUrl: './anuncio-form.component.html',
  styleUrls: ['./anuncio-form.component.scss'],
})
export class AnuncioFormComponent implements OnInit {
  alertShown = false;
  isEdit: boolean;
  botonDeshabilitado: boolean = false;
  categoriaOptions: any[] = [];
  mascotaOptions: any[] = [];
  mascotaSeleccionada: any;
  position = {
    latitude: 0,
    longitude: 0
  }
  errorMessage!: string;

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

  constructor(private alertController: AlertController, private http: HttpClient, private pub: PubnubService, private api: ApiService, private route: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) {
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


  async listMascotaOptions() {
    this.mascotaOptions = []; // Clear the array before making the API call
    const rut = localStorage.getItem('rut');

    if (rut) {
      const url = `https://luyinq.pythonanywhere.com/mascota/?dueno=${rut}`;

      // Obtén el token de alguna manera (por ejemplo, también desde el localStorage)
      const token = localStorage.getItem('token');

      // Configura los encabezados de la solicitud
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      });

      // Realiza la solicitud GET
      this.http.get(url, { headers }).subscribe(
        async (response: Object) => {
          const convertedResponse = response as any[]; // Conversión de tipo a any[]

          if (convertedResponse.length === 0 && !this.alertShown) {
            this.alertShown = true; // Establecer la variable de bandera en true para evitar más alertas
            // Mostrar una alerta si el resultado filtrado está vacío
            const alert = await this.alertController.create({
              header: '¡Hey!',
              message: 'No posees mascotas registradas.',
              buttons: [
                {
                  text: 'Ir a mis mascotas',
                  handler: () => {
                    this.router.navigate(["/mis-mascotas"]);
                  }
                }
              ]
            });
            await alert.present();
          }

          // Filtra los elementos donde haveAnuncio sea false
          const filteredResponse = convertedResponse.filter((item: any) => !item.haveAnuncio);

          if (filteredResponse.length === 0 && !this.alertShown) {
            this.alertShown = true; // Establecer la variable de bandera en true para evitar más alertas
            // Mostrar una alerta si el resultado filtrado está vacío
            const alert = await this.alertController.create({
              header: '¡Hey!',
              message: 'Todas tus mascotas registradas poseen anuncios.',
              buttons: [
                {
                  text: 'Ir a mis anuncios',
                  handler: () => {
                    this.router.navigate(["/mis-anuncios"]);
                  }
                }
              ]
            });
            await alert.present();
          }
          // Asignar la respuesta filtrada a mascotaOptions
          this.mascotaOptions = filteredResponse;
        },
        (error) => {
          // Manejar cualquier error ocurrido durante la solicitud
          console.error(error);
        }
      );
      this.alertShown = false; // Establecer la variable de bandera en true para evitar más alertas
    }
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
        console.log('Anuncio creado:', response);
        const categoriaSeleccionada = this.obtenerCategoriaSeleccionada(categoria);
        const nombreMascota = this.obtenerNombreMascotaSeleccionada();
        const anuncio = this.crearDatosAnuncio(response, categoriaSeleccionada, nombreMascota);
        const mensajeJSON = JSON.stringify(anuncio);
        console.log(anuncio)

        this.api.createPosicion(this.position.latitude, this.position.longitude, response.data.id).subscribe(
          (posicionResponse: any) => {
            this.api.presentToast("Anuncio creado exitosamente");
            console.log('Posición creada:', posicionResponse);
            this.pub.sendMessage("Agregar", mensajeJSON);
            this.resetForm();
            this.router.navigate(["/home"]);
          },
          (posicionError: any) => {
            this.handleError(posicionError);
          }
        );
      },
      (error: any) => {
        this.handleError(error);
      }
    );
  }

  obtenerCategoriaSeleccionada(categoriaId: number) {
    const categoria = this.categoriaOptions.find(option => option.id === categoriaId);
    return categoria ? categoria.nombre : '';
  }

  obtenerNombreMascotaSeleccionada() {
    const mascota = this.mascotaOptions.find(option => option.id === this.mascotaSeleccionada);
    return mascota ? mascota.nombre : '';
  }

  crearDatosAnuncio(response: any, categoriaNombre: string, nombreMascota: string) {
    return {
      id: response.data.id,
      categoria: categoriaNombre,
      descripcion: response.data.descripcion,
      mascota: nombreMascota,
      lat: this.position.latitude,
      lng: this.position.longitude
    };
  }

  handleError(error: any) {
    this.errorMessage = error.error.message;
    this.botonDeshabilitado = false;
    this.cdr.detectChanges();
    console.error('Error:', error);
  }

  resetForm() {
    this.botonDeshabilitado = false;
    this.position = {
      latitude: 0,
      longitude: 0
    };
  }




}
