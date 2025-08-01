import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService } from '../../../services/product-service';
import { WishlistService } from '../../../services/wishlist';
import { CartService } from '../../../services/cart.service';
import { SupplierService } from '../../../services/supplier.service';
import { IProduct, ShippingTypes } from '../../../models/i-product';
import { Rating } from '../../rating/rating/rating';
import { TranslateModule } from '@ngx-translate/core';
import { SubCategoryService } from '../../../services/sub-category.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, Rating, FormsModule, TranslateModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css'
})
export class ProductDetails implements OnInit, OnDestroy {
  product: IProduct | null = null;
  loading: boolean = true;
  error: string | null = null;
  selectedImageIndex: number = 0;
  quantity: number = 1;
  private subscription: Subscription | null = null;
  supplierName: string = '';
  categoryName: string = '';
  subCategoryName: string = '';

  // Dynamic breadcrumbs
  breadcrumbs: { label: string, link?: string }[] = [
    { label: 'Home', link: '/' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private wishlistService: WishlistService,
    private cartService: CartService,
    private supplierService: SupplierService,
    private subCategoryService: SubCategoryService
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

    this.productService.getById(id).subscribe({
      next: (product) => {
        this.product = product;
        this.selectedImageIndex = 0;

        // Get subcategory info
        if (product.subCategoryId) {
          this.loadSubCategoryInfo(product.subCategoryId);
        }

        // Get supplier name
        if (product.supplierNames && product.supplierNames.length > 0) {
          this.supplierName = product.supplierNames[0];
        } else if (product.suppliers && product.suppliers.length > 0) {
          this.supplierName = product.suppliers[0];
        } else {
          this.supplierName = 'Unknown Supplier';
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.error = 'Product not found or failed to load';
        this.loading = false;
      }
    });
  }

  loadSubCategoryInfo(subCategoryId: string): void {
    this.subCategoryService.getById(subCategoryId).subscribe({
      next: (subCategory) => {
        this.subCategoryName = subCategory.name;
        this.categoryName = subCategory.categoryName;
        this.generateBreadcrumbs();
      },
      error: (error) => {
        console.error('Error loading subcategory info:', error);
        // Generate breadcrumbs with limited info
        this.generateBreadcrumbs();
      }
    });
  }

  generateBreadcrumbs(): void {
    this.breadcrumbs = [
      { label: 'Home', link: '/' },
      { label: 'Products', link: '/products' }
    ];

    if (this.categoryName) {
      this.breadcrumbs.push({
        label: this.categoryName,
        link: `/products?category=${this.product?.subCategoryId}`
      });
    }

    if (this.subCategoryName) {
      this.breadcrumbs.push({
        label: this.subCategoryName,
        link: `/products?subcategory=${this.product?.subCategoryId}`
      });
    }

    if (this.product) {
      this.breadcrumbs.push({ label: this.product.name });
    }
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

  getShippingText(shipping: ShippingTypes): string {
    if (!this.product) return '';

    switch (this.product.shipping) {
      case ShippingTypes.Free:
        return 'Free Shipping';
      case ShippingTypes.FreeINSameGovernate:
        return 'Free in Same State';
      case ShippingTypes.Paid:
        return 'Paid Shipping';
      default:
        return 'No Shipping Info';
    }
  }

  formatWarranty(warrantyNMonths: number | undefined | null): string {
    if (!this.product?.warrantyNMonths) return 'No Warranty';

    const months = this.product.warrantyNMonths;
    if (months >= 12) {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) {
        return `${years} Year${years > 1 ? 's' : ''} Warranty`;
      } else {
        return `${years} Year${years > 1 ? 's' : ''} ${remainingMonths} Month${remainingMonths > 1 ? 's' : ''} Warranty`;
      }
    } else {
      return `${months} Month${months > 1 ? 's' : ''} Warranty`;
    }
  }
}
