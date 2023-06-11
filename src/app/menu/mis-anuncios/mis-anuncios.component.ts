import { Component, OnInit } from '@angular/core'
import { ApiService } from 'src/app/shared/api.service'
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-mis-anuncios',
  templateUrl: './mis-anuncios.component.html',
  styleUrls: ['./mis-anuncios.component.scss'],
})
export class MisAnunciosComponent  implements OnInit {

  anuncios : any = null;
  anunciosBuscar: any = null;
  anunciosAdoptar: any = null;
  anunciosContacto: any = null;
  rut = localStorage.getItem('rut') || '';
  loading: boolean = true;
  selectedTab: string = 'buscar';
  hasAnunciosBuscar: boolean = false;
  hasAnunciosAdoptar: boolean = false;
  hasAnunciosContacto: boolean = false;



  constructor(private api: ApiService, public datePipe: DatePipe, private router: Router, private alertController: AlertController, private cdr: ChangeDetectorRef) { }

  ngOnInit() {}

  changeTab(tab: string) {
    this.selectedTab = tab;
    this.cdr.detectChanges(); // Forzar la detección de cambios
  }

  filtrarAnuncios() {
    if (this.anuncios) {
      // Limpiar las colecciones antes de filtrar
      this.anunciosBuscar = [];
      this.anunciosAdoptar = [];
      this.anunciosContacto = [];
  
      console.log(localStorage.getItem('rut')); // Check the value

      for (const anuncio of this.anuncios) {
        console.log(anuncio.contacto); // Check the value of each anuncio's contacto property
      
        if (anuncio.tipo === 'Buscar' && anuncio.autor === localStorage.getItem('rut')) {
          this.anunciosBuscar.push(anuncio);
        } else if (anuncio.tipo === 'Adoptar' && anuncio.autor === localStorage.getItem('rut')) {
          this.anunciosAdoptar.push(anuncio);
        } else if (anuncio.contacto === localStorage.getItem('rut')) {
          this.anunciosContacto.push(anuncio);
        }
      }
      
      console.log(this.anunciosContacto); // Check the filtered result
  
      if (this.selectedTab === 'buscar') {
        // Mostrar solo los anuncios de tipo "Buscar"
        console.log(this.anunciosBuscar);
      } else if (this.selectedTab === 'adoptar') {
        // Mostrar solo los anuncios de tipo "Adoptar"
        console.log(this.anunciosAdoptar);
      } else if (this.selectedTab === 'contacto') {
        console.log(this.anunciosContacto)
      }
    } 
  }
  
  
  
  

  ionViewWillEnter() {
    this.loading = true;
    this.api.showLoading();
    this.api.getAnunciosByRut(this.rut).then(
      (response: any[]) => {
        this.anuncios = response;
        console.log(response);
        this.filtrarAnuncios(); // Update hasAnunciosBuscar and hasAnunciosAdoptar
        this.loading = false;
        this.api.dismissLoading();
      },
      (error: any) => {
        this.api.presentToast(error);
        this.loading = false;
        this.api.dismissLoading();
      }
    );
  }
  

  gotoPerfil(rut : string){
    this.api.rut = rut;
    this.router.navigate(['/perfil']);
  }

  gotoAnuncio(anuncioId : number){
    this.router.navigate(['/anuncio'], { queryParams: { id: anuncioId } });  
  }

  async deleteAnuncio(id: number) {
    const alert = await this.alertController.create({
      header: '¡Cuidado!',
      message: '¿Estás seguro que deseas eliminar este anuncio?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.api.deleteAnuncio(id);
              this.anunciosBuscar = this.anunciosBuscar.filter((anuncio : any) => anuncio.id !== id); // Elimina el anuncio de la lista
              this.anunciosAdoptar = this.anunciosAdoptar.filter((anuncio : any) => anuncio.id !== id); // Elimina el anuncio de la lista
              this.cdr.detectChanges();
              this.api.presentToast("Anuncio eliminado con éxito.")
            } catch (error : any) {
              this.api.presentToast(error);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async deleteContacto(id: number) {
    const alert = await this.alertController.create({
      header: '¡Cuidado!',
      message: '¿Estás seguro que deseas eliminar este contacto?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.api.deleteContacto(id);
              let anuncioAfectado = this.anunciosBuscar.find((anuncio: any) => anuncio.id === id);
              if (anuncioAfectado) {
                // Actualizar el parámetro deseado del anuncio
                anuncioAfectado.contacto = null;
              }
              anuncioAfectado = this.anunciosAdoptar.find((anuncio: any) => anuncio.id === id);
              if (anuncioAfectado) {
                // Actualizar el parámetro deseado del anuncio
                anuncioAfectado.contacto = null;
              }
              anuncioAfectado = this.anunciosContacto.find((anuncio: any) => anuncio.id === id);
              if (anuncioAfectado) {
                // Actualizar el parámetro deseado del anuncio
                anuncioAfectado.contacto = null;
              }
              this.cdr.detectChanges();
              this.api.presentToast("Contacto eliminado con éxito.");
            } catch (error: any) {
              this.api.presentToast(error);
            }
          },
        },
      ],
    });
    await alert.present();
  }


}
