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
  rut = localStorage.getItem('rut') || '';
  loading: boolean = true;


  constructor(private api: ApiService, public datePipe: DatePipe, private router: Router, private alertController: AlertController, private cdr: ChangeDetectorRef) { }

  ngOnInit() {}

  ionViewWillEnter() {
    this.loading = true;
    this.api.showLoading();
    this.api.getAnunciosByRut(this.rut).then(
      (response: any[]) => {
        if (response.length > 0) {
        this.anuncios = response; // Assign the response to the pets property
        console.log(response)
        this.loading = false;
        this.api.dismissLoading();
        }
      },
      (error: any) => {
        this.api.presentToast(error)
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
              this.anuncios = this.anuncios.filter((anuncio : any) => anuncio.id !== id); // Elimina el anuncio de la lista
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

}
