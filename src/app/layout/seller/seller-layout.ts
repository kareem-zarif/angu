import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SellerHeaderComponent } from './seller-header';
import { SellerSidebarComponent } from './seller-sidebar';

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [RouterOutlet, SellerHeaderComponent, SellerSidebarComponent],
  templateUrl: './seller-layout.html',
  styleUrl: './seller-layout.css'
})
export class SellerLayoutComponent {
} 