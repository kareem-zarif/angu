import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminProductsService } from '../../services/admin-products-service';
import { NotificationService } from '../../services/notification.service';
import { IProduct, ProductApprovalStatus, ShippingTypes, ProductUpdateDto } from '../../models/i-product';
import { ICategory } from '../../models/i-category';
import { ISubCategory } from '../../models/i-sub-category';
import { PaginationComponent } from '../shared/pagination/pagination';
import { CategoryService } from '../../services/category.service';
import { SubCategoryService } from '../../services/sub-category.service';
import { ProductSupplierService, ProductSupplierResDto } from '../../services/product-supplier.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css'
})
export class AdminProductsComponent implements OnInit {
  products: IProduct[] = [];
  filteredProducts: IProduct[] = [];
  isLoading = false;
  error: string | null = null;

  // Search and filter properties
  searchTerm = '';
  searchField = 'all'; // 'all', 'name', 'description', 'supplier'
  approvalStatusFilter = 'all';
  stockFilter = 'all';
  minPriceFilter: number | null = null;
  maxPriceFilter: number | null = null;
  subcategoryFilter = 'all'; // Changed from categoryFilter to subcategoryFilter
  categoryFilter = 'all'; // Keep category filter for grouping

  // Modal states
  showEditModal = false;
  showDeleteModal = false;
  showViewModal = false;
  showApprovalModal = false;
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

  // Category and subcategory properties
  categories: ICategory[] = [];
  subcategories: ISubCategory[] = [];
  subcategoriesByCategory: { [categoryName: string]: ISubCategory[] } = {};

  // Product-supplier relationships
  productSuppliers: ProductSupplierResDto[] = [];

  // Approval modal properties
  newApprovalStatus: ProductApprovalStatus = ProductApprovalStatus.Pending;
  approvalNotes: string = '';

