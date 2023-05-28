import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/shared/api.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mis-mascotas',
  templateUrl: './mis-mascotas.component.html',
  styleUrls: ['./mis-mascotas.component.scss'],
})
export class MisMascotasComponent implements OnInit {
  pets!: any[]; // Define the property to hold pet data

  constructor(private api: ApiService, private alertController: AlertController, private router : Router) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.api.getMyPets().then(
      (response: any[]) => {
        if (response.length > 0) {
        this.pets = response; // Assign the response to the pets property
        console.log(response)
        }
      },
      (error: any) => {
        this.api.presentToast(error)
      }
    );
  }

  async deletePet(pet: any) {
    const alert = await this.alertController.create({
      header: 'Eliminar Mascota',
      message: '¿Estás seguro de que deseas eliminar a ' + pet.nombre + '?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Eliminación cancelada');
          }
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.api.deletePet(pet.id).then(
              () => {
                this.api.presentToast("Mascota eliminada")
                // Actualizar la lista de mascotas después de eliminar la mascota
                this.pets = this.pets.filter((p) => p.id !== pet.id);
              },
              (error) => {
                this.api.presentToast(error)
              }
            );
          }
        }
      ]
    });
  
    await alert.present();
  }


  mascotaForm(source: string, petId?: number) {
    const isEdit = (source === 'Editar');
    this.router.navigate(['/mascota-form', { isEdit: isEdit, petId: petId}]);
  }

}
