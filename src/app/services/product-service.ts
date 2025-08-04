import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { IProduct, ProductApprovalStatus, ShippingTypes } from '../models/i-product';
import { environment } from '../../environment/environment';
import { ISupplier } from '../models/i-supplier';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private _baseUrl = `${environment.apiUrl}/Product`;
  private _imageBaseUrl = 'https://localhost:7253';

  // Cache management
  private productsCache: IProduct[] = [];
  private lastFetchTime: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes cache

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Get all products from API
  getProducts(): Observable<IProduct[]> {
    // Check if we have a valid cache
    const now = Date.now();
    if (this.productsCache.length > 0 && (now - this.lastFetchTime) < this.cacheDuration) {
      return of(this.productsCache);
    }

    this.loadingSubject.next(true);

    return this.http.get<IProduct[]>(`${this._baseUrl}`).pipe(
      map(products => this.processProductImages(products)),
      tap(products => {
        this.productsCache = products;
        this.lastFetchTime = Date.now();
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error fetching products:', error);
        this.loadingSubject.next(false);
        return throwError(() => new Error('Failed to fetch products'));
      })
    );
  }

  // Get all products (alias for compatibility)
  getAll(): Observable<IProduct[]> {
    return this.getProducts();
  }

  // Get product by ID from API
  getById(id: string): Observable<IProduct> {
    // Check cache first
    const cachedProduct = this.productsCache.find(p => p.id === id);
    if (cachedProduct) {
      return of(cachedProduct);
    }

    return this.http.get<IProduct>(`${this._baseUrl}/${id}`).pipe(
      map(product => this.processProductImage(product)),
      catchError(error => {
        console.error(`Error fetching product with ID ${id}:`, error);
        return throwError(() => new Error(`Product with ID ${id} not found`));
      })
    );
  }

  // Get products by category
  getByCategory(categoryId: string): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(`${this._baseUrl}/category/${categoryId}`).pipe(
      map(products => this.processProductImages(products)),
      catchError(error => {
        console.error(`Error fetching products for category ${categoryId}:`, error);
        return throwError(() => new Error('Failed to fetch products by category'));
      })
    );
  }

  // Get products by subcategory
  getBySubCategory(subCategoryId: string): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(`${this._baseUrl}/subcategory/${subCategoryId}`).pipe(
      map(products => this.processProductImages(products)),
      catchError(error => {
        console.error(`Error fetching products for subcategory ${subCategoryId}:`, error);
        return throwError(() => new Error('Failed to fetch products by subcategory'));
      })
    );
  }

  // Filter products by supplier - can accept either a supplier object or a supplier name
  filterBySupplier(supplier: ISupplier | string): Observable<IProduct[]> {
    // If supplier is a string (name), we need to filter locally
    if (typeof supplier === 'string') {
      console.log(`Filtering products by supplier name: ${supplier}`);
      return this.getProducts().pipe(
        map(products => products.filter(product =>
          (product.supplierNames &&
            product.supplierNames.some(name =>
              name.toLowerCase().includes(supplier.toLowerCase())
            )) ||
          (product.suppliers &&
            product.suppliers.some(name =>
              name.toLowerCase().includes(supplier.toLowerCase())
            ))
        ))
      );
    }

    // If supplier is an object with ID, use the API endpoint
    if (supplier && typeof supplier === 'object' && supplier.id) {
      console.log(`Filtering products by supplier ID: ${supplier.id}`);
      return this.http.get<IProduct[]>(`${environment.apiUrl}/Supplier/${supplier.id}`).pipe(
        map(products => this.processProductImages(products)),
        catchError(error => {
          console.error(`Error filtering products by supplier ${supplier.factoryName}:`, error);
          // Fallback to getting all products and filtering locally
          return this.getProducts().pipe(
            map(products => products.filter(product =>
              product.supplierNames &&
              product.supplierNames.some(name =>
                name.toLowerCase().includes(supplier.factoryName.toLowerCase())
              )
            ))
          );
        })
      );
    }

    // If neither condition is met, return an empty array
    console.error('Invalid supplier parameter:', supplier);
    return of([]);
  }

  // Filter products by stock availability
  filterByStockAvailability(includeOutOfStock: boolean): Observable<IProduct[]> {
    return this.getProducts().pipe(
      map(products => {
        if (includeOutOfStock) {
          return products;
        }
        return products.filter(product => product.noINStock > 0);
      })
    );
  }

  // Search products
  searchProducts(query: string): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(`${this._baseUrl}/search?q=${encodeURIComponent(query)}`).pipe(
      map(products => this.processProductImages(products)),
      catchError(error => {
        console.error(`Error searching products with query ${query}:`, error);
        // Fallback to local search
        return this.getProducts().pipe(
          map(products => products.filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase())
          ))
        );
      })
    );
  }

  // Add new product via API
  add(product: IProduct): Observable<IProduct> {
    return this.http.post<IProduct>(`${this._baseUrl}`, product).pipe(
      map(newProduct => this.processProductImage(newProduct)),
      tap(newProduct => {
        // Update cache
        this.productsCache.push(newProduct);
      }),
      catchError(error => {
        console.error('Error creating product:', error);
        return throwError(() => new Error('Failed to create product'));
      })
    );
  }

  // Update product via API
  update(product: IProduct): Observable<IProduct> {
    return this.http.put<IProduct>(`${this._baseUrl}/${product.id}`, product).pipe(
      map(updatedProduct => this.processProductImage(updatedProduct)),
      tap(updatedProduct => {
        // Update cache
        const index = this.productsCache.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
          this.productsCache[index] = updatedProduct;
        }
      }),
      catchError(error => {
        console.error(`Error updating product with ID ${product.id}:`, error);
        return throwError(() => new Error('Failed to update product'));
      })
    );
  }

  // Delete product via API
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this._baseUrl}/${id}`).pipe(
      tap(() => {
        // Update cache
        this.productsCache = this.productsCache.filter(p => p.id !== id);
      }),
      catchError(error => {
        console.error(`Error deleting product with ID ${id}:`, error);
        return throwError(() => new Error('Failed to delete product'));
      })
    );
  }

  // Process multiple products' images
  private processProductImages(products: IProduct[]): IProduct[] {
    return products.map(product => this.processProductImage(product));
  }

  // Process single product's image paths
  private processProductImage(product: IProduct): IProduct {
    if (!product.productPicsPathes || product.productPicsPathes.length === 0) {
      product.productPicsPathes = ['assets/placeholder.png'];
      return product;
    }

    product.productPicsPathes = product.productPicsPathes.map(path => {
      // Skip paths that are already complete URLs or local assets
      if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('assets/')) {
        return path;
      }
      // Otherwise, prepend the base URL
      return `${this._imageBaseUrl}/${path}`;
    });

    return product;
  }

  // Clear cache
  clearCache(): void {
    this.productsCache = [];
    this.lastFetchTime = 0;
  }
}
