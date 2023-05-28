import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HttpClientModule, HttpHeaders } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { environment } from '../../environments/environment.prod';
import { SHA1 } from 'crypto-js';
import { ToastController } from '@ionic/angular';


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

  rut: string = '';

  constructor(private http: HttpClient, private router: Router, private toastController: ToastController) { }


  async presentToast(message: string) {
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

  getMyPets(): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      const url = `https://luyinq.pythonanywhere.com/mascota/?dueno=` + localStorage.getItem('rut') + '/';
      const headers = new HttpHeaders({
        'Authorization': 'Token ' + localStorage.getItem('token')
      });

      this.http.get<any[]>(url, { headers }).subscribe(
        (response: any[]) => {
          // Obtener los nombres de tipo de mascota
          this.http.get<any[]>('https://luyinq.pythonanywhere.com/tipo_mascota/', { headers }).subscribe(
            (tipoMascotas: any[]) => {
              // Asignar el nombre de tipo correspondiente a cada mascota
              response.forEach((mascota) => {
                const tipo = tipoMascotas.find((tipoMascota) => tipoMascota.id === mascota.tipo);
                mascota.tipo = tipo ? tipo.nombre : 'Desconocido';
              });

              resolve(response);
            },
            (error) => {
              reject(error);
            }
          );
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  getPet(petId: number): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const url = `https://luyinq.pythonanywhere.com/mascota/${petId}/`;
      const headers = new HttpHeaders({
        'Authorization': 'Token ' + localStorage.getItem('token')
      });

      this.http.get<any>(url, { headers }).subscribe(
        (response: any) => {
          resolve(response)
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  deletePet(petId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const url = `https://luyinq.pythonanywhere.com/mascota/${petId}/`;
      const headers = new HttpHeaders({
        'Authorization': 'Token ' + localStorage.getItem('token')
      });

      this.http.delete(url, { headers }).subscribe(
        () => {
          resolve(); // Resolve the promise on successful deletion
        },
        (error) => {
          reject(error); // Reject the promise with the error message
        }
      );
    });
  }


  async getAnuncios(): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      const url = `https://luyinq.pythonanywhere.com/anuncio/`;
      const headers = new HttpHeaders({
        'Authorization': 'Token ' + localStorage.getItem('token')
      });

      this.http.get<any[]>(url, { headers }).subscribe(
        async (response: any[]) => {
          const anunciosWithPosicion: any[] = [];

          for (const anuncio of response) {
            const posicion = await this.http.get<any>('https://luyinq.pythonanywhere.com/posicion/?anuncio=' + anuncio.id, { headers }).toPromise();
            const mascota = await this.http.get<any>('https://luyinq.pythonanywhere.com/mascota/' + anuncio.mascota + '/', { headers }).toPromise();

            anuncio.posicion = posicion; // Obtener el primer elemento del array de posiciones
            anuncio.mascota = mascota; // Agregar la propiedad "mascotaInfo" al anuncio y asignarle la información de la mascota

            anunciosWithPosicion.push(anuncio);
          }

          resolve(anunciosWithPosicion);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }






}