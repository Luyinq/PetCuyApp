import { Component, ElementRef, ViewChild, OnInit, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';
import { AppComponent } from '../app.component';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from '../../environments/environment.prod';
import { ApiService } from '../shared/api.service';
import { AlertController } from '@ionic/angular';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements AfterViewInit, OnDestroy {
  @ViewChild('map')
  mapRef!: ElementRef<HTMLElement>;
  newMap!: GoogleMap;
  markerId!: string;
  hasMarker: boolean = false;
  position = {
    latitude: 0,
    longitude: 0
  }
  private routerSubscription: any;
  isHomePage: boolean = false;
  markerPopup: any;
  allmarkersInfo: {
    id: number;
    nombre: string;
  }[] = [];


  constructor(private cdr: ChangeDetectorRef, private main: AppComponent, private router: Router, private api: ApiService, private alertController: AlertController) {
    const nombre = localStorage.getItem('nombre');
    this.main.nombre = nombre !== null ? nombre : '';
  }

  ngOnInit() {
    this.subscribeToRouterEvents();
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.unsubscribeFromRouterEvents();
  }

  subscribeToRouterEvents() {
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isHomePage = (event.urlAfterRedirects === '/home');
        if (!this.isHomePage) {
          this.destroyMap(); // Destroy the map when navigating to another component
        } else {
          this.cdr.detectChanges(); // Manually trigger change detection
          this.createMap(); // Recreate the map when navigating back to the page
        }
      }
    });
  }


  unsubscribeFromRouterEvents() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  destroyMap() {
    console.log("borrando");
    this.newMap.destroy();
    this.newMap.removeAllMapListeners(); // Agrega paréntesis aquí
    this.hasMarker = false;
    this.markerId = "";
    this.cdr.detectChanges(); // Manually trigger change detection
  }

  async getCurrentPosition() {
    const currentPosition = await Geolocation.getCurrentPosition();
    const center = {
      lat: currentPosition.coords.latitude,
      lng: currentPosition.coords.longitude,
    };
    return center;
  }

  async createMap() {
    const center = await this.getCurrentPosition();
    this.newMap = await GoogleMap.create({
      id: 'home-google-map',
      element: this.mapRef.nativeElement,
      apiKey: environment.googleMap.apiKey,
      config: {
        center: center,
        zoom: 20,
      },
    });
    this.addListeners();
    await this.newMap.enableTrafficLayer(true);
    await this.newMap.enableCurrentLocation(true);
    await this.insertMarkersFromAPI(); // Insertar marcadores desde la API
  }

  async addMarker(lat: number, lng: number) {
    if (this.markerId) {
      await this.removeMarker();
    }
    this.markerId = await this.newMap.addMarker({
      coordinate: {
        lat: lat,
        lng: lng,
      },
      draggable: false
    });
    this.hasMarker = true;
    this.cdr.detectChanges(); // Manually trigger change detection
  }

  async addListeners() {
    await this.newMap.setOnMapClickListener((event) => {
      console.log('setOnMapClickListener', event);
      this.addMarker(event.latitude, event.longitude);
      this.position = {
        latitude: event.latitude,
        longitude: event.longitude
      }
    });

    await this.newMap.setOnMarkerClickListener(async (event) => {
      console.log('setOnMarkerClickListener', event);
      await this.removeMarker();
      // Buscar en allmarkersInfo si hay un objeto con el mismo id que event.title
      const markerInfo = this.allmarkersInfo.find(marker => marker.id.toString() === event.title);
      if (markerInfo) {
        // Si se encuentra una coincidencia, mostrar el nombre del marcador
        await this.showMarkerPopup(markerInfo.nombre);
      }
    });

    await this.newMap.setOnMyLocationClickListener((event) => {
      console.log('setOnMyLocationClickListener', event);
      this.addMarker(event.latitude, event.longitude);
    });
  }

  async showMarkerPopup(title: string) {
    const alert = await this.alertController.create({
      header: 'Marker Clicked',
      message: `You clicked on marker: ${title}`,
      buttons: ['OK']
    });

    await alert.present();
  }

  async removeMarker() {
    if (this.markerId) {
      await this.newMap.removeMarker(this.markerId);
      this.markerId = '';
      this.hasMarker = false;
      this.cdr.detectChanges(); // Manually trigger change detection
    }
  }

  async insertMarkersFromAPI() {
    // Aquí debes realizar la llamada a la API para obtener los marcadores
    const markers = await this.api.getAnuncios(); // Reemplaza "tuApiObtenerMarcadores" con la llamada a tu API
    // Recorre los marcadores obtenidos y añádelos al mapa
    markers.forEach(async (marker) => {
      const lat = parseFloat(marker.posicion[0].latitud);
      const lng = parseFloat(marker.posicion[0].longitud);
      // Añade el marcador al array
      this.allmarkersInfo.push({
        id: marker.id,
        nombre: marker.mascota.nombre
      });

      await this.newMap.addMarker({
        coordinate: {
          lat: lat,
          lng: lng,
        },
        draggable: false,
        title: marker.id.toString(),
        iconUrl: marker.mascota.foto_1,
        iconSize: {
          width: 100,
          height: 100
        }
      });
      console.log(marker.posicion[0].longitud)
    });
    console.log(markers)
    console.log(this.allmarkersInfo)

  }




}
