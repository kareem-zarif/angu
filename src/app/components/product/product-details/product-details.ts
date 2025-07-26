import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { IProduct } from '../../../models/i-product';
import { ProductService } from '../../../services/product-service';
import { Rating } from '../../rating/rating/rating';
import { WishlistService } from '../../../services/wishlist';
import { CartService } from '../../../services/cart.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, Rating, FormsModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
  providers: [ProductService] // for lazy loading
})
export class ProductDetails implements OnInit, OnDestroy {
  product: IProduct | null = null;
  loading: boolean = true;
  error: string | null = null;
  selectedImageIndex: number = 0;
  quantity: number = 1;
  private subscription: Subscription | null = null;

  // Dynamic breadcrumbs
  breadcrumbs: { label: string, link?: string }[] = [
    { label: 'Home', link: '/' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private wishlistService: WishlistService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.subscription = this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadProduct(id);
      } else {
        this.error = 'Product ID not provided';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.error = null;

    try {
      const product = this.productService.getByIdDummy(id);
      if (product) {
        this.product = product;
        this.selectedImageIndex = 0;
        this.generateBreadcrumbs(product);
      } else {
        this.error = 'Product not found';
      }
    } catch (err) {
      this.error = 'Error loading product';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  generateBreadcrumbs(product: IProduct): void {
    // Reset breadcrumbs
    this.breadcrumbs = [
      { label: 'Home', link: '/' },
      { label: 'Products', link: '/products' }
    ];

    // Add category based on subCategoryId
    const categoryMap: { [key: string]: { category: string, subcategory: string } } = {
      'sub-elastic-01': { category: 'Textiles', subcategory: 'Elastics' },
      'sub-linning-02': { category: 'Materials', subcategory: 'Linnings' },
      'sub-steel-03': { category: 'Metals', subcategory: 'Steels' },
      'plastics': { category: 'Materials', subcategory: 'Plastics' },
      'steels': { category: 'Metals', subcategory: 'Steels' },
      'aluminum': { category: 'Metals', subcategory: 'Aluminum' }
    };

    const categoryInfo = categoryMap[product.subCategoryId] || {
      category: 'Category',
      subcategory: product.subCategoryId
    };

    // Add category
    this.breadcrumbs.push({
      label: categoryInfo.category,
      link: `/products?category=${categoryInfo.category.toLowerCase()}`
    });

    // Add subcategory
    this.breadcrumbs.push({
      label: categoryInfo.subcategory,
      link: `/products?subcategory=${product.subCategoryId}`
    });

    // Add product name
    this.breadcrumbs.push({ label: product.name });
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  calculateDiscountPercentage(original: number, discounted: number): number {
    if (!original || !discounted || original <= 0) return 0;
    return Math.round(((original - discounted) / original) * 100);
  }

  addToCart(): void {
    if (!this.product) return;

    this.cartService.addToCart(this.product, this.quantity);

    // Navigate to cart page
    this.router.navigate(['/cart']);
  }

  incrementQuantity(): void {
    this.quantity++;
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  calculatePrice(): number {
    if (!this.product) return 0;

    if (this.quantity >= 100 && this.product.pricePer100Piece) {
      return this.product.pricePer100Piece * this.quantity;
    } else if (this.quantity >= 50 && this.product.pricePer50Piece) {
      return this.product.pricePer50Piece * this.quantity;
    } else {
      return (this.product.pricePerPiece || 0) * this.quantity;
    }
  }

  toggleWishlist(): void {
    if (!this.product) return;

    if (this.isInWishlist()) {
      this.wishlistService.removeFromWishlist(this.product.id);
    } else {
      this.wishlistService.addToWishlist(this.product);
    }
  }

  isInWishlist(): boolean {
    if (!this.product) return false;
    return this.wishlistService.isInWishlist(this.product.id);
  }

  getShippingText(shipping: string): string {
    switch (shipping) {
      case 'Free':
        return 'free for all';
      case 'FreeINSameGovernate':
        return 'free for same governate';
      case 'Paid':
        return 'paid shipping';
      default:
        return shipping;
    }
  }

  // Format warranty display
  formatWarranty(months: number | null | undefined): string {
    if (!months) return '0 months';

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years > 0 && remainingMonths > 0) {
      return `${years} year${years > 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else {
      return `${months} month${months > 1 ? 's' : ''}`;
    }
  }
}
