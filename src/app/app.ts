import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';

import { Auth } from './services/auth';
// import { HttpClient } from '@microsoft/signalr';
import { MatIconModule } from '@angular/material/icon';  // 👈 ضيف الاستيراد


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Header, Footer,MatIconModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})

export class App implements OnInit {
  title = 'angu';

  constructor(
    private router: Router,
    private authService: Auth
  ) { }
  ngOnInit() {
    // Load user from localStorage on app start
    this.authService.loadCurrentUserFromStorage();
  }
  shouldHideMainHeader(): boolean {
    return this.router.url.startsWith('/admin') || this.router.url.startsWith('/seller');
  }
}

