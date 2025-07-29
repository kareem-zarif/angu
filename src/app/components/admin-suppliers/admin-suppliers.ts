import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSuppliersService, Supplier } from '../../services/admin-suppliers-service';

@Component({
  selector: 'app-admin-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-suppliers.html',
})
export class AdminSuppliersComponent implements OnInit {
  suppliers: Supplier[] = [];
  totalSuppliers = 0;
  searchQuery = '';
  sortBy: keyof Supplier = 'name';
  sortDir: 'asc' | 'desc' = 'asc';
  page = 1;
  pageSize = 7;
  loading = false;

  showModal = false;
  editSupplier: Supplier | null = null;
  form: Partial<Supplier> = {};

  constructor(private suppliersService: AdminSuppliersService) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.loading = true;
    this.suppliersService.getSuppliers({
      search: this.searchQuery,
      sortBy: this.sortBy,
      sortDir: this.sortDir,
      page: this.page,
      pageSize: this.pageSize,
    }).subscribe(res => {
      this.suppliers = res.data;
      this.totalSuppliers = res.total;
      this.loading = false;
    });
  }

  onSearch() {
    this.page = 1;
    this.loadSuppliers();
  }

  onSort(col: keyof Supplier) {
    if (this.sortBy === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = col;
      this.sortDir = 'asc';
    }
    this.loadSuppliers();
  }

  onPageChange(page: number) {
    this.page = page;
    this.loadSuppliers();
  }

  openAdd() {
    this.editSupplier = null;
    this.form = {};
    this.showModal = true;
  }

  openEdit(supplier: Supplier) {
    this.editSupplier = supplier;
    this.form = { ...supplier };
    this.showModal = true;
  }

  saveSupplier() {
    if (this.editSupplier) {
      this.suppliersService.updateSupplier(this.editSupplier.id, this.form).subscribe(() => {
        this.showModal = false;
        this.loadSuppliers();
      });
    } else {
      this.suppliersService.createSupplier(this.form as Omit<Supplier, 'id'>).subscribe(() => {
        this.showModal = false;
        this.loadSuppliers();
      });
    }
  }

  deleteSupplier(supplier: Supplier) {
    if (confirm('Delete this supplier?')) {
      this.suppliersService.deleteSupplier(supplier.id).subscribe(() => {
        this.loadSuppliers();
      });
    }
  }

  get totalPages() {
    return Math.ceil(this.totalSuppliers / this.pageSize);
  }

  get pages() {
    return Array.from({ length: this.totalSuppliers / this.pageSize }, (_, i) => i + 1);
  }
} 