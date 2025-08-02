import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IProduct, ProductCreateDto, ProductUpdateDto, ProductApprovalStatus, ShippingTypes } from '../../models/i-product';
import { AdminProductsService } from '../../services/admin-products-service';
import { PaginationComponent } from '../shared/pagination/pagination';

@Component({
  selector: 'app-admin-products',
  templateUrl: './admin-products.html',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent]
})
export class AdminProductsComponent implements OnInit {
  // Data properties
  products: IProduct[] = [];
  filteredProducts: IProduct[] = [];
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 1;
  
  // Search properties
  searchTerm = '';
  searchField = 'all'; // 'all', 'name', 'description', 'category', 'status'
  
  // Modal states
  showModal = false;
  showDetailsModal = false;
  showImageModal = false;
  isEditing = false;
  editingProductId: string | null = null;
  
  // Selected items
  selectedProduct: IProduct | null = null;
  selectedImage: string = '';
  selectedFiles: File[] = [];
  
  // Form data
  form: Partial<ProductCreateDto> = {};
  formErrors: { [key: string]: string } = {};
  isSubmitting = false;
  
  // Dropdown options
  approvalStatuses = [
    { value: ProductApprovalStatus.Pending, label: 'Pending' },
    { value: ProductApprovalStatus.Approved, label: 'Approved' },
    { value: ProductApprovalStatus.Rejected, label: 'Rejected' }
  ];
  
  shippingTypes = [
    { value: ShippingTypes.Free, label: 'Free' },
    { value: ShippingTypes.FreeINSameGovernate, label: 'Free in Same Governate' },
    { value: ShippingTypes.Paid, label: 'Paid' },
    { value: ShippingTypes.None, label: 'None' }
  ];

