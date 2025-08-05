import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ISupplier } from '../models/i-supplier';
import { IProduct } from '../models/i-product';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private _baseUrl = `${environment.apiUrl}/Supplier`;
  private _imageBaseUrl = 'https://localhost:7253';
  private suppliersCache: ISupplier[] = [];
  private lastFetchTime: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes cache

  constructor(private http: HttpClient) { }

  // Get all suppliers
  getAllSuppliers(): Observable<ISupplier[]> {
    // Check if we have a valid cache
    if (this.isCacheValid()) {
      return of(this.suppliersCache);
    }

    return this.http.get<ISupplier[]>(`${this._baseUrl}`).pipe(
      map(suppliers => {
        return suppliers.map(supplier => {
          // Process supplier's products images
          supplier = this.processSupplierProducts(supplier);

          // Calculate average rating
          if (supplier.products && supplier.products.length > 0) {
            supplier.averageRating = this.calculateAverageRating(supplier.products);
          } else {
            supplier.averageRating = 0;
          }

          return supplier;
        });
      }),
      tap(suppliers => {
        this.suppliersCache = suppliers;
        this.lastFetchTime = Date.now();
      }),
      catchError(error => {
        console.error('Error fetching suppliers:', error);
        return throwError(() => new Error('Failed to fetch suppliers'));
      })
    );
  }

  // Get supplier by ID
  getSupplierById(id: string): Observable<ISupplier> {
    // Check cache first
    const cachedSupplier = this.suppliersCache.find(s => s.id === id);
    if (cachedSupplier) {
      return of(cachedSupplier);
    }

    return this.http.get<ISupplier>(`${this._baseUrl}/${id}`).pipe(
      map(supplier => {
        // Process supplier's products images
        supplier = this.processSupplierProducts(supplier);

        // Calculate average rating
        if (supplier.products && supplier.products.length > 0) {
          supplier.averageRating = this.calculateAverageRating(supplier.products);
        } else {
          supplier.averageRating = 0;
        }

        return supplier;
      }),
      tap(supplier => {
        // Add to cache if not already there
        if (!this.suppliersCache.some(s => s.id === supplier.id)) {
          this.suppliersCache.push(supplier);
        }
      }),
      catchError(error => {
        console.error(`Error fetching supplier with ID ${id}:`, error);
        return throwError(() => new Error(`Supplier with ID ${id} not found`));
      })
    );
  }

  // Search suppliers by any criteria (name, city, state, description)
  searchSuppliers(query: string | null = null, filters: {
    city?: string,
    state?: string,
    rating?: number,
    warranty?: number | string,
    shipping?: string
  } = {}): Observable<ISupplier[]> {
    return this.getAllSuppliers().pipe(
      map(suppliers => {
        let filteredSuppliers = [...suppliers];

        // Apply text search if query provided
        if (query) {
          const lowerQuery = query.toLowerCase();
          filteredSuppliers = filteredSuppliers.filter(supplier =>
            `${supplier.firstName} ${supplier.lastName}`.toLowerCase().includes(lowerQuery) ||
            supplier.factoryName.toLowerCase().includes(lowerQuery) ||
            supplier.description.toLowerCase().includes(lowerQuery)
          );
        }

        // Apply city filter if provided
        if (filters.city) {
          filteredSuppliers = filteredSuppliers.filter(supplier =>
            supplier.city && supplier.city.toLowerCase().includes(filters.city!.toLowerCase())
          );
        }

        // Apply state filter if provided
        if (filters.state) {
          filteredSuppliers = filteredSuppliers.filter(supplier =>
            supplier.state && supplier.state.toLowerCase().includes(filters.state!.toLowerCase())
          );
        }

        // Apply rating filter if provided
        if (filters.rating !== undefined && filters.rating !== null) {
          filteredSuppliers = filteredSuppliers.filter(supplier => {
            // Use the calculated average rating (floor it to get whole number)
            const flooredRating = Math.floor(supplier.averageRating || 0);
            return flooredRating >= filters.rating!;
          });
        }

        // Apply warranty filter if provided
        if (filters.warranty !== undefined && filters.warranty !== null) {
          filteredSuppliers = filteredSuppliers.filter(supplier => {
            if (!supplier.products || supplier.products.length === 0) {
              return false;
            }

            if (filters.warranty === 'none') {
              // Check if all products have no warranty
              return supplier.products.every(p => !p.warrantyNMonths);
            } else {
              // Convert warranty value to number
              const warrantyMonths = typeof filters.warranty === 'string'
                ? parseInt(filters.warranty)
                : filters.warranty;

              // Check if any product has the specified warranty
              return supplier.products.some(p => p.warrantyNMonths === warrantyMonths);
            }
          });
        }

        // Apply shipping filter if provided
        if (filters.shipping) {
          filteredSuppliers = filteredSuppliers.filter(supplier => {
            if (!supplier.products || supplier.products.length === 0) {
              return false;
            }

            // Check if any product has the specified shipping type
            return supplier.products.some(p => p.shipping.toString() === filters.shipping);
          });
        }

        return filteredSuppliers;
      })
    );
  }

  // Get all unique locations (cities and states)
  getLocations(): Observable<{ cities: string[], states: string[] }> {
    return this.getAllSuppliers().pipe(
      map(suppliers => {
        const cities = [...new Set(
          suppliers
            .map(supplier => supplier.city)
            .filter((city): city is string => !!city)
        )].sort();

        const states = [...new Set(
          suppliers
            .map(supplier => supplier.state)
            .filter((state): state is string => !!state)
        )].sort();

        return { cities, states };
      })
    );
  }

  // Get all cities (for backward compatibility)
  getAllCities(): Observable<string[]> {
    return this.getLocations().pipe(map(locations => locations.cities));
  }

  // Get all states (for backward compatibility)
  getAllStates(): Observable<string[]> {
    return this.getLocations().pipe(map(locations => locations.states));
  }

  // Get all warranty options from products
  getWarrantyOptions(): Observable<{ value: string, label: string }[]> {
    return this.getAllSuppliers().pipe(
      map(suppliers => {
        // Collect all unique warranty values from all products
        const warrantyMonths = new Set<number>();

        suppliers.forEach(supplier => {
          if (supplier.products && supplier.products.length > 0) {
            supplier.products.forEach(product => {
              if (product.warrantyNMonths !== undefined && product.warrantyNMonths !== null) {
                warrantyMonths.add(product.warrantyNMonths);
              }
            });
          }
        });

        // Convert to array and sort
        const sortedWarrantyMonths = Array.from(warrantyMonths).sort((a, b) => a - b);

        // Create options array with "None" option
        const options = [
          { value: 'none', label: 'No Warranty' }
        ];

        // Add options for each warranty period
        sortedWarrantyMonths.forEach(months => {
          let label: string;

          if (months >= 12) {
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;

            if (remainingMonths === 0) {
              label = `${years} Year${years > 1 ? 's' : ''}`;
            } else {
              label = `${years} Year${years > 1 ? 's' : ''} ${remainingMonths} Month${remainingMonths > 1 ? 's' : ''}`;
            }
          } else {
            label = `${months} Month${months > 1 ? 's' : ''}`;
          }

          options.push({ value: months.toString(), label });
        });

        return options;
      })
    );
  }

  // Create a new supplier
  create(supplier: ISupplier): Observable<ISupplier> {
    return this.http.post<ISupplier>(`${this._baseUrl}`, supplier).pipe(
      map(newSupplier => {
        // Calculate average rating if products exist
        if (newSupplier.products && newSupplier.products.length > 0) {
          newSupplier.averageRating = this.calculateAverageRating(newSupplier.products);
        } else {
          newSupplier.averageRating = 0;
        }
        return newSupplier;
      }),
      tap(newSupplier => {
        this.suppliersCache.push(newSupplier);
      }),
      catchError(error => {
        console.error('Error creating supplier:', error);
        return throwError(() => new Error('Failed to create supplier'));
      })
    );
  }

  // Update an existing supplier
  update(supplier: ISupplier): Observable<ISupplier> {
    return this.http.put<ISupplier>(`${this._baseUrl}/${supplier.id}`, supplier).pipe(
      map(updatedSupplier => {
        // Calculate average rating if products exist
        if (updatedSupplier.products && updatedSupplier.products.length > 0) {
          updatedSupplier.averageRating = this.calculateAverageRating(updatedSupplier.products);
        } else {
          updatedSupplier.averageRating = 0;
        }
        return updatedSupplier;
      }),
      tap(updatedSupplier => {
        const index = this.suppliersCache.findIndex(s => s.id === updatedSupplier.id);
        if (index !== -1) {
          this.suppliersCache[index] = updatedSupplier;
        }
      }),
      catchError(error => {
        console.error(`Error updating supplier with ID ${supplier.id}:`, error);
        return throwError(() => new Error('Failed to update supplier'));
      })
    );
  }

  // Delete a supplier
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this._baseUrl}/${id}`).pipe(
      tap(() => {
        this.suppliersCache = this.suppliersCache.filter(s => s.id !== id);
      }),
      catchError(error => {
        console.error(`Error deleting supplier with ID ${id}:`, error);
        return throwError(() => new Error('Failed to delete supplier'));
      })
    );
  }

  // Clear cache
  clearCache(): void {
    this.suppliersCache = [];
    this.lastFetchTime = 0;
  }

  // Check if cache is valid
  private isCacheValid(): boolean {
    return this.suppliersCache.length > 0 &&
      (Date.now() - this.lastFetchTime) < this.cacheDuration;
  }

  // Calculate average rating for a supplier's products
  private calculateAverageRating(products: IProduct[]): number {
    if (!products || products.length === 0) return 0;

    const productsWithRatings = products.filter(p => p.rating !== null && p.rating !== undefined);
    if (productsWithRatings.length === 0) return 0;

    const totalRating = productsWithRatings.reduce((sum, product) => {
      return sum + (product.rating || 0);
    }, 0);

    return totalRating / productsWithRatings.length;
  }

  // Add this method to process products with images
  private processSupplierProducts(supplier: ISupplier): ISupplier {
    if (supplier.products) {
      supplier.products = supplier.products.map(product => this.processProductImage(product));
    }
    return supplier;
  }

  // Add product image processing method
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
}


