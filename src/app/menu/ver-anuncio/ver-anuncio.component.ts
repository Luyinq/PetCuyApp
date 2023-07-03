import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/shared/api.service';
import { ChangeDetectorRef } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-ver-anuncio',
  templateUrl: './ver-anuncio.component.html',
  styleUrls: ['./ver-anuncio.component.scss'],
})
export class VerAnuncioComponent {
  anuncioId!: number;
  anuncioData: any = null;
  tipoAnuncioText: string = '';
  apiUrl = "https://luyinq.pythonanywhere.com/";
  loading: boolean = true;


  constructor(private alertController: AlertController, private cdr: ChangeDetectorRef, public datePipe: DatePipe, private route: ActivatedRoute, private http: HttpClient, private router: Router, private api: ApiService) { }

  async ionViewWillEnter() {
    this.route.queryParams.subscribe((params) => {
      this.anuncioId = params['id'];
      if (this.anuncioData == null) {
        this.getAnuncioData();
      }
    });
  }


  async getAnuncioData() {
    this.loading = true;
    this.api.showLoading();
    const anuncioUrl = this.apiUrl + 'anuncio/' + this.anuncioId + '/';
    const headers = new HttpHeaders().set('Authorization', 'Token ' + localStorage.getItem('token'));

    try {
      const anuncioResponse = await this.http.get(anuncioUrl, { headers }).toPromise();
      this.anuncioData = anuncioResponse;

      this.anuncioData.tipo = await this.getTipoAnuncioText();
      this.anuncioData.mascota = await this.getMascotaData();
      this.anuncioData.mascota.tipo = await this.getTipoMascotaText();
      this.anuncioData.estado = await this.getEstadoText();
      this.anuncioData.autorData = await this.getAutorData();

      console.log(this.anuncioData);
      this.loading = false;
      this.api.dismissLoading();
    } catch (error) {
      this.loading = false;
      this.api.dismissLoading();
      console.error('Error al obtener datos del anuncio:', error);
    }
  }

  async getTipoAnuncioText() {
    const tipoAnuncioUrl = this.apiUrl + 'tipo_anuncio/' + this.anuncioData.tipo + '/';
    const headers = new HttpHeaders().set('Authorization', 'Token ' + localStorage.getItem('token'));

    try {
      const tipoAnuncioResponse: any = await this.http.get(tipoAnuncioUrl, { headers }).toPromise();
      return tipoAnuncioResponse?.nombre ?? '';
    } catch (error) {
      console.error('Error al obtener texto del tipo de anuncio:', error);
      return ''; // Devuelve un valor por defecto en caso de error
    }
  }

  async getMascotaData() {
    const mascotaUrl = this.apiUrl + 'mascota/' + this.anuncioData.mascota + '/';
    const headers = new HttpHeaders().set('Authorization', 'Token ' + localStorage.getItem('token'));

    try {
      const mascotaResponse = await this.http.get(mascotaUrl, { headers }).toPromise();
      return mascotaResponse;
    } catch (error) {
      console.error('Error al obtener datos de la mascota:', error);
      return null; // Devuelve un valor por defecto en caso de error
    }
  }

  async getTipoMascotaText() {
    const tipoMascotaUrl = this.apiUrl + 'tipo_mascota/' + this.anuncioData.mascota.tipo + '/';
    const headers = new HttpHeaders().set('Authorization', 'Token ' + localStorage.getItem('token'));

    try {
      const tipoMascotaResponse: any = await this.http.get(tipoMascotaUrl, { headers }).toPromise();
      return tipoMascotaResponse?.nombre ?? '';
    } catch (error) {
      console.error('Error al obtener texto del tipo de mascota:', error);
      return ''; // Devuelve un valor por defecto en caso de error
    }
  }

  async getEstadoText() {
    const estadoUrl = this.apiUrl + 'estado/' + this.anuncioData.estado + '/';
    const headers = new HttpHeaders().set('Authorization', 'Token ' + localStorage.getItem('token'));

    try {
      const estadoResponse: any = await this.http.get(estadoUrl, { headers }).toPromise();
      return estadoResponse?.nombre ?? '';
    } catch (error) {
      console.error('Error al obtener texto del estado:', error);
      return ''; // Devuelve un valor por defecto en caso de error
    }
  }

  async getAutorData() {
    const anuncioUrl = this.apiUrl + 'usuario/' + this.anuncioData.autor + '/';
    const headers = new HttpHeaders().set('Authorization', 'Token ' + localStorage.getItem('token'));

    try {
      const autorResponse = await this.http.get(anuncioUrl, { headers }).toPromise();
      return autorResponse
    } catch (error) {
      return '';
    }
  }

  checkContactoEmpty() {
    return (this.anuncioData.contacto === null)
  }

  checkAutor() {
    return (localStorage.getItem('rut') === this.anuncioData.autor)
  }

  checkContacto() {
    return (localStorage.getItem('rut') === this.anuncioData.contacto)
  }

  generateContacto() {
    const contactoUrl = this.apiUrl + 'anuncio/' + this.anuncioData.id + '/';
    const headers = new HttpHeaders().set('Authorization', 'Token ' + localStorage.getItem('token'));
    const contactoData = { contacto: localStorage.getItem('rut') };
    const title = "¡Buenas noticias!"
    const body = "Alguien está interesado en el anuncio de " + this.anuncioData.mascota.nombre

    this.http.put(contactoUrl, contactoData, { headers }).subscribe(
      async (response) => {
        console.log('Contacto actualizado:', response);
        this.cdr.detectChanges();
        // Llamar a la función sendMessageWithFCM después de actualizar el contacto
        try {
          await this.api.sendMessageWithFCM(this.anuncioData.autorData.msgToken, title, body);
          this.gotoPerfil();
          this.anuncioData = null;
        } catch (error) {
          console.log('Error al enviar el mensaje con FCM:');
        }
      },
      (error) => {
        console.log('Error al actualizar el contacto:', error);
      }
    );
  }


  gotoPerfil() {
    this.api.rut = this.anuncioData.autor
    this.router.navigate(['/perfil']);
  }

  async showReportDialog() {
    const alert = await this.alertController.create({
      header: 'Reportar anuncio',
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
          handler: async (data: any) => {
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
              template_id: 'template_2n43fdj',
              user_id: 'Eau8rw_Idn5Y_gJJY',
              template_params: {
                problem: reportSubject,
                from_rut: localStorage.getItem('rut'),
                problem_rut: this.anuncioData.autorData.rut,
                problem_anuncio: this.anuncioData.id,
                message: reportReason
              },
            };

            try {
              const response = await this.http.post('https://api.emailjs.com/api/v1.0/email/send', emailData, { responseType: 'text' }).toPromise();
              console.log('EmailJS Response:', response);
              this.api.presentToast("Reporte enviado con éxito")
            } catch (error: any) {
              console.error('EmailJS Error:', error);
              this.api.presentToast("Ha ocurrido un error, " + error.message)
            }

            return true; // Add this return statement
          },
        },
      ],
    });

    await alert.present();
  }


}
