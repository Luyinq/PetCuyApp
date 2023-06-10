import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { InicioSesionModule } from './inicio-sesion/inicio-sesion.module';
import { FormulariosModule } from './formularios/formularios.module';
import { MenuModule } from './menu/menu.module';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { AdmincrudComponent } from './admincrud/admincrud.component';



@NgModule({
  declarations: [AppComponent, AdmincrudComponent ],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, InicioSesionModule, MenuModule, HttpClientModule, ReactiveFormsModule,FormulariosModule,
  BrowserAnimationsModule, FormsModule,  
  ToastrModule.forRoot()],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
