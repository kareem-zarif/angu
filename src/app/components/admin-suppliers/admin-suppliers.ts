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
  form: Partial<SupplierCreateDto & { phoneNumber?: string }> = {};
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
   
    this.service.getAll().subscribe({
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
        case 'phoneNumber':
          return supplier.phoneNumber.toLowerCase().includes(searchLower);
        case 'all':
        default:
          return (
            this.getFullName(supplier).toLowerCase().includes(searchLower) ||
            supplier.factoryName.toLowerCase().includes(searchLower) ||
            supplier.phoneNumber.toLowerCase().includes(searchLower) ||
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
    // Since the backend doesn't support creating suppliers from admin panel,
    // we'll show an error message instead
    this.notificationService.showError('Supplier creation is not available. Suppliers must be created through the registration process.');
  }
 
  openEdit(supplier: SupplierResDto) {
    this.isEditing = true;
    this.editingId = supplier.id;
    this.form = {
      firstName: supplier.firstName,
      lastName: supplier.lastName,
      phoneNumber: supplier.phoneNumber,
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
 
    if (!this.form.phoneNumber?.trim()) {
      this.formErrors['phoneNumber'] = 'Phone number is required';
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
        phoneNumber: this.form.phoneNumber!,
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
        phoneNumber: this.form.phoneNumber!,
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
    // Find the supplier to get their name for confirmation
    const supplier = this.suppliers.find(s => s.id === id);
    if (!supplier) {
      this.notificationService.showError('Supplier not found');
      return;
    }

    const supplierName = this.getFullName(supplier);
    const productCount = this.getProductSuppliersCount(supplier);
    
    // Show confirmation dialog
    const confirmMessage = productCount > 0 
      ? `Are you sure you want to delete ${supplierName}? This will also remove ${productCount} associated product${productCount > 1 ? 's' : ''}.`
      : `Are you sure you want to delete ${supplierName}?`;

    if (confirm(confirmMessage)) {
      console.log(`Deleting supplier: ${supplierName} (ID: ${id})`);
      
      this.service.delete(id).subscribe({
        next: (deletedSupplier) => {
          console.log('Supplier deleted successfully:', deletedSupplier);
          this.notificationService.showSuccess(`Supplier ${supplierName} has been deleted successfully`);
          this.loadSuppliers(); // Refresh the list
        },
        error: (error) => {
          console.error('Error deleting supplier:', error);
          let errorMessage = 'Failed to delete supplier';
          
          if (error.status === 404) {
            errorMessage = 'Supplier not found';
          } else if (error.status === 500) {
            errorMessage = 'Server error occurred while deleting supplier';
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          }
          
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