import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Supplier, SupplierCreateDto, SupplierResDto, SupplierUpdateDto } from '../../models/supplier';
import { AdminSuppliersService } from '../../services/admin-suppliers.service';
import { NotificationService } from '../../services/notification.service';
import { PaginationComponent } from '../shared/pagination/pagination';

@Component({
  selector: 'app-admin-suppliers',
  templateUrl: './admin-suppliers.html',
  styleUrls: ['./admin-suppliers.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent]
})
export class AdminSuppliersComponent implements OnInit {
  suppliers: SupplierResDto[] = [];
  filteredSuppliers: SupplierResDto[] = [];
  form: Partial<SupplierCreateDto> = {};
  isEditing = false;
  editingId: string | null = null;
  showModal = false;
  formErrors: { [key: string]: string } = {};
  isSubmitting = false;
  loading = false;
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 1;
  
  // Search properties
  searchTerm = '';
  searchField = 'all'; // 'all', 'name', 'factory', 'phone'

  constructor(
    private service: AdminSuppliersService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.loading = true;
    console.log('Loading suppliers...');
    
    // Clear existing data first
    this.suppliers = [];
    this.filteredSuppliers = [];
    
    this.service.getAllWithProductCounts().subscribe({
      next: (data) => {
        console.log('Loaded suppliers with product counts:', data);
        this.suppliers = data;
        this.applyFilters();
        this.loading = false;
        console.log(`Successfully loaded ${this.suppliers.length} suppliers`);
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.notificationService.showError('Failed to load suppliers');
        this.loading = false;
      }
    });
  }

  applyFilters() {
    // Apply search filter
    this.filteredSuppliers = this.suppliers.filter(supplier => {
      if (!this.searchTerm) return true;
      
      const searchLower = this.searchTerm.toLowerCase();
      
      switch (this.searchField) {
        case 'name':
          return this.getFullName(supplier).toLowerCase().includes(searchLower);
        case 'factory':
          return supplier.factoryName.toLowerCase().includes(searchLower);
        case 'phone':
          return supplier.phone.toLowerCase().includes(searchLower);
        case 'all':
        default:
          return (
            this.getFullName(supplier).toLowerCase().includes(searchLower) ||
            supplier.factoryName.toLowerCase().includes(searchLower) ||
            supplier.phone.toLowerCase().includes(searchLower) ||
            (supplier.description && supplier.description.toLowerCase().includes(searchLower))
          );
      }
    });
    
    // Update pagination
    this.totalItems = this.filteredSuppliers.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Reset to first page if current page is out of bounds
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  getPaginatedSuppliers(): SupplierResDto[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredSuppliers.slice(startIndex, endIndex);
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

  openAdd() {
    this.isEditing = false;
    this.editingId = null;
    this.form = {};
    this.formErrors = {};
    this.showModal = true;
  }

  openEdit(supplier: SupplierResDto) {
    this.isEditing = true;
    this.editingId = supplier.id;
    this.form = {
      firstName: supplier.firstName,
      lastName: supplier.lastName,
      phone: supplier.phone,
      factoryName: supplier.factoryName,
      description: supplier.description
    };
    this.formErrors = {};
    this.showModal = true;
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.form.firstName?.trim()) {
      this.formErrors['firstName'] = 'First name is required';
    }

    if (!this.form.lastName?.trim()) {
      this.formErrors['lastName'] = 'Last name is required';
    }

    if (!this.form.phone?.trim()) {
      this.formErrors['phone'] = 'Phone number is required';
    }

    if (!this.form.factoryName?.trim()) {
      this.formErrors['factoryName'] = 'Factory name is required';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  saveSupplier() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    if (this.isEditing && this.editingId) {
      const updateDto: SupplierUpdateDto = {
        id: this.editingId,
        firstName: this.form.firstName!,
        lastName: this.form.lastName!,
        phone: this.form.phone!,
        factoryName: this.form.factoryName!,
        description: this.form.description
      };
      
      this.service.update(updateDto).subscribe({
        next: () => {
          this.loadSuppliers();
          this.showModal = false;
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error updating supplier:', error);
          this.formErrors['general'] = 'Failed to update supplier';
          this.isSubmitting = false;
        }
      });
    } else {
      const createDto: SupplierCreateDto = {
        firstName: this.form.firstName!,
        lastName: this.form.lastName!,
        phone: this.form.phone!,
        factoryName: this.form.factoryName!,
        description: this.form.description
      };
      
      this.service.create(createDto).subscribe({
        next: () => {
          this.loadSuppliers();
          this.showModal = false;
          this.isSubmitting = false;

          // Create notification for admin about new supplier
          const supplierName = `${this.form.firstName!} ${this.form.lastName!}`;
          this.notificationService.createNewSupplierNotification(supplierName).subscribe({
            next: () => console.log('Notification created for new supplier'),
            error: (error) => console.error('Error creating notification:', error)
          });
        },
        error: (error) => {
          console.error('Error creating supplier:', error);
          this.formErrors['general'] = 'Failed to create supplier';
          this.isSubmitting = false;
        }
      });
    }
  }

  deleteSupplier(id: string) {
    // Find the supplier to check if they have products
    const supplier = this.suppliers.find(s => s.id === id);
    if (!supplier) {
      this.notificationService.showError('Supplier not found.');
      return;
    }

    const productCount = this.getProductSuppliersCount(supplier);
    let confirmMessage = 'Are you sure you want to delete this supplier?';
    
    if (productCount > 0) {
      confirmMessage = `WARNING: This supplier has ${productCount} product(s). Deleting them will also remove all associated products. Are you sure you want to continue?`;
    }

    if (confirm(confirmMessage)) {
      // Set loading state
      this.loading = true;
      console.log(`Starting deletion of supplier: ${supplier.factoryName} (ID: ${id})`);
      
      this.service.delete(id).subscribe({
        next: (response) => {
          console.log('Supplier deletion response:', response);
          
          // Remove the supplier from the local array immediately
          this.suppliers = this.suppliers.filter(s => s.id !== id);
          
          // Apply filters to update the display
          this.applyFilters();
          
          // Show success message
          this.notificationService.showSuccess(`Supplier "${supplier.factoryName}" deleted successfully!`);
          
          // Force a fresh reload from the server to ensure data consistency
          setTimeout(() => {
            this.loadSuppliers();
          }, 500);
        },
        error: (error) => {
          console.error('Error deleting supplier:', error);
          this.loading = false;
          
          // Provide more specific error messages
          let errorMessage = 'Failed to delete supplier. Please try again.';
          
          if (error.status === 400) {
            errorMessage = 'Cannot delete supplier: Invalid request.';
          } else if (error.status === 401) {
            errorMessage = 'Unauthorized: Please login again.';
          } else if (error.status === 403) {
            errorMessage = 'Access denied: You may not have permission to delete suppliers.';
          } else if (error.status === 404) {
            errorMessage = 'Supplier not found. It may have been deleted already.';
          } else if (error.status === 409) {
            errorMessage = 'Cannot delete supplier: They have active products or orders.';
          } else if (error.status === 500) {
            errorMessage = 'Server error: Please try again later.';
          } else if (error.error && error.error.message) {
            errorMessage = `Error: ${error.error.message}`;
          } else if (error.message) {
            errorMessage = `Error: ${error.message}`;
          }
          
          // Show error message
          this.notificationService.showError(errorMessage);
        }
      });
    }
  }

  clearError(field: string) {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  getProductSuppliersCount(supplier: SupplierResDto): number {
    // Ensure productSuppliers exists and has length
    if (supplier.productSuppliers && Array.isArray(supplier.productSuppliers)) {
      const count = supplier.productSuppliers.length;
      console.log(`Supplier ${supplier.factoryName} has ${count} products:`, supplier.productSuppliers);
      return count;
    }
    console.log(`Supplier ${supplier.factoryName} has no productSuppliers or invalid data:`, supplier.productSuppliers);
    return 0;
  }

  // Check if supplier can be safely deleted
  canDeleteSupplier(supplier: SupplierResDto): boolean {
    const productCount = this.getProductSuppliersCount(supplier);
    return productCount === 0;
  }

  // Get delete button tooltip text
  getDeleteButtonTooltip(supplier: SupplierResDto): string {
    const productCount = this.getProductSuppliersCount(supplier);
    if (productCount === 0) {
      return 'Delete supplier';
    } else {
      return `Delete supplier (will also remove ${productCount} product${productCount > 1 ? 's' : ''})`;
    }
  }

  // Force refresh data and verify deletion
  forceRefreshData() {
    console.log('Force refreshing supplier data...');
    this.loadSuppliers();
  }

  // Check if a specific supplier still exists
  checkSupplierExists(supplierId: string): void {
    console.log(`Checking if supplier ${supplierId} still exists...`);
    this.service.getById(supplierId).subscribe({
      next: (supplier) => {
        console.log(`Supplier ${supplierId} still exists:`, supplier);
        this.notificationService.showError('Supplier still exists on server. Refreshing data...');
        this.loadSuppliers();
      },
      error: (error) => {
        if (error.status === 404) {
          console.log(`Supplier ${supplierId} successfully deleted from server`);
        } else {
          console.error(`Error checking supplier existence:`, error);
        }
      }
    });
  }

  getFullName(supplier: SupplierResDto): string {
    return `${supplier.firstName} ${supplier.lastName}`;
  }

  viewDetails(supplierId: string) {
    this.router.navigate(['/admin/suppliers/details', supplierId]);
  }
} 