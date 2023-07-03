import { Injectable } from '@angular/core';
import * as Pubnub from 'pubnub';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class PubnubService {
  pubnub: any;

  constructor() {

    this.pubnub = new Pubnub({
      publishKey: environment.pubNub.publishKey,
      subscribeKey: environment.pubNub.subscribeKey,
      userId: localStorage.getItem('rut') || '',
    });

   /* const listener = {
      status: (statusEvent: { category: string }) => {
        if (statusEvent.category === "PNConnectedCategory") {
          console.log("Connected");
        }
      },
      message: (message: any) => {
        console.log(message)
        if (message.message.tipo === "Agregar"){
        }
      },
    };
    
    this.pubnub.addListener(listener);
    this.pubnub.subscribe({
      channels: ["Map"]
    }); */
  }

  getUuid() {
    const UUID = this.pubnub.getUUID();
    console.log(UUID)
  }

   sendMessage(tipo: string, data: string) {
    var publishPayload = {
      channel : "Map",
      message: {
          tipo: tipo,
          data: data
      }
  }
  
  this.pubnub.publish(publishPayload, function(status: any, response: any) {
      console.log(status, response);
  })
  }

}



