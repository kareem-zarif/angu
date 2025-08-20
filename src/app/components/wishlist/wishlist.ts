import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Rating } from '../rating/rating/rating';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../environment/environment';
import { IProduct, ShippingTypes } from '../../models/i-product';
import { Subscription } from 'rxjs';
import { WishlistService } from '../../services/wishlistService';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterModule, CommonModule, Rating, TranslateModule],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WishlistComponent implements OnInit, OnDestroy {
  wishlist: IProduct[] = [];
  shippingTypes = ShippingTypes;
  toastMessage: string | null = null;
  baseImgUrl = environment.imgUrl;
  private subscription: Subscription | null = null;
  isLoading = false;

  /**
   * Creates an instance of WishlistComponent.
   *
   * @param {WishlistService} wishlistService - The service to interact with the wishlist.
   * @param {Router} router - The router used to navigate to different pages.
   */
  constructor(
    private wishlistService: WishlistService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadWishlist();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private loadWishlist(): void {
    this.isLoading = true;
    this.subscription = this.wishlistService.getWishlistObservable().subscribe({
      next: (products) => {
        this.wishlist.length = 0; // Clear array without changing reference
        this.wishlist.push(...(products?.filter(p => p && p.id) || []));
        console.log('✅ Wishlist loaded:', this.wishlist);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('❌ Error loading wishlist:', error);
        this.showToast('Failed to load wishlist');
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  trackByProductId(index: number, product: IProduct): string {
    return product.id;
  }

  navigateToProduct(productId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!productId) {
      console.error('Invalid product ID');
      return;
    }

    this.router.navigate(['/products', productId])
      .then(() => console.log('Navigation successful'))
      .catch(err => console.error('Navigation failed:', err));
  }



  removeFromWishlist(product: IProduct): void {
    this.wishlistService.removeFromWishlist(product.id);
    this.showToast(`${product.name} removed from wishlist`);
  }

  clearWishlist(): void {
    if (confirm('Are you sure you want to clear your wishlist?')) {
      this.wishlistService.clearWishlist();
      this.showToast('Wishlist cleared');
    }
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    setTimeout(() => {
      this.toastMessage = null;
      this.cdr.markForCheck();
    }, 3000);
  }
}
