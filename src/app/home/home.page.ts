import { Component, ElementRef, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild('map')
  mapRef!: ElementRef<HTMLElement>;
  newMap!: GoogleMap;
  markerId!: string;
  hasMarker: boolean = false;
  position = {
    latitude : 0,
    longitude : 0
  }
  

  constructor(private cdr: ChangeDetectorRef, private main: AppComponent) {
    const nombre = localStorage.getItem('nombre');
    this.main.nombre = nombre !== null ? nombre : '';
  }

  ngOnInit() {}

  ionViewDidEnter() {
    this.createMap();
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
