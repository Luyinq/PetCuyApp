import { Component, ElementRef, ViewChild, OnInit, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';
import { AppComponent } from '../app.component';
import { NavigationEnd, Router } from '@angular/router';


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
    latitude : 0,
    longitude : 0
  }
  private routerSubscription: any;
  isHomePage: boolean = false;


  constructor(private cdr: ChangeDetectorRef, private main: AppComponent, private router: Router) {
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
      apiKey: "AIzaSyBH7CLio51Cdf9MYSdDPk0NEu2h07ByGHM",
      config: {
        center: center,
        zoom: 20,
      },
    });
    this.addListeners();
    await this.newMap.enableTrafficLayer(true);
    await this.newMap.enableCurrentLocation(true);
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
    console.log(this.position)
    this.cdr.detectChanges(); // Manually trigger change detection
  }

  async addListeners() {
    await this.newMap.setOnMapClickListener((event) => {
      console.log('setOnMapClickListener', event);
      this.addMarker(event.latitude, event.longitude);
      this.position = {
        latitude : event.latitude,
        longitude : event.longitude
      }
    });

    await this.newMap.setOnMarkerClickListener((event) => {
      console.log('setOnMarkerClickListener', event);
      this.removeMarker();
    });

    await this.newMap.setOnMyLocationClickListener((event) => {
      console.log('setOnMyLocationClickListener', event);
      this.addMarker(event.latitude, event.longitude);
    });
  }

  async removeMarker() {
    if (this.markerId) {
      await this.newMap.removeMarker(this.markerId);
      this.markerId = '';
      this.hasMarker = false;
      this.cdr.detectChanges(); // Manually trigger change detection
    }
  }
  
}
