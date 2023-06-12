import { Component, OnInit, ViewChild, ChangeDetectorRef  } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './shared/api.service';
import { environment } from 'src/environments/environment.prod';
import { Geolocation } from '@capacitor/geolocation';
import { AlertController } from '@ionic/angular';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  
})
export class AppComponent implements OnInit {
  @ViewChild('fileInput') fileInput: any;
  localStorage: Storage = window.localStorage;
  showMenu: boolean = false;
  showAdminOptions: boolean = false;
  nombre: string | undefined;
  profilePic: string = "assets/imagenes/profileNotFound.jpg";
  jsonItems: any[] = [];

  constructor(private alert: AlertController, private router: Router, private fb: FormBuilder, private http: HttpClient, private apiService: ApiService, private changeDetectorRef: ChangeDetectorRef) { 
  }

  avatarClicked() {
    this.fileInput.nativeElement.click();
  }



  uploadImage(event: any) {
    const publicId = this.localStorage?.getItem('rut') || '';
    const file = event.target.files[0];

    this.apiService.uploadImage(file, publicId, environment.cloudify.presetProfilePic)
      .then((imageUrl: string) => {
        console.log(imageUrl);
        this.localStorage?.setItem('foto', imageUrl);
        this.profilePic = imageUrl;
        this.changeDetectorRef.detectChanges();
      // Call the updateProfilePic function to update the profile picture
      this.apiService.updateProfilePic(imageUrl, this.localStorage?.getItem('rut') || '', this.localStorage?.getItem('token') || '')
      .then((result: any) => {
        console.log(result)
        this.apiService.presentToast(result.message);
      })
      .catch((error: any) => {
        console.log(error)
        this.apiService.presentToast(error.error.message);
      });
      })
      .catch((error: any) => {
        console.log(error);
        this.apiService.presentToast(error.message);
      });
  }


  ngOnInit() {
    this.localStorage = window.localStorage;
    this.updateMenuAndProfilePic();
    this.apiService.getUrlData('').subscribe((response: any) => {
      this.jsonItems = Object.keys(response).map(key => ({ key, url: response[key] }));
    });

    this.initializeApp();
  }

  async initializeApp() {
    try {
      const permissionStatus = await Geolocation.requestPermissions();
      if (permissionStatus.location === 'granted') {
        console.log('Permiso de geolocalización concedido');
      } else {
        const alert = await this.alert.create({
          header: 'Permiso requerido',
          message: 'Es necesario permitir el acceso a la geolocalización para usar la aplicación.',
          buttons: [
            {
              text: 'Cerrar aplicación',
              handler: () => {
                this.closeApp();
              }
            }
          ]
        });
        await alert.present();
      }
    } catch (error) {
      console.error('Error al solicitar permisos de geolocalización:', error);
    }
  }

  async closeApp() {
    try {
      await App.exitApp();
    } catch (error) {
      console.error('Error al cerrar la aplicación:', error);
    }
  }
  
  redirigirEntidad(index: number) {
    const entidadClickeada = this.jsonItems[index].key;
    console.log(entidadClickeada);
    this.router.navigate(['/admin', entidadClickeada]);
  }
  
  
  updateMenuAndProfilePic() {
    this.showMenu = !!this.localStorage.getItem('rut');
    if (this.localStorage.getItem('foto') !== "null") {
      this.profilePic = this.localStorage.getItem('foto') || "";
    } else {
      this.profilePic = "assets/imagenes/profileNotFound.jpg"; // Establece una imagen de perfil predeterminada
    }
    this.nombre = this.localStorage.getItem('nombre') || '';
  }

  toggleAdminOptions() {
    this.showAdminOptions = !this.showAdminOptions;
  }

  logout() {
    this.localStorage?.clear()
    this.showMenu = false; // Actualiza el valor de la variable showMenu
    this.profilePic = "assets/imagenes/profileNotFound.jpg"; // Restablecer la imagen predeterminada
    this.nombre = undefined; // Restablecer el nombre
    this.router.navigate(['/login']);
  }

  toChangePassword() {
    this.router.navigate(['/cambiar-contrasena']);
  }

  gotoMyProfile() {
    this.apiService.rut = this.localStorage?.getItem('rut') || '';
    this.router.navigate(['/perfil']);
  }
  

}

