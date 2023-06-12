import { Component, ElementRef, ViewChild, OnInit, ChangeDetectorRef, AfterViewInit, OnDestroy  } from '@angular/core';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation, Position } from '@capacitor/geolocation';
import { AppComponent } from '../app.component';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from '../../environments/environment.prod';
import { ApiService } from '../shared/api.service';
import { AlertController } from '@ionic/angular';
import { LocalNotifications, ScheduleOptions, CancelOptions, Channel } from '@capacitor/local-notifications';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';




@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements AfterViewInit, OnDestroy {
  @ViewChild('map')
  mapRef!: ElementRef<HTMLElement>;
  newMap!: GoogleMap;
  showStreetNames: boolean = true;
  showTraffic: boolean = false;
  markerId!: string;
  hasMarker: boolean = false;
  position = {
    latitude: 0,
    longitude: 0
  }
  private routerSubscription: any;
  isHomePage: boolean = false;
  markerPopup: any;
  sortedMarkers: any[] = []
  allmarkersInfo: {
    id: number;
    nombre: string;
    lat: number;
    lng: number;
    foto: string;
  }[] = [];
  circles: any[] = [];
  currentCity: string = '';
  currentPositionSubscription: any;
  gotoAnuncioButton: boolean = false;
  selectedAnnouncementId: number | null = null;
  styles = [
    {
      "elementType": "labels",
      "stylers": [
        {
          "visibility": "on" //ESTO CAMBIE PARA QUE SEA VEAN LOS NOMBRES DE LAS CALLES Y otras weas
        }
      ]
    },
    {
      "featureType": "administrative.land_parcel",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "administrative.neighborhood",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      featureType: 'water',
      elementType: 'geometry.fill',
      stylers: [
        {
          color: '#73C8FA'
        }
      ]
    },
    {
      featureType: 'landscape',
      elementType: 'geometry.fill',
      stylers: [
        {
          color: '#F2F2F2'
        }
      ]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [
        {
          color: '#85A2BF'
        },
        {
          weight: 1.5
        }
      ]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.fill',
      stylers: [
        {
          color: '#D8E6F3'
        }
      ]
    },
    {
      featureType: 'road.local',
      elementType: 'geometry.fill',
      stylers: [
        {
          color: '#9EB6C8'
        }
      ]
    },
    {
      featureType: 'poi',
      elementType: 'geometry.fill',
      stylers: [
        {
          color: '#F2F2F2',
          visibility: "off"
        }
      ]
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry.fill',
      stylers: [
        {
          color: '#D9D9D9'
        }
      ]
    },
    {
      featureType: 'transit',
      elementType: 'geometry.fill',
      stylers: [
        {
          color: '#F2F2F2'
        }
      ]
    }
  ]

  constructor(private cdr: ChangeDetectorRef, private main: AppComponent, private router: Router, private api: ApiService, private alertController: AlertController) {
    const nombre = localStorage.getItem('nombre');
    this.main.nombre = nombre !== null ? nombre : '';

    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        this.router.navigate(["/anuncio"], { queryParams: { id: notification.notification.id } });
      
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
    this.routerSubscription = this.router.events.subscribe( (event) => {
      if (event instanceof NavigationEnd) {
        this.isHomePage = (event.urlAfterRedirects === '/home');
        if (!this.isHomePage) {
          this.destroyMap(); // Destroy the map when navigating to another component
        } else {
          this.createMap(); // Recreate the map when navigating back to the page
          this.startTrackingPosition();
          // Request permission to use push notifications
          // iOS will prompt user and return if they granted permission or not
          // Android will just grant without prompting
          PushNotifications.requestPermissions().then(result => {
            if (result.receive === 'granted') {
              // Register with Apple / Google to receive push via APNS/FCM
              PushNotifications.register();
            } else {
              // Show some error
            }
          });
      
          // On success, we should be able to receive notifications
          PushNotifications.addListener('registration', (token: Token) => {
            console.log(token.value);
            this.api.saveTokenMsg(token.value).subscribe(
              response => {
                localStorage.setItem('msgToken', token.value)
                console.log(response);
              },
              error => {
                // Handle error
                console.error(error);
              }
            );
          });
      
          // Some issue with our setup and push will not work
          PushNotifications.addListener('registrationError',
            (error: any) => {
            }
          );
      
          // Show us the notification payload if the app is open on our device
          PushNotifications.addListener('pushNotificationReceived',
            (notification: PushNotificationSchema) => {
            }
          );
      
          // Method called when tapping on a notification
          PushNotifications.addListener('pushNotificationActionPerformed',
            (notification: ActionPerformed) => {
            }
          );
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

          const city = await this.getCityFromCoordinates(currentPosition);
          this.currentCity = city;
          console.log("====================CIUDAD=================")
          console.log(this.currentCity)
  
          const insideCircles = this.checkPositionInsideCircles(currentPosition);
  
          for (let i = 0; i < insideCircles.length; i++) {
            const isInsideCircle = insideCircles[i];
            const currentAnuncio = this.allmarkersInfo[i];
  
            if (isInsideCircle && currentAnuncio && !shownAlerts.has(currentAnuncio.id)) {
              console.log("Estás dentro de " + currentAnuncio.nombre);
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
    this.allmarkersInfo = [];
    this.circles = [];
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
    this.api.showLoading();
    const center = await this.getCurrentPosition();
    this.newMap = await GoogleMap.create({
      id: 'home-google-map',
      element: this.mapRef.nativeElement,
      apiKey: environment.googleMap.apiKey,
      config: {
        center: center,
        zoom: 20,
        disableDefaultUI: true,
        styles : this.styles
      },
      forceCreate: true
    });
    this.addListeners();
    await this.newMap.enableTrafficLayer(false);
    await this.newMap.enableCurrentLocation(true);
    await this.insertMarkersFromAPI(); // Insertar marcadores desde la API
    this.api.dismissLoading();
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
    const markers = await this.api.getAnuncios();
    const tiposAnuncio = await this.api.listTipoAnuncio();
    this.circles = [];
    this.allmarkersInfo = [];
  
    const markerPromises = markers.map(async (marker) => {
      if (!marker.isDeleted) {
        const lat = parseFloat(marker.posicion.latitud);
        const lng = parseFloat(marker.posicion.longitud);
        const tipo = tiposAnuncio.find((tipo) => tipo.id === marker.tipo);
        const tipoNombre = tipo ? tipo.nombre : '';
  
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
            fillColor: 'yellow',
            fillOpacity: 0.2,
            strokeColor: 'yellow',
            strokeWeight: 5,
            clickable: false
          }
        ];
  
        this.circles.push(...circles);
  
        await this.newMap.addCircles(circles);
      }
    });
  
    await Promise.all(markerPromises);
  
    this.sortMarkersByDistance();
    console.log("===========================MARCADORES=======================")
    console.log("sorted", this.sortedMarkers)
    console.log(this.allmarkersInfo)
  }
  
  sortMarkersByDistance() {
    const currentPosition = this.getCurrentPosition();
    const sortedMarkers = this.allmarkersInfo.slice().sort((a, b) => {
      const distanceA = this.calculateDistance(
        { lat: a.lat, lng: a.lng },
        currentPosition
      );
      const distanceB = this.calculateDistance(
        { lat: b.lat, lng: b.lng },
        currentPosition
      );
      
      if (distanceA < distanceB) {
        return -1;
      } else if (distanceA > distanceB) {
        return 1;
      } else {
        return 0;
      }
    });
    this.sortedMarkers = sortedMarkers;
  }
  
  
  
  
  

  gotoCrearAnuncio() {
    const queryParams = {
      latitude: this.position.latitude,
      longitude: this.position.longitude
    };

    this.router.navigate(["/anuncio-form"], { queryParams })
  }

  checkPositionInsideCircles(position: any): boolean[] {
    const insideCircles: boolean[] = [];
  
    for (const circle of this.circles) {
      const circleCenter = circle.center;
      const circleRadius = circle.radius;
      const distance = this.calculateDistance(circleCenter, position);
  
      if (distance <= circleRadius) {
        insideCircles.push(true);
      } else {
        insideCircles.push(false);
      }
    }
  
    return insideCircles;
  }
  

  calculateDistance(point1: any, point2: any): number {
    const lat1 = point1.lat;
    const lon1 = point1.lng;
    const lat2 = point2.lat;
    const lon2 = point2.lng;
  
    const R = 6371000; // Radio de la Tierra en metros (6371 km = 6371000 m)
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

  async getCityFromCoordinates(coordinates: { lat: number; lng: number }): Promise<string> {
    try {
      const { lat, lng } = coordinates;
  
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyBH7CLio51Cdf9MYSdDPk0NEu2h07ByGHM`
      );
  
      if (response.ok) {
        const data = await response.json();
        const results = data.results;
        if (results && results.length > 0) {
          const addressComponents = results[0].address_components;
          const cityComponent = addressComponents.find((component: { types: string | string[]; }) => component.types.includes('locality'));
          if (cityComponent) {
            return cityComponent.long_name;
          }
        }
      } else {
        throw new Error('Geocoding API request failed');
      }
    } catch (error) {
      console.error('Error geocoding coordinates:', error);
    }
  
    return '';
  }
  
  gotoAnuncio(anuncioId: number | null) {
    this.router.navigate(['/anuncio'], { queryParams: { id: anuncioId } });
    anuncioId = null;
  }


}
