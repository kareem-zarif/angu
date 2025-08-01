import { Component, OnInit } from '@angular/core';
import { AdminProductsService } from '../../services/admin-products-service';
import { IProduct } from '../../models/i-product';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products.html',
})
export class AdminProductsComponent implements OnInit {
  products: IProduct[] = [];
  totalProducts = 0;
  searchQuery = '';
  sortBy: keyof IProduct = 'name';
  sortDir: 'asc' | 'desc' = 'asc';
  page = 1;
  pageSize = 7;
  loading = false;

  // For add/edit modal
  showModal = false;
  editProduct: IProduct | null = null;
  form: Partial<IProduct> = {};

  constructor(private productsService: AdminProductsService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.productsService.getProducts({
      search: this.searchQuery,
      sortBy: this.sortBy,
      sortDir: this.sortDir,
      page: this.page,
      pageSize: this.pageSize,
    }).subscribe(res => {
      this.products = res.data;
      this.totalProducts = res.total;
      this.loading = false;
    });
  }

  onSearch() {
    this.page = 1;
    this.loadProducts();
  }

  onSort(col: keyof IProduct) {
    if (this.sortBy === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = col;
      this.sortDir = 'asc';
    }
    this.loadProducts();
  }

  onPageChange(page: number) {
    this.page = page;
    this.loadProducts();
  }

  openAdd() {
    this.editProduct = null;
    this.form = {};
    this.showModal = true;
  }

  openEdit(product: IProduct) {
    this.editProduct = product;
    this.form = { ...product };
    this.showModal = true;
  }

  saveProduct() {
    if (this.editProduct) {
      this.productsService.updateProduct(this.editProduct.id, this.form).subscribe(() => {
        this.showModal = false;
        this.loadProducts();
      });
    } else {
      this.productsService.createProduct(this.form as Omit<IProduct, 'id'>).subscribe(() => {
        this.showModal = false;
        this.loadProducts();
      });
    }
  }

  deleteProduct(product: IProduct) {
    if (confirm('Delete this product?')) {
      this.productsService.deleteProduct(product.id).subscribe(() => {
        this.loadProducts();
      });
    }
  }

  get totalPages() {
    return Math.ceil(this.totalProducts / this.pageSize);
  }

  get pages() {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
} 