import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';

import { AboutUs } from "./components/about-us/about-us";
import { RegisterSelection } from "./components/register-selection/register-selection";
import { Recommendation } from "./components/recommendation/recommendation";
import { SignalrChat } from './components/signalr-chat/signalr-chat';
import { Chatbot } from './components/chatbot/chatbot';
import { Auth } from './services/auth';
// import { HttpClient } from '@microsoft/signalr';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Header, Footer, AboutUs, RegisterSelection, Recommendation, SignalrChat, Chatbot],
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

