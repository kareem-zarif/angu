import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router, Params } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProductService } from '../../../services/product-service';
import { WishlistService } from '../../../services/wishlistService';
import { CartService } from '../../../services/cart.service';
import { IProduct } from '../../../models/i-product';
import { Rating } from '../../rating/rating/rating';
import { Sidebar } from '../products-sidebar/sidebar/sidebar';
import { Pagination } from '../../pagination/pagination';
import { SubCategoryService } from '../../../services/sub-category.service';
import { Auth } from '../../../services/auth';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, Rating, Sidebar, Pagination, TranslateModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductList implements OnInit, OnDestroy {
  private subscription: Subscription | null = null;

  allProducts: IProduct[] = [];
  filteredProducts: IProduct[] = [];
  displayedProducts: IProduct[] = [];

  // Filter states
  selectedCategory: string | null = null;
  selectedSubCategory: string | null = null;
  selectedRating: number | null = null;
  priceRange: [number, number] = [0, 1000];
  minPrice: number = 0;
  maxPrice: number = 1000;
  selectedSuppliers: string[] = [];
  includeOutOfStock: boolean = true;
  supplierFilter: string | null = null;
  supplierName: string | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 12;

  // UI states
  loading: boolean = true;
  error: string | null = null;
  animationsEnabled: boolean = false;
  hoveredProductId: string | null = null;

  // Subcategory mapping
  private subCategoryToCategory: Map<string, string> = new Map();

  toastMessage: string | null = null;

  //current user
  currentUserId: string | undefined = undefined;

  // destroy$ used to clean subscriptions (auth, etc.)
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private subCategoryService: SubCategoryService,
    private activatedRoute: ActivatedRoute,
    private wishlistService: WishlistService,
    private cartService: CartService,
    private router: Router,
    private _auth: Auth
  ) { }

  ngOnInit(): void {
    // Set initial user if available (preserves previous behavior)
    this.currentUserId = this._auth.getCurrentUser()?.UserId;

    // Subscribe to auth.currentUser$ so we react to login/logout dynamically
    this._auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUserId = user?.UserId;
      });

    // Load subcategory mapping
    this.loadSubCategoryMapping();

    // Subscribe to query params to get supplier filter
    this.subscription = this.activatedRoute.queryParams.subscribe((params: Params) => {
      this.supplierFilter = params['supplier'] || null;
      this.supplierName = params['supplierName'] || this.supplierFilter;

      // 🆕 إضافة السيرش والكاتيجوري
      const searchQuery = params['q']?.trim() || null;
      this.selectedCategory = params['category'] && params['category'] !== 'all' ? params['category'] : null;

      this.loadProducts(searchQuery);
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    // cleanup auth & other subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSubCategoryMapping(): void {
    this.subCategoryService.getAll().subscribe({
      next: (subCategories) => {
        subCategories.forEach(sc => {
          this.subCategoryToCategory.set(sc.id, sc.categoryName);
        });
      },
      error: (error) => {
        console.error('Error loading subcategory mapping:', error);
      }
    });
  }

  loadProducts(searchQuery?: string): void {
    this.loading = true;
    this.error = null;

    let productsObservable;

    if (this.supplierFilter) {
      productsObservable = this.productService.filterBySupplier(this.supplierFilter);
    } else {
      productsObservable = this.productService.getProducts();
    }

    productsObservable.subscribe({
      next: (products) => {
        this.allProducts = products;

        // 🆕 فلترة بالكلمة لو موجودة
        if (searchQuery) {
          this.allProducts = this.allProducts.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        this.calculatePriceRange();
        this.applyFilters();
        this.loading = false;

        setTimeout(() => {
          this.animationsEnabled = true;
        }, 100);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.error = 'Failed to load products. Please try again later.';
        this.loading = false;
      }
    });
  }


  calculatePriceRange(): void {
    if (this.allProducts.length === 0) return;

    // Get all possible prices (per piece, per 50, per 100)
    const allPrices = this.allProducts.flatMap(product => {
      const prices = [];
      if (product.pricePerPiece) prices.push(product.pricePerPiece);
      if (product.pricePer50Piece) prices.push(product.pricePer50Piece);
      if (product.pricePer100Piece) prices.push(product.pricePer100Piece);
      return prices;
    }).filter(price => price !== null && price !== undefined) as number[];

    if (allPrices.length > 0) {
      this.minPrice = Math.floor(Math.min(...allPrices));
      this.maxPrice = Math.ceil(Math.max(...allPrices));
      this.priceRange = [this.minPrice, this.maxPrice];
    }
  }

  updatePriceRangeForFilteredProducts(): void {
    if (this.filteredProducts.length === 0) return;

    // Get all possible prices from filtered products
    const filteredPrices = this.filteredProducts.flatMap(product => {
      const prices = [];
      if (product.pricePerPiece) prices.push(product.pricePerPiece);
      if (product.pricePer50Piece) prices.push(product.pricePer50Piece);
      if (product.pricePer100Piece) prices.push(product.pricePer100Piece);
      return prices;
    }).filter(price => price !== null && price !== undefined) as number[];

    if (filteredPrices.length > 0) {
      this.minPrice = Math.floor(Math.min(...filteredPrices));
      this.maxPrice = Math.ceil(Math.max(...filteredPrices));
    }
  }

  onCategorySelected(categoryId: string | null): void {
    this.selectedCategory = categoryId;
    this.selectedSubCategory = null;
    this.applyFilters();
  }

  onSubCategorySelected(subCategoryId: string | null): void {
    this.selectedSubCategory = subCategoryId;
    if (subCategoryId && this.subCategoryToCategory.has(subCategoryId)) {
      this.selectedCategory = this.subCategoryToCategory.get(subCategoryId) || null;
    }
    this.applyFilters();
  }

  onFilterChange(filters: any): void {
    this.selectedRating = filters.rating;
    this.priceRange = filters.priceRange || this.priceRange;
    this.selectedSuppliers = filters.suppliers || [];
    this.includeOutOfStock = filters.includeOutOfStock !== undefined ? filters.includeOutOfStock : true;
    this.filteredProducts = filters.filteredProducts || this.allProducts;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredProducts = this.allProducts.filter(product => {
      // Subcategory filter
      if (this.selectedSubCategory && product.subCategoryId !== this.selectedSubCategory) {
        return false;
      }

      // Category filter (only apply if subcategory is not selected)
      if (!this.selectedSubCategory && this.selectedCategory &&
        !this.isCategoryMatch(product.subCategoryId, this.selectedCategory)) {
        return false;
      }

      // Rating filter
      if (this.selectedRating !== null && (product.rating || 0) < this.selectedRating) {
        return false;
      }

      // Price filter - check all price types
      const productPrices = [
        product.pricePerPiece,
        product.pricePer50Piece,
        product.pricePer100Piece
      ].filter(price => price !== null && price !== undefined) as number[];

      // If any price is within range, include the product
      const anyPriceInRange = productPrices.some(
        price => price >= this.priceRange[0] && price <= this.priceRange[1]
      );

      if (!anyPriceInRange) {
        return false;
      }

      // Supplier filter
      if (this.selectedSuppliers.length > 0) {
        const productSuppliers = [
          ...(product.supplierNames || []),
          ...(product.suppliers || [])
        ];

        if (!productSuppliers.some(s => this.selectedSuppliers.includes(s))) {
          return false;
        }
      }

      // Stock filter - properly check if product is out of stock
      // If includeOutOfStock is false, exclude products with noINStock <= 0
      if (!this.includeOutOfStock && product.noINStock <= 0) {
        return false;
      }

      return true;
    });

    // Reset to first page when filters change
    this.currentPage = 1;
    this.updateDisplayedProducts();
    this.updatePriceRangeForFilteredProducts();
  }

  updateDisplayedProducts(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateDisplayedProducts();

    // Scroll to top of products container
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  get paginatedProducts(): IProduct[] {
    return this.displayedProducts;
  }

  addToCart(product: IProduct, event: Event): void {
    event.stopPropagation();
    this.cartService.addToCart(product, undefined, this.currentUserId);
    // Show toast or notification here if needed
  }

  toggleWishlist(product: IProduct, event: Event): void {
    event.stopPropagation();
    if (this.isInWishlist(product.id)) {
      this.wishlistService.removeFromWishlist(product.id);
    } else {
      this.wishlistService.addToWishlist(product, this.currentUserId);
    }
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistService.isInWishlist(productId);
  }

  onProductHover(productId: string): void {
    this.hoveredProductId = productId;
  }

  onProductLeave(): void {
    this.hoveredProductId = null;
  }

  navigateToProductDetails(product: IProduct, event: Event): void {
    // Prevent navigation if the click was on a button
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    this.router.navigate(['/products', product.id]);
  }

  requestSample(product: IProduct, event: Event): void {
    event.stopPropagation();
    this.cartService.addToCart(product, undefined, this.currentUserId);
    // Show toast notification
    this.showToast(` ${product.name} added to cart`);
  }

  showToast(message: string): void {
    this.toastMessage = message;
    setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }

  private isCategoryMatch(subCategoryId: string, categoryId: string): boolean {
    return this.subCategoryToCategory.get(subCategoryId) === categoryId;
  }

  isCustomerOrGuest() {
    const user = this._auth.getCurrentUser();
    return !user || user.roles.includes('Customer');
  }
}
