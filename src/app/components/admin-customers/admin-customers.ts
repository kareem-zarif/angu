import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCustomersService, Customer, CustomerCreateDto, CustomerUpdateDto } from '../../services/admin-customers-service';
import { NotificationService } from '../../services/notification.service';
import { PaginationComponent } from '../shared/pagination/pagination';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './admin-customers.html',
})
export class AdminCustomersComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  loading = false;

  showModal = false;
  editCustomer: Customer | null = null;
  form: Partial<Customer> = {};

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 1;

  // Search properties
  searchTerm = '';
  searchField = 'all'; // 'all', 'name', 'phone'

  // Validation properties
  formErrors: { [key: string]: string } = {};
  isSubmitting = false;

  // Details modal properties
  showDetailsModal = false;
  selectedCustomer: Customer | null = null;
  detailsLoading = false;

  constructor(private customersService: AdminCustomersService, private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading = true;
    this.customersService.getCustomers().subscribe({
      next: (res) => {
        console.log('Customers loaded:', res);
        this.customers = res;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    // Apply search filter
    this.filteredCustomers = this.customers.filter(customer => {
      if (!this.searchTerm) return true;

      const searchLower = this.searchTerm.toLowerCase();

      switch (this.searchField) {
        case 'name':
          return this.getFullName(customer).toLowerCase().includes(searchLower);
        case 'phone':
          return customer.PhoneNumber.toLowerCase().includes(searchLower);
        case 'all':
        default:
          return (
            this.getFullName(customer).toLowerCase().includes(searchLower) ||
            customer.PhoneNumber.toLowerCase().includes(searchLower)
          );
      }
    });

    // Update pagination
    this.totalItems = this.filteredCustomers.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    // Reset to first page if current page is out of bounds
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  getPaginatedCustomers(): Customer[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCustomers.slice(startIndex, endIndex);
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
    this.editCustomer = null;
    this.form = {};
    this.formErrors = {};
    this.showModal = true;
  }

  openEdit(customer: Customer) {
    this.editCustomer = customer;
    this.form = { ...customer };
    this.formErrors = {};
    this.showModal = true;
  }

  openDetails(customer: Customer) {
    this.selectedCustomer = customer;
    this.showDetailsModal = true;
  }

  closeDetails() {
    this.showDetailsModal = false;
    this.selectedCustomer = null;
  }

  validateForm(): boolean {
    this.formErrors = {};

    // First Name validation
    if (!this.form.firstName || this.form.firstName.trim() === '') {
      this.formErrors['firstName'] = 'First name is required';
    } else if (this.form.firstName.trim().length < 2) {
      this.formErrors['firstName'] = 'First name must be at least 2 characters long';
    } else if (this.form.firstName.trim().length > 50) {
      this.formErrors['firstName'] = 'First name cannot exceed 50 characters';
    }

    // Last Name validation
    if (!this.form.lastName || this.form.lastName.trim() === '') {
      this.formErrors['lastName'] = 'Last name is required';
    } else if (this.form.lastName.trim().length < 2) {
      this.formErrors['lastName'] = 'Last name must be at least 2 characters long';
    } else if (this.form.lastName.trim().length > 50) {
      this.formErrors['lastName'] = 'Last name cannot exceed 50 characters';
    }

    // Phone validation
    if (!this.form.PhoneNumber || this.form.PhoneNumber.trim() === '') {
      this.formErrors['phone'] = 'Phone number is required';
    } else {
      const phoneRegex = /^(010|011|012|15)\d{8,10}$/;
      if (!phoneRegex.test(this.form.PhoneNumber.trim())) {
        this.formErrors['phone'] = 'Phone number must start with 010, 011, 012, or 15 and be between 11 and 13 digits';
      }
    }

    return Object.keys(this.formErrors).length === 0;
  }

  saveCustomer() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    if (this.editCustomer) {
      // Update
      const updateDto: CustomerUpdateDto = {
        id: this.editCustomer.id,
        firstName: this.form.firstName!.trim(),
        lastName: this.form.lastName!.trim(),
        phone: this.form.PhoneNumber!.trim(),
      };
      console.log('Updating customer with data:', updateDto);
      this.customersService.updateCustomer(updateDto).subscribe({
        next: (response) => {
          console.log('Customer updated successfully:', response);
          this.showModal = false;
          this.loadCustomers();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error updating customer:', error);
          console.error('Error details:', error.error);
          this.formErrors['general'] = `Failed to update customer: ${error.error?.message || error.message || 'Unknown error'}`;
          this.isSubmitting = false;
        }
      });
    } else {
      // Create
      const createDto: CustomerCreateDto = {
        firstName: this.form.firstName!.trim(),
        lastName: this.form.lastName!.trim(),
        phone: this.form.PhoneNumber!.trim(),
      };
      console.log('Creating customer with data:', createDto);
      this.customersService.createCustomer(createDto).subscribe({
        next: (response) => {
          console.log('Customer created successfully:', response);
          this.showModal = false;
          this.loadCustomers();
          this.isSubmitting = false;

          // Create notification for admin about new customer
          const customerName = `${this.form.firstName!.trim()} ${this.form.lastName!.trim()}`;
          this.notificationService.createNewCustomerNotification(customerName).subscribe({
            next: () => console.log('Notification created for new customer'),
            error: (error) => console.error('Error creating notification:', error)
          });
        },
        error: (error) => {
          console.error('Error creating customer:', error);
          console.error('Error details:', error.error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          this.formErrors['general'] = `Failed to create customer: ${error.error?.message || error.message || 'Unknown error'}`;
          this.isSubmitting = false;
        }
      });
    }
  }

  deleteCustomer(customer: Customer) {
    const fullName = `${customer.firstName} ${customer.lastName}`;
    if (confirm(`Are you sure you want to delete the customer "${fullName}"?`)) {
      this.customersService.deleteCustomer(customer.id).subscribe({
        next: () => {
          this.loadCustomers();
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          alert('Failed to delete customer. Please try again.');
        }
      });
    }
  }

  clearError(field: string) {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  getFullName(customer: Customer): string {
    return `${customer.firstName} ${customer.lastName}`;
  }
}
