import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HttpClientModule, HttpHeaders } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { environment } from '../../environments/environment.prod';
import { SHA1 } from 'crypto-js';
import { ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { LoadingController } from '@ionic/angular';


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
  nuevoTipoMascota: string = '';

  constructor(private loadingController: LoadingController, private http: HttpClient, private router: Router, private toastController: ToastController) { }

  async showLoading() {
    const loading = await this.loadingController.create({
      message: 'Cargando...',
    });
    await loading.present();
  }

  async dismissLoading() {
    await this.loadingController.dismiss();
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000, // Duration in milliseconds
      position: 'bottom' // Position: 'top', 'bottom', or 'middle'
    });
    toast.present();
  }

  getAuthorization(): HttpHeaders {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`
    });

    return headers;
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

  uploadImage(file: File, publicId: string, uploadPreset: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const timestamp = Date.now().toString();
      const signature = this.createSignature(publicId, timestamp, uploadPreset);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
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

  createSignature(publicId: string, timestamp: string, uploadPreset: string): string {
    const apiSecret = environment.cloudify.apiSecret;

    const parameters: Record<string, string> = {
      public_id: publicId,
      timestamp,
      upload_preset: uploadPreset,
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
      const rut = localStorage.getItem('rut');
      const url = `https://luyinq.pythonanywhere.com/mascota/`;
      const headers = new HttpHeaders({
        'Authorization': 'Token ' + localStorage.getItem('token')
      });

      this.http.get<any[]>(url, { headers }).subscribe(
        (response: any[]) => {
          // Obtener los nombres de tipo de mascota
          this.http.get<any[]>('https://luyinq.pythonanywhere.com/tipo_mascota/', { headers }).subscribe(
            (tipoMascotas: any[]) => {
              // Filtrar solo las mascotas que pertenecen a tu RUT
              const filteredPets = response.filter((mascota) => mascota.dueno === rut);

              // Asignar el nombre de tipo correspondiente a cada mascota
              filteredPets.forEach((mascota) => {
                const tipo = tipoMascotas.find((tipoMascota) => tipoMascota.id === mascota.tipo);
                mascota.tipo = tipo ? tipo.nombre : 'Desconocido';
              });

              resolve(filteredPets);
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

  listPets(): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      const rut = localStorage.getItem('rut');
      if (!rut) {
        reject('Owner rut not found in localStorage.');
        return;
      }

      const url = `https://luyinq.pythonanywhere.com/mascota/?dueno=${rut}/`;
      const headers = new HttpHeaders({
        'Authorization': 'Token ' + localStorage.getItem('token')
      });

      this.http.get<any[]>(url, { headers }).subscribe(
        (response: any[]) => {
          const filteredPets = response.filter(pet => pet.dueno === rut);
          resolve(filteredPets);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  listTipoAnuncio(): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      const url = `https://luyinq.pythonanywhere.com/tipo_anuncio/`;
      const headers = new HttpHeaders({
        'Authorization': 'Token ' + localStorage.getItem('token')
      });

      this.http.get<any[]>(url, { headers }).subscribe(
        (response: any[]) => {
          resolve(response);
        },
        (error) => {
          reject(error);
        }
      );
    },
    );
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

          const posiciones = await this.http.get<any[]>('https://luyinq.pythonanywhere.com/posicion/', { headers }).toPromise();

          for (const anuncio of response) {
            const mascota = await this.http.get<any>('https://luyinq.pythonanywhere.com/mascota/' + anuncio.mascota + '/', { headers }).toPromise();

            anuncio.mascota = mascota; // Assign the "mascota" property to the ad and assign the mascot information

            if (posiciones && posiciones.length > 0) {
              // Filter the specific position associated with the ad
              const posicionAnuncio = posiciones.find((pos) => pos.anuncio === anuncio.id);

              if (posicionAnuncio) {
                anuncio.posicion = posicionAnuncio;
              } else {
                anuncio.posicion = null;
              }
            } else {
              anuncio.posicion = null;
            }

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

  createAnuncio(descripcion: string, categoria: number, mascota: number): Observable<any> {
    const token = localStorage.getItem('token');

    const body = {
      descripcion: descripcion,
      estado: 3,
      tipo: categoria,
      mascota: mascota,
      autor: localStorage.getItem('rut')
    };

    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);

    return this.http.post('https://luyinq.pythonanywhere.com/anuncio/', body, { headers });
  }

  createPosicion(latitud: number, longitud: number, anuncio: number): Observable<any> {
    const token = localStorage.getItem('token');

    const body = {
      latitud: latitud,
      longitud: longitud,
      anuncio: anuncio,
      radio: 100
    };

    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);
    return this.http.post('https://luyinq.pythonanywhere.com/posicion/', body, { headers });
  }


  // saveTokenMsg method
  saveTokenMsg(msgToken: string): Observable<any> {
    const apiUrl = 'https://luyinq.pythonanywhere.com/usuario/' + localStorage.getItem('rut') + '/';
    const body = {
      msgToken: msgToken
    };
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Token ' + localStorage.getItem('token'));

    return this.http.put(apiUrl, body, { headers });
  }


  async sendMessageWithFCM(deviceToken: string, title: string, body: string): Promise<void> {
    const url = 'https://fcm.googleapis.com/fcm/send';
    const serverKey = environment.CloudMessage.serverKey
    console.log(serverKey)

    // Set the headers with the necessary authorization and content type
    const headers = new HttpHeaders({
      'Authorization': `key=${serverKey}`,
      'Content-Type': 'application/json'
    });

    // Set the message payload
    const payload = {
      'to': deviceToken,
      'notification': {
        'title': title,
        'body': body
      }
    };

    try {
      // Send the HTTP POST request to the FCM API
      await this.http.post(url, payload, { headers }).toPromise();
      console.log('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }


  async getAnunciosByRut(rut: string): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      const url = `https://luyinq.pythonanywhere.com/anuncio/`;
      const headers = new HttpHeaders({
        'Authorization': 'Token ' + localStorage.getItem('token')
      });

      this.http.get<any[]>(url, { headers }).subscribe(
        async (response: any[]) => {
          const anuncios: any[] = [];

          for (const anuncio of response) {
            const mascota = await this.http.get<any>('https://luyinq.pythonanywhere.com/mascota/' + anuncio.mascota + '/', { headers }).toPromise();

            anuncio.mascota = mascota; // Assign the "mascota" property to the ad and assign the mascot information
            anuncio.tipo = await this.getTipoAnuncio(anuncio.tipo); // Get the string representation of the ad type
            console.log(anuncio)
            if (!anuncio.isDeleted) {
              anuncios.push(anuncio);
            }
          }

          resolve(anuncios);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  async getTipoAnuncio(id: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const url = `https://luyinq.pythonanywhere.com/tipo_anuncio/${id}/`;
      const headers = new HttpHeaders({
        'Authorization': 'Token ' + localStorage.getItem('token')
      });

      this.http.get<any>(url, { headers }).subscribe(
        (response: any) => {
          resolve(response.nombre); // Return the "nombre" property of the ad type
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  async deleteAnuncio(id: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const url = `https://luyinq.pythonanywhere.com/anuncio/${id}/`;
      const headers = new HttpHeaders({
        'Authorization': 'Token ' + localStorage.getItem('token')
      });

      this.http.delete(url, { headers }).subscribe(
        () => {
          resolve(); // Resolves the promise if the deletion is successful
        },
        (error) => {
          reject(error);
        }
      );
    });
  }
  
  async deleteContacto(id: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const url = `https://luyinq.pythonanywhere.com/anuncio/${id}/`;
      const headers = new HttpHeaders({
        'Authorization': 'Token ' + localStorage.getItem('token')
      });
    
      const body = {
        contacto: null
      };
  
      this.http.put(url, body, { headers }).subscribe(
        () => {
          resolve(); // Resolves the promise if the update is successful
        },
        (error) => {
          reject(error);
        }
      );
    });
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


  editarUsuario(rut: any, data: any): Observable<any> {
    const baseUrl = 'https://luyinq.pythonanywhere.com/usuario';
    const url = `${baseUrl}/${rut}/`; // Reemplaza la URL con la ruta correspondiente para editar un usuario
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });

    return this.http.put(url, data, { headers });
  }

  editarTipoMascota(tipoMascota: any): Observable<any> {
    const baseUrl = 'https://luyinq.pythonanywhere.com';
    const url = `${baseUrl}/tipo_mascota/${tipoMascota.id}/`; // Reemplaza la URL con la ruta correspondiente para editar un tipo de mascota
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    return this.http.put(url, tipoMascota, { headers });
  }
  eliminarTipoMascota(id: string): Observable<any> {
    const baseUrl = 'https://luyinq.pythonanywhere.com';
    const url = `${baseUrl}/tipo_mascota/${id}/`; // Reemplaza la URL con la ruta correspondiente para eliminar un tipo de mascota
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    return this.http.delete(url, { headers });
  }

  agregarTipoMascota(tipoMascota: any): Observable<any> {
    const baseUrl = 'https://luyinq.pythonanywhere.com';
    const url = `${baseUrl}/tipo_mascota/`; // Reemplaza la URL con la ruta correspondiente para crear un tipo de mascota
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    return this.http.post(url, tipoMascota, { headers });
  }
  

  editarTipoAnuncio(tipoAnuncio: any): Observable<any> {
    const baseUrl = 'https://luyinq.pythonanywhere.com';
    const url = `${baseUrl}/tipo_anuncio/${tipoAnuncio.id}/`; // Reemplaza la URL con la ruta correspondiente para editar un tipo de mascota
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    return this.http.put(url, tipoAnuncio, { headers });
  }
  eliminarTipoAnuncio(id: string): Observable<any> {
    const baseUrl = 'https://luyinq.pythonanywhere.com';
    const url = `${baseUrl}/tipo_anuncio/${id}/`; // Reemplaza la URL con la ruta correspondiente para eliminar un tipo de mascota
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    return this.http.delete(url, { headers });
  }
  agregarTipoAnuncio(tipo_anuncio: any): Observable<any> {
    const baseUrl = 'https://luyinq.pythonanywhere.com';
    const url = `${baseUrl}/tipo_anuncio/`; // Reemplaza la URL con la ruta correspondiente para crear un tipo de mascota
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    return this.http.post(url, tipo_anuncio, { headers });
  }

  editarEstado(estado: any): Observable<any> {
    const baseUrl = 'https://luyinq.pythonanywhere.com';
    const url = `${baseUrl}/estado/${estado.id}/`; // Reemplaza la URL con la ruta correspondiente para editar un tipo de mascota
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    return this.http.put(url, estado, { headers });
  }
  eliminarEstado(id: string): Observable<any> {
    const baseUrl = 'https://luyinq.pythonanywhere.com';
    const url = `${baseUrl}/estado/${id}/`; // Reemplaza la URL con la ruta correspondiente para eliminar un tipo de mascota
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    return this.http.delete(url, { headers });
  }

  agregarEstado(estado: any): Observable<any> {
    const baseUrl = 'https://luyinq.pythonanywhere.com';
    const url = `${baseUrl}/estado/`; // Reemplaza la URL con la ruta correspondiente para crear un tipo de mascota
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    return this.http.post(url, estado, { headers });
  }


  editarMascota(mascota: any): Observable<any> {
    const baseUrl = 'https://luyinq.pythonanywhere.com';
    const url = `${baseUrl}/mascota/${mascota.id}/`; // Reemplaza la URL con la ruta correspondiente para editar un tipo de mascota
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    return this.http.put(url, mascota, { headers });
  }
  eliminarMascota(id: string): Observable<any> {
    const baseUrl = 'https://luyinq.pythonanywhere.com';
    const url = `${baseUrl}/mascota/${id}/`; // Reemplaza la URL con la ruta correspondiente para eliminar un tipo de mascota
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    return this.http.delete(url, { headers });
  }

  editarAnuncio(anuncio: any): Observable<any> {
    const baseUrl = 'https://luyinq.pythonanywhere.com';
    const url = `${baseUrl}/anuncio/${anuncio.id}/`; // Reemplaza la URL con la ruta correspondiente para editar un tipo de mascota
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    return this.http.put(url, anuncio, { headers });
  }
  eliminarAnuncio(id: string): Observable<any> {
    const baseUrl = 'https://luyinq.pythonanywhere.com';
    const url = `${baseUrl}/anuncio/${id}/`; // Reemplaza la URL con la ruta correspondiente para eliminar un tipo de mascota
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    return this.http.delete(url, { headers });
  }

}