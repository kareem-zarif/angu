import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./layout/header/header";
import { Footer } from "./layout/footer/footer";
import { Cart } from "./components/cart/cart";
import { Recommendation } from "./components/recommendation/recommendation";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, Cart, Recommendation],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('angu');
}