  constructor(
    private productService: AdminProductsService,
    private notificationService: NotificationService,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private productSupplierService: ProductSupplierService
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
    this.loadSubcategories();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = null;

    // Load both products and product-supplier relationships
    forkJoin({
      products: this.productService.getAllProducts(),
      productSuppliers: this.productSupplierService.getAll()
    }).subscribe({
      next: ({ products, productSuppliers }) => {
        this.products = products;
        this.productSuppliers = productSuppliers;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.error = 'Failed to load products. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (categories: ICategory[]) => {
        this.categories = categories;
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadSubcategories(): void {
    this.subCategoryService.getAll().subscribe({
      next: (subcategories: ISubCategory[]) => {
        this.subcategories = subcategories;
        this.groupSubcategoriesByCategory();
      },
      error: (error: any) => {
        console.error('Error loading subcategories:', error);
      }
    });
  }

  groupSubcategoriesByCategory(): void {
    this.subcategoriesByCategory = {};
    this.subcategories.forEach(subcategory => {
      if (!this.subcategoriesByCategory[subcategory.categoryName]) {
        this.subcategoriesByCategory[subcategory.categoryName] = [];
      }
      this.subcategoriesByCategory[subcategory.categoryName].push(subcategory);
    });
  }

  getFilteredSubcategories(): ISubCategory[] {
    if (this.categoryFilter === 'all') {
      return this.subcategories;
    }
    const categoryName = this.categories.find(cat => cat.id === this.categoryFilter)?.name;
    return categoryName ? this.subcategoriesByCategory[categoryName] || [] : [];
  }

  onCategoryFilterChange(): void {
    // Reset subcategory filter when category changes
    this.subcategoryFilter = 'all';
    this.applyFilters();
  }

  applyFilters() {
    this.filteredProducts = this.products.filter(product => {
      // Search filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        switch (this.searchField) {
          case 'name':
            return product.name?.toLowerCase().includes(searchLower) || false;
          case 'description':
            return product.description?.toLowerCase().includes(searchLower) || false;
          case 'supplier':
            return this.getSupplierNames(product).some(name => 
              name.toLowerCase().includes(searchLower)
            );
          case 'all':
          default:
            return (
              (product.name?.toLowerCase().includes(searchLower) || false) ||
              (product.description?.toLowerCase().includes(searchLower) || false) ||
              this.getSupplierNames(product).some(name => 
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
      if (this.stockFilter === 'inStock' && (product.noINStock || 0) <= 0) return false;
      if (this.stockFilter === 'outOfStock' && (product.noINStock || 0) > 0) return false;
      if (this.stockFilter === 'lowStock' && (product.noINStock || 0) > 10) return false;

      // Price range filter
      if (this.minPriceFilter !== null && (product.pricePerPiece || 0) < this.minPriceFilter) return false;
      if (this.maxPriceFilter !== null && (product.pricePerPiece || 0) > this.maxPriceFilter) return false;

      // Category filter - if category is selected, filter by subcategories in that category
      if (this.categoryFilter !== 'all') {
        const categoryName = this.categories.find(cat => cat.id === this.categoryFilter)?.name;
        if (categoryName) {
          const subcategoryIds = this.subcategoriesByCategory[categoryName]?.map(sub => sub.id) || [];
          if (!subcategoryIds.includes(product.subCategoryId || '')) return false;
        }
      }

      // Subcategory filter - if subcategory is selected, filter by that specific subcategory
      if (this.subcategoryFilter !== 'all' && product.subCategoryId !== this.subcategoryFilter) return false;

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
    this.minPriceFilter = null;
    this.maxPriceFilter = null;
    this.subcategoryFilter = 'all';
    this.categoryFilter = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }

  openApprovalModal(product: IProduct) {
    this.selectedProduct = product;
    this.newApprovalStatus = this.getSafeApprovalStatus(product);
    this.approvalNotes = '';
    this.showApprovalModal = true;
  }

  approveProduct() {
    if (!this.selectedProduct) return;

    this.isSubmitting = true;
    const updateData: ProductUpdateDto = {
      id: this.selectedProduct.id,
      name: this.selectedProduct.name,
      description: this.selectedProduct.description,
      pricePerPiece: this.selectedProduct.pricePerPiece,
      pricePer50Piece: this.selectedProduct.pricePer50Piece,
      pricePer100Piece: this.selectedProduct.pricePer100Piece,
      noINStock: this.selectedProduct.noINStock,
      minNumToFactoryOrder: this.selectedProduct.minNumToFactoryOrder,
      approvalStatus: this.newApprovalStatus,
      shipping: this.selectedProduct.shipping,
      subCategoryId: this.selectedProduct.subCategoryId,
      warrantyNMonths: this.selectedProduct.warrantyNMonths,
      images: null
    };

    this.productService.updateProduct(updateData).subscribe({
      next: () => {
        this.loadProducts();
        this.showApprovalModal = false;
        this.isSubmitting = false;
        this.notificationService.showSuccess('Product status updated successfully!');
        
        // Create notification for seller about product approval
        try {
          const sellerId = this.getSellerIdFromProduct(this.selectedProduct!);
          if (sellerId && sellerId !== 'unknown-seller-id') {
            console.log('Creating approval notification for seller:', sellerId, 'product:', this.selectedProduct!.name);
            
            this.notificationService.createProductApprovalNotification(
              sellerId,
              this.selectedProduct!.name,
              this.newApprovalStatus === ProductApprovalStatus.Approved
            ).subscribe({
              next: (notification) => {
                console.log('Notification created successfully:', notification);
              },
              error: (error) => {
                console.error('Error creating notification:', error);
              }
            });
          } else {
            console.warn('Could not create notification: No valid seller ID found');
          }
        } catch (error) {
          console.error('Error creating approval notification:', error);
        }
      },
      error: (error) => {
        console.error('Error updating product status:', error);
        this.isSubmitting = false;
        this.notificationService.showError('Failed to update product status. Please try again.');
      }
    });
  }

  rejectProduct() {
    if (!this.selectedProduct) return;

    this.isSubmitting = true;
    const updateData: ProductUpdateDto = {
      id: this.selectedProduct.id,
      name: this.selectedProduct.name,
      description: this.selectedProduct.description,
      pricePerPiece: this.selectedProduct.pricePerPiece,
      pricePer50Piece: this.selectedProduct.pricePer50Piece,
      pricePer100Piece: this.selectedProduct.pricePer100Piece,
      noINStock: this.selectedProduct.noINStock,
      minNumToFactoryOrder: this.selectedProduct.minNumToFactoryOrder,
      approvalStatus: ProductApprovalStatus.Rejected,
      shipping: this.selectedProduct.shipping,
      subCategoryId: this.selectedProduct.subCategoryId,
      warrantyNMonths: this.selectedProduct.warrantyNMonths,
      images: null
    };

    this.productService.updateProduct(updateData).subscribe({
      next: () => {
        this.loadProducts();
        this.showApprovalModal = false;
        this.isSubmitting = false;
        this.notificationService.showSuccess('Product rejected successfully!');
        
        // Create notification for seller about product rejection
        try {
          const sellerId = this.getSellerIdFromProduct(this.selectedProduct!);
          if (sellerId && sellerId !== 'unknown-seller-id') {
            console.log('Creating rejection notification for seller:', sellerId, 'product:', this.selectedProduct!.name);
            
            this.notificationService.createProductApprovalNotification(
              sellerId,
              this.selectedProduct!.name,
              false // rejected
            ).subscribe({
              next: (notification) => {
                console.log('Notification created successfully:', notification);
              },
              error: (error) => {
                console.error('Error creating notification:', error);
              }
            });
          } else {
            console.warn('Could not create notification: No valid seller ID found');
          }
        } catch (error) {
          console.error('Error creating rejection notification:', error);
        }
      },
      error: (error) => {
        console.error('Error rejecting product:', error);
        this.isSubmitting = false;
        this.notificationService.showError('Failed to reject product. Please try again.');
      }
    });
  }

  private getSellerIdFromProduct(product: IProduct): string {
    // Find the ProductSupplier relationship for this product
    const productSupplier = this.productSuppliers.find(ps => ps.productId === product.id);
    
    if (productSupplier) {
      return productSupplier.supplierId;
    }
    
    // Fallback: try to get from product.suppliers array if it exists
    if (product.suppliers && product.suppliers.length > 0) {
      return product.suppliers[0];
    }
    
    // Fallback: try to get from product.supplierNames if it exists
    if (product.supplierNames && product.supplierNames.length > 0) {
      // For now, we'll use a hash of the supplier name as a pseudo-ID
      // In production, you should have a proper supplier/seller mapping table
      return btoa(product.supplierNames[0]).substring(0, 8);
    }
    
    console.warn('No supplier ID found for product:', product.id, product.name);
    return 'unknown-seller-id';
  }

  // Helper method to get supplier names for display
  getSupplierNames(product: IProduct): string[] {
    // First try to get from ProductSupplier relationships
    const productSupplier = this.productSuppliers.find(ps => ps.productId === product.id);
    if (productSupplier) {
      return [productSupplier.factoryName || 'Unknown Supplier'];
    }
    
    // Fallback: try to get from product.supplierNames
    if (product.supplierNames && product.supplierNames.length > 0) {
      return product.supplierNames;
    }
    
    // Fallback: try to get from product.suppliers
    if (product.suppliers && product.suppliers.length > 0) {
      return product.suppliers;
    }
    
    return ['No Supplier'];
  }

  // Helper method to check if product has supplier information
  hasSupplierInfo(product: IProduct): boolean {
    return this.getSupplierNames(product).some(name => name !== 'No Supplier' && name !== 'Unknown Supplier');
  }

  // Helper method to safely get product property
  safeGetProperty<T>(product: IProduct | null, property: keyof IProduct, defaultValue: T): T {
    if (!product) return defaultValue;
    const value = product[property];
    if (value === null || value === undefined) {
      return defaultValue;
    }
    return value as T;
  }

  // Helper method to safely get approval status
  getSafeApprovalStatus(product: IProduct | null): ProductApprovalStatus {
    return this.safeGetProperty(product, 'approvalStatus', ProductApprovalStatus.Pending);
  }

  openEditModal(product: IProduct) {
    this.selectedProduct = product;
    this.form = { ...product };
    this.formErrors = {};
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

    if (!this.form.name || this.form.name.trim() === '') {
      this.formErrors['name'] = 'Product name is required';
    }

    if (!this.form.description || this.form.description.trim() === '') {
      this.formErrors['description'] = 'Product description is required';
    }

    if (!this.form.pricePerPiece || this.form.pricePerPiece <= 0) {
      this.formErrors['pricePerPiece'] = 'Price per piece must be greater than 0';
    }

    if (!this.form.noINStock || this.form.noINStock < 0) {
      this.formErrors['noINStock'] = 'Stock quantity cannot be negative';
    }

    if (!this.form.minNumToFactoryOrder || this.form.minNumToFactoryOrder <= 0) {
      this.formErrors['minNumToFactoryOrder'] = 'Minimum factory order must be greater than 0';
    }

    if (!this.form.subCategoryId) {
      this.formErrors['subCategoryId'] = 'Subcategory is required';
    }

    if (!this.form.shipping) {
      this.formErrors['shipping'] = 'Shipping type is required';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  saveProduct() {
    if (!this.validateForm()) return;

    this.isSubmitting = true;
    const updateData: ProductUpdateDto = {
      id: this.selectedProduct!.id,
      name: this.form.name!,
      description: this.form.description!,
      pricePerPiece: this.form.pricePerPiece!,
      pricePer50Piece: this.form.pricePer50Piece,
      pricePer100Piece: this.form.pricePer100Piece,
      noINStock: this.form.noINStock!,
      minNumToFactoryOrder: this.form.minNumToFactoryOrder!,
      approvalStatus: this.form.approvalStatus!,
      shipping: this.form.shipping!,
      subCategoryId: this.form.subCategoryId!,
      warrantyNMonths: this.form.warrantyNMonths,
      images: null // No image updates in admin edit for now
    };

    this.productService.updateProduct(updateData).subscribe({
      next: () => {
        this.loadProducts();
        this.showEditModal = false;
        this.isSubmitting = false;
        this.notificationService.showSuccess('Product updated successfully!');
      },
      error: (error) => {
        console.error('Error updating product:', error);
        this.isSubmitting = false;
        this.notificationService.showError('Failed to update product. Please try again.');
      }
    });
  }

  deleteProduct() {
    if (!this.selectedProduct) return;

    this.isSubmitting = true;
    this.productService.deleteProduct(this.selectedProduct.id).subscribe({
      next: () => {
        this.loadProducts();
        this.showDeleteModal = false;
        this.isSubmitting = false;
        this.notificationService.showSuccess('Product deleted successfully!');
      },
      error: (error) => {
        console.error('Error deleting product:', error);
        this.isSubmitting = false;
        this.notificationService.showError('Failed to delete product. Please try again.');
      }
    });
  }

  clearError(field: string) {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  getApprovalStatusLabel(status: ProductApprovalStatus): string {
    switch (status) {
      case ProductApprovalStatus.Pending:
        return 'Pending';
      case ProductApprovalStatus.Approved:
        return 'Approved';
      case ProductApprovalStatus.Rejected:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  getApprovalStatusClass(status: ProductApprovalStatus): string {
    switch (status) {
      case ProductApprovalStatus.Pending:
        return 'bg-yellow-100 text-yellow-800';
      case ProductApprovalStatus.Approved:
        return 'bg-green-100 text-green-800';
      case ProductApprovalStatus.Rejected:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getShippingTypeLabel(shipping: ShippingTypes): string {
    switch (shipping) {
      case ShippingTypes.Free:
        return 'Free Shipping';
      case ShippingTypes.FreeINSameGovernate:
        return 'Free in Same Governorate';
      case ShippingTypes.Paid:
        return 'Paid Shipping';
      case ShippingTypes.None:
        return 'No Shipping';
      default:
        return 'Unknown';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getStockStatus(product: IProduct): string {
    if (product.noINStock <= 0) return 'Out of Stock';
    if (product.noINStock <= 10) return 'Low Stock';
    return 'In Stock';
  }

  getStockClass(product: IProduct): string {
    if (product.noINStock <= 0) return 'text-red-600';
    if (product.noINStock <= 10) return 'text-yellow-600';
    return 'text-green-600';
  }

  getCategoryName(subCategoryId: string): string {
    const subcategory = this.subcategories.find(sub => sub.id === subCategoryId);
    if (subcategory) {
      // Since ISubCategory has categoryName directly, we can use it
      return subcategory.categoryName;
    }
    return 'Unknown Category';
  }
} 