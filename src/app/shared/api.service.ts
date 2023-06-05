import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HttpClientModule, HttpHeaders } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { environment } from '../../environments/environment';
import { SHA1 } from 'crypto-js';
import { ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';

@NgModule({
  imports: [
    // ...
    HttpClientModule
  ],
  providers: [ApiService]
  // ...
})
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  rut : string = '';

  constructor(private http: HttpClient, private router: Router, private toastController: ToastController) { }


  async presentToast(message : string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000, // Duration in milliseconds
      position: 'bottom' // Position: 'top', 'bottom', or 'middle'
    });
    toast.present();
  }

  getUserData(updateForm: FormGroup) {
    const url = `https://luyinq.pythonanywhere.com/usuario/` + localStorage.getItem('rut') + '/';
    const headers = new HttpHeaders({
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    const options = { headers: headers };
    this.http.get(url, options).subscribe((response: any) => {
      if (updateForm) { 
        // check if updateForm is defined
        // Rellena los campos del formulario con los datos obtenidos de la API
        updateForm.patchValue({
          nombre: response.nombre,
          apellido: response.apellido,
          correo: response.correo,
          celular: response.celular
        });
      }
      this.router.navigate(['/editar-perfil']);
    }, (error: any) => {
      console.error(error);
    });
  }

  uploadImage(file: File, publicId: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const timestamp = Date.now().toString();
      const signature = this.createSignature(publicId, timestamp);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', environment.cloudify.presetProfilePic);
      formData.append('timestamp', timestamp);
      formData.append('public_id', publicId);
      formData.append('api_key', environment.cloudify.apiKey);
      formData.append('signature', signature);

      this.http
        .post('https://api.cloudinary.com/v1_1/dfbon2wfu/image/upload', formData)
        .subscribe(
          (result: any) => {
            resolve(result.secure_url);
          },
          (error: any) => {
            reject(error);
          }
        );
    });
  }

  updateProfilePic(foto: string, rut: string, token: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const url = 'https://luyinq.pythonanywhere.com/usuario/' + rut + '/';
      const data = { foto: foto };
  
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Token ' + token
      });
  
      this.http.put(url, data, { headers: headers })
        .subscribe(
          (result: any) => {
            resolve(result);
          },
          (error: any) => {
            reject(error);
          }
        );
    });
  }

  createSignature(publicId: string, timestamp: string): string {
    const apiSecret = environment.cloudify.apiSecret;
  
    const parameters: Record<string, string> = {
      public_id: publicId,
      timestamp,
      upload_preset: 'profile_auth',
    };
  
    const sortedParameters = Object.entries(parameters)
      .sort()
      .reduce((obj: Record<string, string>, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
  
    const serializedParameters = Object.entries(sortedParameters)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  
    const stringToSign = serializedParameters + apiSecret;
    const signature = SHA1(stringToSign).toString();
  
    return signature;
  }

  getUrlData(getUrl: string): Observable<any> {
    const baseUrl = 'https://luyinq.pythonanywhere.com';
    const url = `${baseUrl}/${getUrl}/`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    console.log('todobien')
    return new Observable<any>((observer) => {
      this.http.get(url, { headers }).subscribe(
        (response) => {
          observer.next(response);
          observer.complete();
        },
        (error) => {
          observer.error(error);
        }
      );
    });
  }
  eliminarUsuario(rut: string): Observable<any> {
    const baseUrl = 'https://luyinq.pythonanywhere.com/usuario';
    const url = `${baseUrl}/${rut}/`; // Agrega el rut en la URL para eliminar el usuario
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
  
    return this.http.delete(url, { headers });
  }
}