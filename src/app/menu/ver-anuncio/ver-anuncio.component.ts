import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-ver-anuncio',
  templateUrl: './ver-anuncio.component.html',
  styleUrls: ['./ver-anuncio.component.scss'],
})
export class VerAnuncioComponent {
  anuncioId!: number;
  anuncioData: any;
  tipoAnuncioText: string = '';
  mascotaData: any;
  apiUrl = "https://luyinq.pythonanywhere.com/";


  constructor(public datePipe: DatePipe, private route: ActivatedRoute, private http: HttpClient) {}

  async ionViewWillEnter() {
    this.route.queryParams.subscribe((params) => {
      this.anuncioId = params['id'];
      this.getAnuncioData();
    });
  }
  

  async getAnuncioData() {
    const anuncioUrl = this.apiUrl + 'anuncio/' + this.anuncioId + '/';
    const headers = new HttpHeaders().set('Authorization', 'Token ' + localStorage.getItem('token'));
    
    try {
      const anuncioResponse = await this.http.get(anuncioUrl, { headers }).toPromise();
      this.anuncioData = anuncioResponse;

      this.anuncioData.tipo = await this.getTipoAnuncioText();
      this.anuncioData.mascota = await this.getMascotaData();

      console.log(this.anuncioData);
    } catch (error) {
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
  
}
