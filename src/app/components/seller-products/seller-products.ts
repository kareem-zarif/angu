import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product-service';
import { CategoryService } from '../../services/category.service';
import { SubCategoryService } from '../../services/sub-category.service';
import { Auth } from '../../services/auth';
import { IProduct, ProductApprovalStatus, ShippingTypes } from '../../models/i-product';
import { ICategory } from '../../models/i-category';
import { ISubCategory } from '../../models/i-sub-category';
import { PaginationComponent } from '../shared/pagination/pagination';
import { Observable } from 'rxjs';
import { LocalStorageNotificationService } from '../../services/local-storage-notification.service';

export interface SellerProductNotification {
  id: string;
  title: string;
  message: string;
  type: 'product_created' | 'product_updated' | 'product_deleted' | 'low_stock_alert';
  recipientType: 'admin';
  recipientId?: string;
  isRead: boolean;
  timestamp: Date;
  actionUrl: string;
  metadata?: any;
}

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './seller-products.html',
  styleUrl: './seller-products.css'
})
export class SellerProductsComponent implements OnInit {
  products: IProduct[] = [];
  filteredProducts: IProduct[] = [];
  isLoading = false;
  error: string | null = null;

  // Search and filter properties
  searchTerm = '';
  searchField = 'all'; // 'all', 'name', 'description', 'supplier'
  approvalStatusFilter = 'all';
  stockFilter = 'all';

  // Modal states
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showViewModal = false;
  selectedProduct: IProduct | null = null;
  isSubmitting = false;

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 1;

  // Form properties
  form: Partial<IProduct> = {};
  formErrors: Record<string, string> = {};
  selectedImages: File[] = [];

  // Category and subcategory properties
  categories: ICategory[] = [];
  subCategories: ISubCategory[] = [];
  selectedCategoryId: string = '';

  // No longer needed - using LocalStorageNotificationService instead
  // private adminNotificationsSubject = new BehaviorSubject<SellerProductNotification[]>([]);
  // public adminNotifications$ = this.adminNotificationsSubject.asObservable();

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private auth: Auth,
    private localNotificationService: LocalStorageNotificationService
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
    this.loadSubcategories();
    
    // Check API connectivity for debugging
    this.checkApiConnectivity();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = null;

