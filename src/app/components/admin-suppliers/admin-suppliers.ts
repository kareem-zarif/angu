import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Supplier, SupplierCreateDto, SupplierResDto, SupplierUpdateDto } from '../../models/supplier';
import { AdminSuppliersService } from '../../services/admin-suppliers.service';
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.suppliers = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        alert('Failed to load suppliers');
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
    if (confirm('Are you sure you want to delete this supplier?')) {
      this.service.delete(id).subscribe({
        next: () => this.loadSuppliers(),
        error: (error) => {
          console.error('Error deleting supplier:', error);
          alert('Failed to delete supplier');
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
    return supplier.productSuppliers?.length || 0;
  }

  getFullName(supplier: SupplierResDto): string {
    return `${supplier.firstName} ${supplier.lastName}`;
  }

  viewDetails(supplierId: string) {
    this.router.navigate(['/admin/suppliers/details', supplierId]);
  }
} 