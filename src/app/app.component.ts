import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from './shared/api.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  localStorage: Storage | undefined;
  showMenu: boolean = false;
  showAdminOptions: boolean = false;
  nombre: string | undefined;

  constructor(private router : Router)
  { }
  
  ngOnInit() {
    this.localStorage = window.localStorage;
    this.showMenu = !!this.localStorage.getItem('rut'); // Asigna el valor inicial de la variable showMenu
  }
  toggleAdminOptions() {
    this.showAdminOptions = !this.showAdminOptions;
  }

  logout() {
    this.localStorage?.clear()
    this.showMenu = false; // Actualiza el valor de la variable showMenu
    this.router.navigate(['/login']);

  }

}