    this.productService.getAllForSeller().subscribe({
      next: (products) => {
        this.products = products;
        this.applyFilters();
        this.isLoading = false;

        // Check for low stock products and send notifications
        this.checkLowStockProducts();
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.error = 'Failed to load products. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  // Check for low stock products and send notifications
  private checkLowStockProducts() {
    const currentSellerId = this.auth.getCurrentUser()?.UserId;
    if (!currentSellerId) return;

    const lowStockThreshold = 10; // Products with 10 or fewer items are considered low stock
    
    this.products.forEach(product => {
      if (product.noINStock <= lowStockThreshold && product.noINStock > 0) {
        // Send low stock notification to admin
        this.notifyAdmin('low_stock_alert', 'Low Stock Alert', 
          `Product "${product.name}" is running low on stock (${product.noINStock} remaining)`, 
          '/admin/products', { 
            productName: product.name, 
            currentStock: product.noINStock,
            sellerId: currentSellerId 
          });
      }
    });
  }

  applyFilters() {
    this.filteredProducts = this.products.filter(product => {
      // Search filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        switch (this.searchField) {
          case 'name':
            return product.name.toLowerCase().includes(searchLower);
          case 'description':
            return product.description.toLowerCase().includes(searchLower);
          case 'supplier':
            return (product.supplierNames || []).some(name => 
              name.toLowerCase().includes(searchLower)
            );
          case 'all':
          default:
            return (
              product.name.toLowerCase().includes(searchLower) ||
              product.description.toLowerCase().includes(searchLower) ||
              (product.supplierNames || []).some(name => 
                name.toLowerCase().includes(searchLower)
              )
            );
        }
      }

      // Approval status filter
      if (this.approvalStatusFilter !== 'all') {
        const status = parseInt(this.approvalStatusFilter);
        if (product.approvalStatus !== status) return false;
      }

      // Stock filter
      if (this.stockFilter === 'inStock' && product.noINStock <= 0) return false;
      if (this.stockFilter === 'outOfStock' && product.noINStock > 0) return false;

      return true;
    });

    // Update pagination
    this.totalItems = this.filteredProducts.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    // Reset to first page if current page is out of bounds
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  getPaginatedProducts(): IProduct[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProducts.slice(startIndex, endIndex);
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onItemsPerPageChange(itemsPerPage: number) {
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
  }

  onSearch() {
    this.currentPage = 1;
    this.applyFilters();
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchField = 'all';
    this.approvalStatusFilter = 'all';
    this.stockFilter = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }

  openAddModal() {
    this.selectedProduct = null;
    this.form = {
      name: '',
      description: '',
      pricePerPiece: 0,
      pricePer50Piece: undefined,
      pricePer100Piece: undefined,
      noINStock: 0,
      minNumToFactoryOrder: 1,
      approvalStatus: ProductApprovalStatus.Pending,
      shipping: ShippingTypes.Free,
      subCategoryId: '',
      productPicsPathes: [],
      warrantyNMonths: undefined
    };
    this.selectedImages = [];
    this.selectedCategoryId = '';
    this.subCategories = [];
    this.formErrors = {};
    this.showAddModal = true;
  }

  openEditModal(product: IProduct) {
    this.selectedProduct = product;
    this.form = { ...product };
    // Sellers cannot change approval status, so we don't include it in the form
    delete this.form.approvalStatus;
    this.selectedImages = [];
    this.formErrors = {};
    
    console.log('Opening edit modal for product:', product);
    
    // Find the category for this product's subcategory
    if (product.subCategoryId) {
      this.subCategoryService.getById(product.subCategoryId).subscribe({
        next: (subCategory) => {
          console.log('Subcategory loaded:', subCategory);
          // Find the category by name
          const category = this.categories.find(c => c.name === subCategory.categoryName);
          if (category) {
            this.selectedCategoryId = category.id;
            console.log('Category found:', category);
            // Load subcategories for the selected category
            this.subCategoryService.getByCategoryName(subCategory.categoryName).subscribe({
              next: (subCategories) => {
                this.subCategories = subCategories;
                console.log('Subcategories loaded:', subCategories);
                // Ensure the form subcategory ID is preserved
                this.form.subCategoryId = product.subCategoryId;
              },
              error: (error) => {
                console.error('Error loading subcategories for edit:', error);
                this.formErrors['subCategoryId'] = 'Failed to load subcategories';
              }
            });
          } else {
            console.warn('Category not found for subcategory:', subCategory);
            this.formErrors['subCategoryId'] = 'Category not found';
          }
        },
        error: (error) => {
          console.error('Error loading subcategory for edit:', error);
          this.formErrors['subCategoryId'] = 'Failed to load subcategory';
        }
      });
    } else {
      console.warn('Product has no subcategory ID:', product);
      this.formErrors['subCategoryId'] = 'No subcategory assigned';
    }
    
    this.showEditModal = true;
  }

  openDeleteModal(product: IProduct) {
    this.selectedProduct = product;
    this.showDeleteModal = true;
  }

  openViewModal(product: IProduct) {
    this.selectedProduct = product;
    this.showViewModal = true;
  }

  validateForm(): boolean {
    this.formErrors = {};

    // Product name validation
    if (!this.form.name?.trim()) {
      this.formErrors['name'] = 'Product name is required';
    } else if (this.form.name.trim().length < 3) {
      this.formErrors['name'] = 'Product name must be at least 3 characters long';
    }

    // Description validation
    if (!this.form.description?.trim()) {
      this.formErrors['description'] = 'Product description is required';
    } else if (this.form.description.trim().length < 10) {
      this.formErrors['description'] = 'Product description must be at least 10 characters long';
    }

    // Price validation
    if (!this.form.pricePerPiece || this.form.pricePerPiece <= 0) {
      this.formErrors['pricePerPiece'] = 'Price must be greater than 0';
    } else if (this.form.pricePerPiece > 999999) {
      this.formErrors['pricePerPiece'] = 'Price cannot exceed 999,999';
    }

    // Bulk pricing validation
    if (this.form.pricePer50Piece !== undefined && this.form.pricePer50Piece !== null) {
      if (this.form.pricePer50Piece <= 0) {
        this.formErrors['pricePer50Piece'] = 'Price per 50 pieces must be greater than 0';
      } else if (this.form.pricePerPiece && this.form.pricePer50Piece >= this.form.pricePerPiece) {
        this.formErrors['pricePer50Piece'] = 'Bulk price must be less than individual price';
      }
    }

    if (this.form.pricePer100Piece !== undefined && this.form.pricePer100Piece !== null) {
      if (this.form.pricePer100Piece <= 0) {
        this.formErrors['pricePer100Piece'] = 'Price per 100 pieces must be greater than 0';
      } else if (this.form.pricePerPiece && this.form.pricePer100Piece >= this.form.pricePerPiece) {
        this.formErrors['pricePer100Piece'] = 'Bulk price must be less than individual price';
      }
      if (this.form.pricePer50Piece && this.form.pricePer100Piece >= this.form.pricePer50Piece) {
        this.formErrors['pricePer100Piece'] = 'Price per 100 pieces must be less than price per 50 pieces';
      }
    }

    // Stock validation
    if (this.form.noINStock === undefined || this.form.noINStock === null) {
      this.formErrors['noINStock'] = 'Stock quantity is required';
    } else if (this.form.noINStock < 0) {
      this.formErrors['noINStock'] = 'Stock quantity cannot be negative';
    } else if (this.form.noINStock > 999999) {
      this.formErrors['noINStock'] = 'Stock quantity cannot exceed 999,999';
    }

    // Minimum factory order validation
    if (this.form.minNumToFactoryOrder !== undefined && this.form.minNumToFactoryOrder !== null) {
      if (this.form.minNumToFactoryOrder < 1) {
        this.formErrors['minNumToFactoryOrder'] = 'Minimum factory order must be at least 1';
      } else if (this.form.minNumToFactoryOrder > 999999) {
        this.formErrors['minNumToFactoryOrder'] = 'Minimum factory order cannot exceed 999,999';
      }
    }

    // Subcategory validation
    if (!this.form.subCategoryId) {
      this.formErrors['subCategoryId'] = 'Subcategory is required';
    }

    // Warranty validation
    if (this.form.warrantyNMonths !== undefined && this.form.warrantyNMonths !== null) {
      if (this.form.warrantyNMonths < 0) {
        this.formErrors['warrantyNMonths'] = 'Warranty months cannot be negative';
      } else if (this.form.warrantyNMonths > 120) {
        this.formErrors['warrantyNMonths'] = 'Warranty cannot exceed 120 months (10 years)';
      }
    }

    // Shipping validation
    if (this.form.shipping === undefined || this.form.shipping === null) {
      this.formErrors['shipping'] = 'Shipping type is required';
    }

    // Log validation errors for debugging
    if (Object.keys(this.formErrors).length > 0) {
      console.log('Form validation errors:', this.formErrors);
    }

    return Object.keys(this.formErrors).length === 0;
  }

  saveProduct() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    if (this.selectedProduct) {
      // Update existing product - preserve original approval status
      const cleanedFormData = this.cleanFormData(this.form);
      const currentUser = this.auth.getCurrentUser();
      
      if (!currentUser?.UserId) {
        alert('User not authenticated. Please login again.');
        this.isSubmitting = false;
        return;
      }

      const updateData: IProduct = {
        ...this.selectedProduct,
        ...cleanedFormData,
        approvalStatus: this.selectedProduct.approvalStatus // Keep original approval status
      };

      console.log('Updating product with data:', updateData);

      this.productService.update(updateData, this.selectedImages).subscribe({
        next: (updatedProduct) => {
          console.log('Product updated successfully:', updatedProduct);
          this.loadProducts();
          this.showEditModal = false;
          this.isSubmitting = false;
          alert('Product updated successfully!');
          
          // Notify admin about product update
          this.notifyAdmin('product_updated', 'Product Updated', 
            `Product "${updateData.name}" has been updated by seller`, 
            '/admin/products', { 
              productName: updateData.name,
              sellerId: currentUser.UserId 
            });
        },
        error: (error) => {
          console.error('Error updating product:', error);
          this.isSubmitting = false;
          
          // Provide more specific error messages
          let errorMessage = 'Failed to update product. Please try again.';
          
          if (error.status === 400) {
            errorMessage = 'Invalid data provided. Please check your input and try again.';
          } else if (error.status === 401) {
            errorMessage = 'Unauthorized. Please login again.';
          } else if (error.status === 403) {
            errorMessage = 'Access denied. You may not have permission to update this product.';
          } else if (error.status === 404) {
            errorMessage = 'Product not found. It may have been deleted.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.error && error.error.message) {
            errorMessage = `Error: ${error.error.message}`;
          }
          
          alert(errorMessage);
        }
      });
    } else {
      // Create new product
      const cleanedFormData = this.cleanFormData(this.form);
      const currentUser = this.auth.getCurrentUser();
      
      if (!currentUser?.UserId) {
        alert('User not authenticated. Please login again.');
        this.isSubmitting = false;
        return;
      }

      const createData: IProduct = {
        ...cleanedFormData as IProduct,
        id: '',
        productPicsPathes: []
      };

      console.log('Creating product with data:', createData);

      this.productService.add(createData, this.selectedImages).subscribe({
        next: (createdProduct) => {
          console.log('Product created successfully:', createdProduct);
          this.loadProducts();
          this.showAddModal = false;
          this.isSubmitting = false;
          this.selectedImages = [];
          alert('Product created successfully!');
          
          // Create notification for admin about new product
          if (this.form.name) {
            this.notifyAdmin('product_created', 'New Product Pending Review', 
              `New product "${this.form.name}" has been submitted for approval.`, 
              '/admin/products', { 
                productName: this.form.name,
                sellerId: currentUser.UserId 
              });
          }
        },
        error: (error) => {
          console.error('Error creating product:', error);
          this.isSubmitting = false;
          
          // Provide more specific error messages
          let errorMessage = 'Failed to create product. Please try again.';
          
          if (error.status === 400) {
            errorMessage = 'Invalid data provided. Please check your input and try again.';
          } else if (error.status === 401) {
            errorMessage = 'Unauthorized. Please login again.';
          } else if (error.status === 403) {
            errorMessage = 'Access denied. You may not have permission to create products.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.error && error.error.message) {
            errorMessage = `Error: ${error.error.message}`;
          }
          
          alert(errorMessage);
        }
      });
    }
  }

  deleteProduct() {
    if (!this.selectedProduct) return;

    this.isSubmitting = true;

    this.productService.delete(this.selectedProduct.id).subscribe({
      next: () => {
        this.loadProducts();
        this.showDeleteModal = false;
        this.isSubmitting = false;
        alert('Product deleted successfully!');
        
        // Notify admin about product deletion
        if (this.selectedProduct) {
          this.notifyAdmin('product_deleted', 'Product Deleted', 
            `Product "${this.selectedProduct.name}" has been deleted by seller`, 
            '/admin/products', { 
              productName: this.selectedProduct.name,
              sellerId: this.auth.getCurrentUser()?.UserId 
            });
        }
      },
      error: (error) => {
        console.error('Error deleting product:', error);
        this.isSubmitting = false;
        alert('Failed to delete product. Please try again.');
      }
    });
  }

  clearError(field: string) {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  // Helper method to check if a field has an error
  hasError(field: string): boolean {
    return !!this.formErrors[field];
  }

  // Helper method to convert string to number or undefined
  convertToNumber(value: string): number | undefined {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  onImageSelected(event: any) {
    const files = event.target.files;
    if (files) {
      this.selectedImages = Array.from(files);
    }
  }

  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
  }

  getImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  loadCategories() {
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadSubcategories() {
    this.subCategoryService.getAll().subscribe({
      next: (subcategories) => {
        this.subCategories = subcategories;
      },
      error: (error) => {
        console.error('Error loading subcategories:', error);
      }
    });
  }

  onCategoryChange() {
    // Clear subcategory selection when category changes (except when editing and the subcategory belongs to the new category)
    const currentSubCategoryId = this.form.subCategoryId;
    this.subCategories = [];
    
    if (this.selectedCategoryId) {
      // Get the category name from the selected category ID
      const selectedCategory = this.categories.find(c => c.id === this.selectedCategoryId);
      if (selectedCategory) {
        this.subCategoryService.getByCategoryName(selectedCategory.name).subscribe({
          next: (subCategories) => {
            this.subCategories = subCategories;
            
            // If we're editing and the current subcategory doesn't belong to the new category, clear it
            if (this.selectedProduct && currentSubCategoryId) {
              const subCategoryExists = subCategories.some(sc => sc.id === currentSubCategoryId);
              if (!subCategoryExists) {
                this.form.subCategoryId = '';
              }
            } else if (!this.selectedProduct) {
              // If adding new product, always clear subcategory when category changes
              this.form.subCategoryId = '';
            }
          },
          error: (error) => {
            console.error('Error loading subcategories:', error);
            this.form.subCategoryId = '';
          }
        });
      }
    } else {
      // If no category is selected, clear subcategory
      this.form.subCategoryId = '';
    }
  }

  getApprovalStatusLabel(status: ProductApprovalStatus): string {
    switch (status) {
      case ProductApprovalStatus.Pending: return 'Pending';
      case ProductApprovalStatus.Approved: return 'Approved';
      case ProductApprovalStatus.Rejected: return 'Rejected';
      default: return 'Unknown';
    }
  }

  getApprovalStatusClass(status: ProductApprovalStatus): string {
    switch (status) {
      case ProductApprovalStatus.Pending: return 'bg-yellow-100 text-yellow-800';
      case ProductApprovalStatus.Approved: return 'bg-green-100 text-green-800';
      case ProductApprovalStatus.Rejected: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getShippingTypeLabel(shipping: ShippingTypes): string {
    switch (shipping) {
      case ShippingTypes.Free: return 'Free';
      case ShippingTypes.FreeINSameGovernate: return 'Free in Same Governorate';
      case ShippingTypes.Paid: return 'Paid';
      case ShippingTypes.None: return 'None';
      default: return 'Unknown';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatBulkPricing(product: IProduct): string {
    const prices: string[] = [];
    
    if (product.pricePer50Piece && product.pricePer50Piece > 0) {
      prices.push(`${this.formatCurrency(product.pricePer50Piece)} (50)`);
    }
    
    if (product.pricePer100Piece && product.pricePer100Piece > 0) {
      prices.push(`${this.formatCurrency(product.pricePer100Piece)} (100)`);
    }
    
    return prices.length > 0 ? prices.join(', ') : 'N/A';
  }

  hasBulkPricing(product: IProduct): boolean {
    return (product.pricePer50Piece !== undefined && product.pricePer50Piece > 0) || 
           (product.pricePer100Piece !== undefined && product.pricePer100Piece > 0);
  }

  getCategoryName(subCategoryId: string): string {
    const subcategory = this.subCategories.find(sub => sub.id === subCategoryId);
    if (subcategory) {
      return subcategory.categoryName;
    }
    return 'Unknown Category';
  }

  private cleanFormData(formData: Partial<IProduct>): Partial<IProduct> {
    const cleaned = { ...formData };
    
    // Convert 0 values to undefined for optional numeric fields
    if (cleaned.pricePer50Piece === 0) {
      cleaned.pricePer50Piece = undefined;
    }
    
    if (cleaned.pricePer100Piece === 0) {
      cleaned.pricePer100Piece = undefined;
    }
    
    if (cleaned.warrantyNMonths === 0) {
      cleaned.warrantyNMonths = undefined;
    }
    
    // Ensure numeric fields are properly typed and within valid ranges
    if (cleaned.pricePerPiece !== undefined) {
      cleaned.pricePerPiece = Number(cleaned.pricePerPiece);
      if (isNaN(cleaned.pricePerPiece) || cleaned.pricePerPiece <= 0) {
        cleaned.pricePerPiece = 0; // This will trigger validation error
      }
    }
    
    if (cleaned.noINStock !== undefined) {
      cleaned.noINStock = Number(cleaned.noINStock);
      if (isNaN(cleaned.noINStock) || cleaned.noINStock < 0) {
        cleaned.noINStock = 0; // This will trigger validation error
      }
    }
    
    if (cleaned.minNumToFactoryOrder !== undefined) {
      cleaned.minNumToFactoryOrder = Number(cleaned.minNumToFactoryOrder);
      if (isNaN(cleaned.minNumToFactoryOrder) || cleaned.minNumToFactoryOrder < 1) {
        cleaned.minNumToFactoryOrder = 1; // Set to minimum valid value
      }
    }
    
    // Ensure shipping type is valid
    if (cleaned.shipping !== undefined) {
      cleaned.shipping = Number(cleaned.shipping);
      if (isNaN(cleaned.shipping) || cleaned.shipping < 0 || cleaned.shipping > 4) {
        cleaned.shipping = 1; // Default to Free shipping
      }
    }
    
    // Ensure approval status is valid (for new products)
    if (cleaned.approvalStatus !== undefined) {
      cleaned.approvalStatus = Number(cleaned.approvalStatus);
      if (isNaN(cleaned.approvalStatus) || cleaned.approvalStatus < 1 || cleaned.approvalStatus > 3) {
        cleaned.approvalStatus = 1; // Default to Pending
      }
    }
    
    // Ensure subcategory ID is a valid string
    if (cleaned.subCategoryId && typeof cleaned.subCategoryId !== 'string') {
      cleaned.subCategoryId = String(cleaned.subCategoryId);
    }
    
    // Ensure name and description are trimmed
    if (cleaned.name) {
      cleaned.name = cleaned.name.trim();
    }
    
    if (cleaned.description) {
      cleaned.description = cleaned.description.trim();
    }
    
    console.log('Cleaned form data:', cleaned);
    return cleaned;
  }

  getStockStatus(product: IProduct): string {
    if (product.noINStock <= 0) return 'Out of Stock';
    if (product.noINStock <= 10) return 'Low Stock';
    return 'In Stock';
  }

  getStockClass(product: IProduct): string {
    if (product.noINStock <= 0) return 'bg-red-100 text-red-800';
    if (product.noINStock <= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  // Private method to create and emit notifications for admin
  private notifyAdmin(type: SellerProductNotification['type'], title: string, message: string, 
                     actionUrl: string, metadata?: any): void {
    // Create notification using local storage service
    this.localNotificationService.createNotification({
      title,
      message,
      type: type as any, // Cast to match the service interface
      recipientType: 'admin',
      isRead: false,
      actionUrl,
      metadata
    });
    
    console.log('Seller product notification sent to admin via local storage:', { title, message });
  }

  // These methods are no longer needed - use LocalStorageNotificationService instead
  // getAdminNotifications(): Observable<SellerProductNotification[]> {
  //   return this.localNotificationService.getAdminNotifications();
  // }

  // markNotificationAsRead(notificationId: string): void {
  //   this.localNotificationService.markAsRead(notificationId);
  // }

  // clearAdminNotifications(): void {
  //   this.localNotificationService.clearNotifications('admin');
  // }

  // Add method to check API connectivity
  checkApiConnectivity(): void {
    console.log('Checking API connectivity...');
    console.log('API URL:', 'https://localhost:7253/api');
    
    // Test basic connectivity
    fetch('https://localhost:7253/api/Product')
      .then(response => {
        console.log('API connectivity test response:', response.status, response.statusText);
        if (response.ok) {
          console.log('✅ API is accessible');
        } else {
          console.warn('⚠️ API returned status:', response.status);
        }
      })
      .catch(error => {
        console.error('❌ API connectivity test failed:', error);
        alert('Warning: Cannot connect to the backend API. Please check if the backend server is running.');
      });
  }
} 