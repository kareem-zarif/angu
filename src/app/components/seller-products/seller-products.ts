import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminProductsService } from '../../services/admin-products-service';
import { IProduct, ProductApprovalStatus, ShippingTypes } from '../../models/i-product';
import { PaginationComponent } from '../shared/pagination/pagination';

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

  constructor(private productService: AdminProductsService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = null;

    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
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
      noINStock: 0,
      minNumToFactoryOrder: 1,
      approvalStatus: ProductApprovalStatus.Pending,
      shipping: ShippingTypes.Free,
      subCategoryId: '',
      productPicsPathes: []
    };
    this.formErrors = {};
    this.showAddModal = true;
  }

  openEditModal(product: IProduct) {
    this.selectedProduct = product;
    this.form = { ...product };
    // Sellers cannot change approval status, so we don't include it in the form
    delete this.form.approvalStatus;
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

    if (!this.form.name?.trim()) {
      this.formErrors['name'] = 'Product name is required';
    }

    if (!this.form.description?.trim()) {
      this.formErrors['description'] = 'Product description is required';
    }

    if (!this.form.pricePerPiece || this.form.pricePerPiece <= 0) {
      this.formErrors['pricePerPiece'] = 'Price must be greater than 0';
    }

    if (this.form.noINStock === undefined || this.form.noINStock < 0) {
      this.formErrors['noINStock'] = 'Stock quantity must be 0 or greater';
    }

    if (!this.form.subCategoryId) {
      this.formErrors['subCategoryId'] = 'Subcategory is required';
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
      const updateData: IProduct = {
        ...this.selectedProduct,
        ...this.form,
        approvalStatus: this.selectedProduct.approvalStatus // Keep original approval status
      };

      this.productService.updateProduct(updateData).subscribe({
        next: () => {
          this.loadProducts();
          this.showEditModal = false;
          this.isSubmitting = false;
          alert('Product updated successfully!');
        },
        error: (error) => {
          console.error('Error updating product:', error);
          this.isSubmitting = false;
          alert('Failed to update product. Please try again.');
        }
      });
    } else {
      // Create new product
      const createData: IProduct = {
        ...this.form as IProduct,
        id: ''
      };

      this.productService.createProduct(createData).subscribe({
        next: () => {
          this.loadProducts();
          this.showAddModal = false;
          this.isSubmitting = false;
          alert('Product created successfully!');
        },
        error: (error) => {
          console.error('Error creating product:', error);
          this.isSubmitting = false;
          alert('Failed to create product. Please try again.');
        }
      });
    }
  }

  deleteProduct() {
    if (!this.selectedProduct) return;

    this.isSubmitting = true;

    this.productService.deleteProduct(this.selectedProduct.id).subscribe({
      next: () => {
        this.loadProducts();
        this.showDeleteModal = false;
        this.isSubmitting = false;
        alert('Product deleted successfully!');
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
} 