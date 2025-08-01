import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';
import { AboutUs } from "./components/about-us/about-us";
import { RegisterSelection } from "./components/register-selection/register-selection";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer, AboutUs, RegisterSelection],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  title = 'angu';
}
