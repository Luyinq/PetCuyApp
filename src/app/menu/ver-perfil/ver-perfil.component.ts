import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiService } from 'src/app/shared/api.service';
import { Observable } from 'rxjs';
import { AlertController } from '@ionic/angular';
import { ModalController } from '@ionic/angular';


@Component({
  selector: 'app-ver-perfil',
  templateUrl: './ver-perfil.component.html',
  styleUrls: ['./ver-perfil.component.scss']
})
export class VerPerfilComponent implements OnInit {
  usuario: any; // Supongamos que tienes una propiedad para almacenar los datos del usuario
  tieneReputacion: boolean = false;
  canVote: boolean = false;
  repPromedio: number = 0;
  repTotales: number = 0;
  puntuacion: number = 0; // Propiedad para almacenar la puntuación seleccionada
  stars = [
    { isActive: false, value: 1.0 },
    { isActive: false, value: 2.0 },
    { isActive: false, value: 3.0 },
    { isActive: false, value: 4.0 },
    { isActive: false, value: 5.0 },
  ];


  constructor(private modalController: ModalController, private alertController: AlertController, private http: HttpClient, private api: ApiService) { }

  ngOnInit() {
  }

  async presentRatingAlert() {
    const alert = await this.alertController.create({
      header: 'Cambiar puntuación',
      message: `¿Deseas cambiar tu puntuación a ${this.puntuacion} estrellas?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Cancelado');
          }
        },
        {
          text: 'Cambiar',
          handler: () => {
            // Aquí puedes realizar la lógica para cambiar la puntuación
            this.submitRating(); // Llama al método para enviar la calificación
          }
        }
      ]
    });
  
    await alert.present();
  }
  
  rate(starValue: number) {
    if (this.puntuacion !== starValue) {
      this.stars.forEach((star) => (star.isActive = star.value <= starValue));
      this.puntuacion = starValue;
      this.presentRatingAlert(); // Muestra el alert solo si la calificación es distinta
    }
  }
  
  submitRating() {
    const evaluador = localStorage.getItem('rut');
    const usuario = this.api.rut;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    const url = 'https://luyinq.pythonanywhere.com/reputacion/';
  
    this.checkIfAlreadyRate().then((reputacionID) => {
      if (reputacionID) {
        const putUrl = url + reputacionID + '/';
        const putData = {
          puntuacion: this.puntuacion
        };
  
        this.http.put(putUrl, putData, { headers: headers }).subscribe(
          (response: any) => {
            console.log('Calificación actualizada:', response);
            this.api.presentToast("Calificación actualizada con éxito")
          },
          (error) => {
            console.error('Error al actualizar la calificación:', error);
          }
        );
      } else {
        // Si no has calificado previamente al usuario, hacer una solicitud POST
        const postData = {
          usuario: usuario,
          evaluador: evaluador,
          puntuacion: this.puntuacion
        };
  
        this.http.post(url, postData, { headers: headers }).subscribe(
          (response: any) => {
            console.log('Calificación enviada:', response);
            this.api.presentToast("Calificación enviada con éxito")
          },
          (error) => {
            console.error('Error al enviar la calificación:', error);
          }
        );
      }
    }).catch((error) => {
      console.error('Error al verificar la calificación:', error);
    });
  }

  ionViewWillEnter() {
    this.puntuacion = 0;
    this.tieneReputacion = false;
    this.canVote = false;
    this.obtenerDatosUsuario(this.api.rut);
    this.getRep();
    this.checkIfCanRate().then((canRate) => {
      if (canRate) {
        this.canVote = true;
      }
    }).catch((error) => {
      console.error('Error al verificar el match', error);
    });
  
    // Verificar si ya has enviado una calificación anteriormente
    this.checkIfAlreadyRate().then((reputacionID) => {
      if (reputacionID) {
        // Obtener la calificación actual y llenar las estrellas
        this.getRating(reputacionID);
      }
    }).catch((error) => {
      console.error('Error al verificar la calificación:', error);
    });
  }

  obtenerDatosUsuario(rut: string) {
    if (rut.length != 0) {
      const url = `https://luyinq.pythonanywhere.com/usuario/` + rut + '/';
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Token ' + localStorage.getItem('token')
      });

      this.http.get(url, { headers: headers }).subscribe(
        (response: any) => {
          this.usuario = response; // Supongamos que la respuesta contiene todos los datos del usuario
          // Asegúrate de que los campos existan en la respuesta antes de asignarlos
          this.usuario.nombre = response.nombre;
          this.usuario.apellido = response.apellido;
          this.usuario.celular = response.celular;
          this.usuario.correo = response.correo;
          this.usuario.foto = response.foto;
          console.log(response)
        },
        (error) => {
          console.log('Error al obtener los datos del usuario:', error);
        }
      );
    }
  }

  get storedCelular(): string {
    return localStorage.getItem('celular') || '';
  }

  get storedRut(): string {
    return localStorage.getItem('rut') || '';
  }

  get storedCorreo(): string {
    return localStorage.getItem('correo') || '';
  }

  getRep() {
    const usuario = this.api.rut;
    const url = 'https://luyinq.pythonanywhere.com/reputacion/?usuario=' + usuario;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });

    this.http.get(url, { headers: headers }).subscribe(
      (response: any) => {
        if (response.length != 0) {
          this.repPromedio = response[0].promedio
          this.repTotales = response.length
          this.tieneReputacion = true; // Tiene reputación
        } else {
          this.tieneReputacion = false; // No tiene reputación
        }
      },
      (error) => {
        console.log('Error al obtener la reputación:', error);
      }
    );
  }


  checkIfCanRate(): Promise<boolean> {
    const autor = localStorage.getItem('rut');
    const contacto = this.api.rut;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    const url = 'https://luyinq.pythonanywhere.com/anuncio/?contacto=' + contacto + '&autor=' + autor;
  
    return new Promise<boolean>((resolve, reject) => {
      this.http.get(url, { headers: headers }).subscribe(
        (response: any) => {
          // Verificar si la respuesta contiene algún dato
          if (response && response.length > 0) {
            // El usuario ha calificado previamente al otro usuario en un anuncio
            resolve(true);
          } else {
            // El usuario no ha calificado al otro usuario en un anuncio
            resolve(false);
          }
        },
        (error) => {
          console.log('Error al verificar la calificación:', error);
          reject(error);
        }
      );
    });
  }

  checkIfAlreadyRate(): Promise<number> {
    const evaluador = localStorage.getItem('rut');
    const usuario = this.api.rut;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
    const url = 'https://luyinq.pythonanywhere.com/reputacion/?usuario=' + usuario + '&evaluador=' + evaluador;

    return new Promise<number>((resolve, reject) => {
      this.http.get(url, { headers: headers }).subscribe(
        (response: any) => {
          if (response && response.length > 0) {
            resolve(response[0].id);
          } else {
            resolve(0);
          }
        },
        (error) => {
          console.log('Error al verificar la calificación:', error);
          reject(error);
        }
      );
    });
  }

  getRating(reputacionID: number) {
    const url = 'https://luyinq.pythonanywhere.com/reputacion/' + reputacionID + '/';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + localStorage.getItem('token')
    });
  
    this.http.get(url, { headers: headers }).subscribe(
      (response: any) => {
        const puntuacion = response.puntuacion;
  
        // Llenar las estrellas en base a la calificación
        this.stars.forEach((star) => (star.isActive = star.value <= puntuacion));
        this.puntuacion = puntuacion;
      },
      (error) => {
        console.error('Error al obtener la calificación:', error);
      }
    );
  }

  async showReportDialog() {
    const alert = await this.alertController.create({
      header: 'Reportar usuario',
      inputs: [
        {
          name: 'subject',
          type: 'text',
          placeholder: 'Asunto',
        },
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Escribe el motivo aquí',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Enviar',
          handler: async (data) => {
            const reportSubject = data.subject;
            const reportReason = data.reason;
          
            // Perform validation
            if (!reportSubject || !reportReason) {
              // Show an error message if any of the fields are empty
              const validationAlert = await this.alertController.create({
                header: 'Error',
                message: 'Por favor, complete todos los campos.',
                buttons: ['Aceptar'],
              });
              await validationAlert.present();
              return false;
            }

            await alert.dismiss(); // Cerrar el alert después de enviar el reporte
          
            // Handle the report submission here (e.g., send to the server, show a confirmation message, etc.)
            console.log('Report Subject:', reportSubject);
            console.log('Report Reason:', reportReason);
          
            // Send the report via EmailJS
            const emailData = {
              service_id: 'service_dsjj87h',
              template_id: 'template_ikdeklb',
              user_id: 'Eau8rw_Idn5Y_gJJY',
              template_params: {
                problem: reportSubject,
                from_rut: localStorage.getItem('rut'),
                problem_rut: this.usuario.rut,
                message: reportReason
              },
            };
          
            try {
              const response = await this.http.post('https://api.emailjs.com/api/v1.0/email/send', emailData, { responseType: 'text' }).toPromise();
              console.log('EmailJS Response:', response);
              this.api.presentToast("Reporte enviado con éxito")
            } catch (error:any) {
              console.error('EmailJS Error:', error);
              this.api.presentToast("Ha ocurrido un error, "+ error.message)
            }
          
            return true; // Add this return statement
          },
        },
      ],
    });
  
    await alert.present();
  }
  


}