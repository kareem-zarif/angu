import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-seller-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './seller-sidebar.html',
  styleUrl: './seller-sidebar.css'
})
export class SellerSidebarComponent {
} 