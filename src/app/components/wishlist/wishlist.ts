import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wishlist.html',
  styleUrls: ['./wishlist.css']
})
export class WishlistComponent {
  toastMessage: string | null = null;
  wishlist: any[] = [];
  filteredWishlist: any[] = [];

  setRatingFilter(rating: number | null) {}
  setWarrantyFilter(warranty: number | null) {}
  setShippingFilter(shipping: string | null) {}
  clearWishlist() {}
  removeFromWishlist(id: string) {}
}