  constructor(private productsService: AdminProductsService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  // Load all products
  loadProducts(): void {
    this.productsService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading products:', error);
        alert('Failed to load products. Please try again.');
      }
    });
  }

  applyFilters() {
    // Apply search filter
    this.filteredProducts = this.products.filter(product => {
      if (!this.searchTerm) return true;
      
      const searchLower = this.searchTerm.toLowerCase();
      
      switch (this.searchField) {
        case 'name':
          return product.name.toLowerCase().includes(searchLower);
        case 'description':
          return product.description.toLowerCase().includes(searchLower);
        case 'category':
          return product.subCategoryId.toLowerCase().includes(searchLower);
        case 'status':
          return this.getApprovalStatusLabel(product.approvalStatus).toLowerCase().includes(searchLower);
        case 'all':
        default:
          return (
            product.name.toLowerCase().includes(searchLower) ||
            product.description.toLowerCase().includes(searchLower) ||
            product.subCategoryId.toLowerCase().includes(searchLower) ||
            this.getApprovalStatusLabel(product.approvalStatus).toLowerCase().includes(searchLower) ||
            product.pricePerPiece.toString().includes(searchLower)
          );
      }
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
    this.currentPage = 1; // Reset to first page
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
  }

  onSearch() {
    this.currentPage = 1; // Reset to first page when searching
    this.applyFilters();
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchField = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }

  // Open add product modal
  openAdd(): void {
    this.isEditing = false;
    this.editingProductId = null;
    this.form = {
      name: '',
      description: '',
      pricePerPiece: 0,
      noINStock: 0,
      minNumToFactoryOrder: 1,
      approvalStatus: ProductApprovalStatus.Pending,
      shipping: ShippingTypes.None,
      subCategoryId: ''
    };
    this.selectedFiles = [];
    this.formErrors = {};
    this.showModal = true;
  }

  // Open edit product modal
  openEdit(product: IProduct): void {
    this.isEditing = true;
    this.editingProductId = product.id;
    this.form = {
      name: product.name,
      description: product.description,
      pricePerPiece: product.pricePerPiece,
      pricePer50Piece: product.pricePer50Piece,
      pricePer100Piece: product.pricePer100Piece,
      noINStock: product.noINStock,
      minNumToFactoryOrder: product.minNumToFactoryOrder,
      approvalStatus: product.approvalStatus,
      warrantyNMonths: product.warrantyNMonths,
      shipping: product.shipping,
      subCategoryId: product.subCategoryId
    };
    this.selectedFiles = [];
    this.formErrors = {};
    this.showModal = true;
  }

  // Handle file selection
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
      this.clearError('images');
    }
  }

  // Save product (create or update)
  saveProduct(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.formErrors = {};

    if (this.isEditing && this.editingProductId) {
      // Update existing product
      const updateData: ProductUpdateDto = {
        id: this.editingProductId,
        name: this.form.name!,
        description: this.form.description!,
        pricePerPiece: this.form.pricePerPiece!,
        pricePer50Piece: this.form.pricePer50Piece,
        pricePer100Piece: this.form.pricePer100Piece,
        noINStock: this.form.noINStock!,
        minNumToFactoryOrder: this.form.minNumToFactoryOrder!,
        approvalStatus: this.form.approvalStatus!,
        warrantyNMonths: this.form.warrantyNMonths,
        shipping: this.form.shipping!,
        subCategoryId: this.form.subCategoryId!,
        images: this.selectedFiles.length > 0 ? this.selectedFiles : null
      };

      this.productsService.updateProduct(updateData).subscribe({
        next: (response) => {
          console.log('Product updated successfully:', response);
          this.loadProducts();
          this.showModal = false;
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error updating product:', error);
          this.formErrors['general'] = 'Failed to update product. Please try again.';
          this.isSubmitting = false;
        }
      });
    } else {
      // Create new product
      const createData: ProductCreateDto = {
        name: this.form.name!,
        description: this.form.description!,
        pricePerPiece: this.form.pricePerPiece!,
        pricePer50Piece: this.form.pricePer50Piece,
        pricePer100Piece: this.form.pricePer100Piece,
        noINStock: this.form.noINStock!,
        minNumToFactoryOrder: this.form.minNumToFactoryOrder!,
        approvalStatus: this.form.approvalStatus!,
        warrantyNMonths: this.form.warrantyNMonths,
        shipping: this.form.shipping!,
        subCategoryId: this.form.subCategoryId!,
        images: this.selectedFiles
      };

      this.productsService.createProduct(createData).subscribe({
        next: (response) => {
          console.log('Product created successfully:', response);
          this.loadProducts();
          this.showModal = false;
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error creating product:', error);
          this.formErrors['general'] = 'Failed to create product. Please try again.';
          this.isSubmitting = false;
        }
      });
    }
  }

  // Delete product
  deleteProduct(id: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productsService.deleteProduct(id).subscribe({
        next: (response) => {
          console.log('Product deleted successfully:', response);
          this.loadProducts();
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          alert('Failed to delete product. Please try again.');
        }
      });
    }
  }

  // Update product approval status
  updateProductApprovalStatus(product: IProduct, event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newStatus = parseInt(selectElement.value) as ProductApprovalStatus;

    if (newStatus === product.approvalStatus) {
      return; // No change needed
    }

    this.isSubmitting = true;

    const updateData: ProductUpdateDto = {
      id: product.id,
      name: product.name,
      description: product.description,
      pricePerPiece: product.pricePerPiece,
      pricePer50Piece: product.pricePer50Piece,
      pricePer100Piece: product.pricePer100Piece,
      noINStock: product.noINStock,
      minNumToFactoryOrder: product.minNumToFactoryOrder,
      approvalStatus: newStatus,
      warrantyNMonths: product.warrantyNMonths,
      shipping: product.shipping,
      subCategoryId: product.subCategoryId,
      images: null
    };

    this.productsService.updateProduct(updateData).subscribe({
      next: (response) => {
        console.log('Product status updated successfully:', response);
        product.approvalStatus = newStatus;
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error updating product status:', error);
        selectElement.value = product.approvalStatus.toString();
        this.isSubmitting = false;
        alert('Failed to update product status. Please try again.');
      }
    });
  }

  // View product details
  viewDetails(product: IProduct): void {
    this.selectedProduct = product;
    this.showDetailsModal = true;
  }

  // Open image modal
  openImageModal(imagePath: string): void {
    this.selectedImage = this.getImageUrl(imagePath);
    this.showImageModal = true;
  }

  // Get image URL
  getImageUrl(imagePath: string): string {
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    if (imagePath.startsWith('/uploads/')) {
      return `https://localhost:7253${imagePath}`;
    }
    return imagePath;
  }

  // Handle image error
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images.jpeg';
  }

  // Clear form error
  clearError(field: string): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  // Validate form
  validateForm(): boolean {
    this.formErrors = {};

    if (!this.form.name?.trim()) {
      this.formErrors['name'] = 'Name is required';
    }

    if (!this.form.description?.trim()) {
      this.formErrors['description'] = 'Description is required';
    }

    if (!this.form.pricePerPiece || this.form.pricePerPiece <= 0) {
      this.formErrors['pricePerPiece'] = 'Price per piece must be greater than 0';
    }

    if (!this.form.noINStock || this.form.noINStock < 0) {
      this.formErrors['noINStock'] = 'Stock must be 0 or greater';
    }

    if (!this.form.minNumToFactoryOrder || this.form.minNumToFactoryOrder < 1) {
      this.formErrors['minNumToFactoryOrder'] = 'Minimum factory order must be at least 1';
    }

    if (!this.form.subCategoryId?.trim()) {
      this.formErrors['subCategoryId'] = 'Sub-category ID is required';
    }

    if (!this.isEditing && (!this.selectedFiles || this.selectedFiles.length === 0)) {
      this.formErrors['images'] = 'At least one image is required for new products';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  // Helper methods for display
  getApprovalStatusLabel(status: ProductApprovalStatus): string {
    const statusObj = this.approvalStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : 'Unknown';
  }

  getApprovalStatusClass(status: ProductApprovalStatus): string {
    switch (status) {
      case ProductApprovalStatus.Approved:
        return 'bg-green-200 text-green-800';
      case ProductApprovalStatus.Rejected:
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-yellow-200 text-yellow-800';
    }
  }

  getShippingLabel(shipping: ShippingTypes): string {
    const shippingObj = this.shippingTypes.find(s => s.value === shipping);
    return shippingObj ? shippingObj.label : 'Unknown';
  }

  getShippingClass(shipping: ShippingTypes): string {
    switch (shipping) {
      case ShippingTypes.Free:
        return 'bg-green-200 text-green-800';
      case ShippingTypes.Paid:
        return 'bg-red-200 text-red-800';
      case ShippingTypes.FreeINSameGovernate:
        return 'bg-blue-200 text-blue-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  }
} 