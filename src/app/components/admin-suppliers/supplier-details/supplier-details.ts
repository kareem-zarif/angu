import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminSuppliersService } from '../../../services/admin-suppliers.service';
import { SupplierResDto } from '../../../models/supplier';

@Component({
  selector: 'app-supplier-details',
  templateUrl: './supplier-details.html',
  styleUrls: ['./supplier-details.css'],
  standalone: true,
  imports: [CommonModule]
})
export class SupplierDetailsComponent implements OnInit {
  supplier: SupplierResDto | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supplierService: AdminSuppliersService
  ) {}

  ngOnInit(): void {
    this.loadSupplierDetails();
  }

  loadSupplierDetails() {
    const supplierId = this.route.snapshot.paramMap.get('id');
    if (!supplierId) {
      this.error = 'Supplier ID not found';
      this.loading = false;
      return;
    }

    this.supplierService.getById(supplierId).subscribe({
      next: (supplier) => {
        this.supplier = supplier;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading supplier details:', error);
        this.error = 'Failed to load supplier details';
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/suppliers']);
  }

  editSupplier() {
    if (this.supplier) {
      this.router.navigate(['/admin/suppliers/edit', this.supplier.id]);
    }
  }

  getFullName(): string {
    if (!this.supplier) return '';
    return `${this.supplier.firstName} ${this.supplier.lastName}`;
  }

  getLocation(): string {
    if (!this.supplier) return 'N/A';
    if (this.supplier.city && this.supplier.state) {
      return `${this.supplier.city}, ${this.supplier.state}`;
    } else if (this.supplier.city) {
      return this.supplier.city;
    } else if (this.supplier.state) {
      return this.supplier.state;
    }
    return 'N/A';
  }

  getProductSuppliersCount(): number {
    return this.supplier?.productSuppliers?.length || 0;
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  }
} 