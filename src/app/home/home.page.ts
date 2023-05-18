import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';



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

  constructor() {}

  ngOnInit() {}
  


  ionViewDidEnter() {
    console.log("A inicializar el mapa")
    this.createMap();
  }

  async getCurrentPosition(){
    const currentPosition = await Geolocation.getCurrentPosition()
    const center = {
      lat: currentPosition.coords.latitude,
      lng: currentPosition.coords.longitude,
    };
    return center;
  }

  async createMap() {
    const center = await this.getCurrentPosition();
    this.newMap = await GoogleMap.create({
      id: 'home-goole-map',
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

  async addMarker(lat: number, lng: number){
    this.markerId = await this.newMap.addMarker({
      coordinate: {
        lat: lat,
        lng: lng,
      },
      draggable: false
    })
  }

  async addListeners(){

    await this.newMap.setOnMapClickListener((event) => {
      console.log('setOnMapClickListener', event);
      this.addMarker(event.latitude, event.longitude);
    })

    await this.newMap.setOnMarkerClickListener((event) => {
      console.log('setOnMarkerClickListener', event);
      this.removeMarker(event.markerId);
    })

    await this.newMap.setOnMyLocationClickListener((event) => {
      console.log('setOnMyLocationClickListener', event);
      this.addMarker(event.latitude, event.longitude);
    })
  }

  async removeMarker(id?: string) {
    await this.newMap.removeMarker(id ? id : this.markerId);
  }

  

}
