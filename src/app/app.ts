import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';




@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Header, Footer],
 templateUrl: './app.html',
  styleUrls: ['./app.css']
})

export class App {
  title = 'angu';

  constructor(private router: Router) {}

  shouldHideMainHeader(): boolean {
    return this.router.url.startsWith('/admin') || this.router.url.startsWith('/seller');
  }
}

