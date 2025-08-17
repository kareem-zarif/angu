import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environment/environment';

export interface ProductSupplierCreateDto {
  productId: string;
  supplierId: string;
}

export interface ProductSupplierResDto {
  id: string;
  productId: string;
  supplierId: string;
  productName: string;
  description: string;
  pricePerPiece: number;
  factoryName: string;
}

export interface ProductSupplierUpdateDto {
  id: string;
  productId: string;
  supplierId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductSupplierService {
  private _baseUrl = `${environment.apiUrl}/ProductSupplier`;

  constructor(private http: HttpClient) { }

  // Get all product-supplier relationships
  getAll(): Observable<ProductSupplierResDto[]> {
    return this.http.get<ProductSupplierResDto[]>(`${this._baseUrl}`).pipe(
      catchError(error => {
        console.error('Error fetching product suppliers:', error);
        return throwError(() => new Error('Failed to fetch product suppliers'));
      })
    );
  }

  // Get product-supplier relationship by ID
  getById(id: string): Observable<ProductSupplierResDto> {
    return this.http.get<ProductSupplierResDto>(`${this._baseUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error fetching product supplier with ID ${id}:`, error);
        return throwError(() => new Error(`Failed to fetch product supplier with ID ${id}`));
      })
    );
  }

  // Create new product-supplier relationship
  create(productSupplier: ProductSupplierCreateDto): Observable<ProductSupplierResDto> {
    const formData = new FormData();
    formData.append('ProductId', productSupplier.productId);
    formData.append('SupplierId', productSupplier.supplierId);

    return this.http.post<ProductSupplierResDto>(`${this._baseUrl}`, formData).pipe(
      catchError(error => {
        console.error('Error creating product supplier:', error);
        return throwError(() => new Error('Failed to create product supplier'));
      })
    );
  }

  // Update product-supplier relationship
  update(id: string, productSupplier: ProductSupplierUpdateDto): Observable<ProductSupplierResDto> {
    const formData = new FormData();
    formData.append('Id', productSupplier.id);
    formData.append('ProductId', productSupplier.productId);
    formData.append('SupplierId', productSupplier.supplierId);

    return this.http.put<ProductSupplierResDto>(`${this._baseUrl}/${id}`, formData).pipe(
      catchError(error => {
        console.error(`Error updating product supplier with ID ${id}:`, error);
        return throwError(() => new Error(`Failed to update product supplier with ID ${id}`));
      })
    );
  }

  // Delete product-supplier relationship
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this._baseUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error deleting product supplier with ID ${id}:`, error);
        return throwError(() => new Error(`Failed to delete product supplier with ID ${id}`));
      })
    );
  }

  // Get products by supplier ID
  getProductsBySupplier(supplierId: string): Observable<ProductSupplierResDto[]> {
    console.log('🔍 ProductSupplierService: Getting products for supplier:', supplierId);
    console.log('🔍 ProductSupplierService: API URL:', this._baseUrl);
    
    return this.getAll().pipe(
      tap(allProductSuppliers => {
        console.log('📊 ProductSupplierService: Total product-supplier relationships found:', allProductSuppliers.length);
      }),
      map(productSuppliers => {
        const filtered = productSuppliers.filter(ps => ps.supplierId === supplierId);
        console.log('📋 ProductSupplierService: Filtered relationships for supplier:', filtered.length);
        return filtered;
      }),
      catchError(error => {
        console.error('❌ ProductSupplierService: Error getting products by supplier:', error);
        return throwError(() => new Error('Failed to get products by supplier'));
      })
    );
  }
}


