import { Component, ElementRef, ViewChild, OnInit, ChangeDetectorRef, AfterViewInit, OnDestroy, Renderer2  } from '@angular/core';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation, Position } from '@capacitor/geolocation';
import { AppComponent } from '../app.component';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from '../../environments/environment.prod';
import { ApiService } from '../shared/api.service';
import { AlertController } from '@ionic/angular';
import { LocalNotifications, ScheduleOptions, CancelOptions, Channel } from '@capacitor/local-notifications';



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
    lat: number;
    lng: number;
    foto: string;
  }[] = [];
  circles: any[] = [];
  currentPositionSubscription: any;
  gotoAnuncioButton: boolean = false;
  selectedAnnouncementId: number | null = null;


  constructor(private renderer: Renderer2, private cdr: ChangeDetectorRef, private main: AppComponent, private router: Router, private api: ApiService, private alertController: AlertController) {
    const nombre = localStorage.getItem('nombre');
    this.main.nombre = nombre !== null ? nombre : '';

    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        this.api.rut = notification.notification.id.toString()
        this.router.navigate(["/perfil"]);
      
    });
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
          this.createMap(); // Recreate the map when navigating back to the page
          this.startTrackingPosition();
        }
      }
    });
  }

  async startTrackingPosition() {
    const positionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000,
    };

    const shownAlerts = new Set<number>(); // Conjunto para almacenar los IDs de los anuncios con alertas mostradas

    this.currentPositionSubscription = Geolocation.watchPosition(
      positionOptions,
      async (position: Position | null) => {
        if (position) {
          const currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          const isInsideCircle = this.checkPositionInsideCircles(currentPosition);
          if (isInsideCircle) {
            const currentAnuncio = this.findMarkerByPosition(currentPosition);
            if (currentAnuncio && !shownAlerts.has(currentAnuncio.id)) {
              console.log(  currentAnuncio)
              shownAlerts.add(currentAnuncio.id);
              this.showNotification(currentAnuncio.id, "¡ALERTA!", "Estás dentro de la zona de " + currentAnuncio.nombre);
            }
          }
        }
      }
    );
  }

  findMarkerByPosition(position: any): any {
    for (const marker of this.allmarkersInfo) {
      const markerPosition = {
        lat: marker.lat,
        lng: marker.lng,
      };
      const distance = this.calculateDistance(markerPosition, position);
      const radius = 100; // El mismo radio utilizado en la función checkPositionInsideCircles

      if (distance <= radius) {
        return marker;
      }
    }

    return null;
  }

  stopTrackingPosition() {
    if (this.currentPositionSubscription) {
      this.currentPositionSubscription.unsubscribe();
    }
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
    this.allmarkersInfo.splice(0, this.allmarkersInfo.length);
    this.circles.splice(0, this.circles.length);
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
        disableDefaultUI: true,
      },
      forceCreate: true
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
    this.gotoAnuncioButton = false;
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
      console.log(this.position)
    });

    await this.newMap.setOnMarkerClickListener(async (event) => {
      console.log('setOnMarkerClickListener', event);
      
      if (this.markerId) {
        await this.removeMarker();
      } else {
        // Buscar en allmarkersInfo si hay un objeto con el mismo id que event.title
        const markerInfo = this.allmarkersInfo.find(marker => marker.lat === event.latitude && marker.lng === event.longitude);
        if (markerInfo) {
          // Perform actions related to markerInfo        
        // Other actions when markerId is empty
        this.gotoAnuncioButton = true;
        this.selectedAnnouncementId = markerInfo.id
        this.cdr.detectChanges();
        }
      }
    });

    await this.newMap.setOnMyLocationClickListener((event) => {
      console.log('setOnMyLocationClickListener', event);
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
    // Aquí debes realizar la llamada a la API para obtener los tipos de anuncio
    const tiposAnuncio = await this.api.listTipoAnuncio(); // Reemplaza con tu llamada a la API para obtener los tipos de anuncio
  
    // Recorre los marcadores obtenidos y añádelos al mapa
    markers.forEach(async (marker) => {
      const lat = parseFloat(marker.posicion.latitud);
      const lng = parseFloat(marker.posicion.longitud);
      // Buscar el nombre del tipo basado en el id
      const tipo = tiposAnuncio.find((tipo) => tipo.id === marker.tipo);
      const tipoNombre = tipo ? tipo.nombre : ''; // Obtener el nombre del tipo si se encontró, o una cadena vacía si no se encontró
      
  
      await this.newMap.addMarker({
        coordinate: {
          lat: lat,
          lng: lng,
        },
        draggable: false,
        title: tipoNombre + " - " + marker.mascota.nombre,
        iconSize: {
          width: 100,
          height: 100
        },
        iconAnchor: {
          x: 50,
          y: 50
        },
        snippet: marker.descripcion,
      });
  
      this.allmarkersInfo.push({
        id: marker.id,
        nombre: marker.mascota.nombre,
        lat: lat,
        lng: lng,
        foto: marker.mascota.foto_1
      });
  
      const circles = [
        {
          center: { lat: lat, lng: lng },
          radius: 100,
          fillColor: 'blue',
          fillOpacity: 0.1,
          strokeColor: 'blue',
          strokeWeight: 1,
          clickable: false
        }
      ];
  
      this.circles = circles;
  
      await this.newMap.addCircles(circles);
    });
  
    console.log(markers);
    console.log(this.allmarkersInfo);
  }
  
  

  gotoCrearAnuncio() {
    const queryParams = {
      latitude: this.position.latitude,
      longitude: this.position.longitude
    };

    this.router.navigate(["/anuncio-form"], { queryParams })
  }

  checkPositionInsideCircles(position: any): boolean {
    for (const circle of this.circles) {
      const circleCenter = circle.center;
      const circleRadius = circle.radius;
      const distance = this.calculateDistance(circleCenter, position);

      if (distance <= circleRadius) {
        return true;
      }
    }

    return false;
  }

  calculateDistance(point1: any, point2: any): number {
    const lat1 = point1.lat;
    const lon1 = point1.lng;
    const lat2 = point2.lat;
    const lon2 = point2.lng;

    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }


  async showNotification(id: number, title: string, body: string) {
    let options: ScheduleOptions = {
      notifications: [
        {
          id: id,
          title: title,
          body: body ,
        }
      ]
    }

    try {
      await LocalNotifications.schedule(options)
    }
    catch (ex) {

    }
  }

  gotoAnuncio(anuncioId: number | null) {
    this.router.navigate(['/anuncio'], { queryParams: { id: anuncioId } });
    anuncioId = null;
  }


}
