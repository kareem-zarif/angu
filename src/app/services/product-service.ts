import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject, forkJoin } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { IProduct, ProductApprovalStatus, ShippingTypes } from '../models/i-product';
import { environment } from '../../environment/environment';
import { ISupplier } from '../models/i-supplier';
import { NotificationService } from './notification.service';
import { Auth } from './auth';
import { ProductSupplierService, ProductSupplierCreateDto } from './product-supplier.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  // Try admin endpoint first, fallback to regular endpoint
  private _baseUrl = `${environment.apiUrl}/Product`;
  private _fallbackBaseUrl = `${environment.apiUrl}/Product`;
  private _imageBaseUrl = 'https://localhost:7253';

  // Cache management
  private productsCache: IProduct[] = [];
  private lastFetchTime: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes cache

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private http: HttpClient, 
    private notificationService: NotificationService, 
    private auth: Auth,
    private productSupplierService: ProductSupplierService
  ) { }

  // Get all products from API
  getProducts(): Observable<IProduct[]> {
    // Check if we have a valid cache
    const now = Date.now();
    if (this.productsCache.length > 0 && (now - this.lastFetchTime) < this.cacheDuration) {
      // Always serve approved-only view from cache
      return of(this.processProductImages(this.productsCache));
    }

    this.loadingSubject.next(true);
    console.log('🔍 ProductService: Getting all products...');
    console.log('🔍 ProductService: Trying admin endpoint first:', this._baseUrl);

    // Try admin endpoint first, fallback to regular endpoint
    return this.http.get<IProduct[]>(`${this._baseUrl}`).pipe(
      tap(products => {
        console.log('✅ ProductService: Successfully fetched products from admin endpoint:', products.length);
      }),
      map(products => this.processProductImages(products)),
      tap(products => {
        this.productsCache = products;
        this.lastFetchTime = Date.now();
        this.loadingSubject.next(false);
        console.log('💾 ProductService: Products cached from admin endpoint, count:', products.length);
      }),
      catchError(error => {
        console.log('⚠️ ProductService: Admin endpoint failed, trying fallback endpoint:', error);
        
        // Fallback to regular endpoint
        return this.http.get<IProduct[]>(`${this._fallbackBaseUrl}`).pipe(
          tap(products => {
            console.log('✅ ProductService: Successfully fetched products from fallback endpoint:', products.length);
          }),
          map(products => this.processProductImages(products)),
          tap(products => {
            this.productsCache = products;
            this.lastFetchTime = Date.now();
            this.loadingSubject.next(false);
            console.log('💾 ProductService: Products cached from fallback endpoint, count:', products.length);
          }),
          catchError(fallbackError => {
            console.error('❌ ProductService: Both endpoints failed:', fallbackError);
            this.loadingSubject.next(false);
            return throwError(() => new Error('Failed to fetch products from both endpoints'));
          })
        );
      })
    );
  }

  // Get all products (alias for compatibility)
  getAll(): Observable<IProduct[]> {
    return this.getProducts();
  }

  // Get all products for sellers (including non-approved)
  getAllForSeller(): Observable<IProduct[]> {
    this.loadingSubject.next(true);

    const currentSellerId = this.auth.getCurrentUser()?.UserId;
    if (!currentSellerId) {
      this.loadingSubject.next(false);
      return of([]);
    }

    console.log('🔍 ProductService: Getting products for seller:', currentSellerId);
    console.log('🔍 ProductService: Trying admin endpoint first:', this._baseUrl);

    // First get the ProductSupplier relationships for this seller
    return this.productSupplierService.getProductsBySupplier(currentSellerId).pipe(
      switchMap(productSuppliers => {
        console.log('📊 ProductService: ProductSupplier relationships found:', productSuppliers.length);
        
        if (productSuppliers.length === 0) {
          console.log('⚠️ ProductService: No product relationships found for seller');
          this.loadingSubject.next(false);
          return of([]);
        }

        // Get the actual product details for each product ID
        const productIds = productSuppliers.map(ps => ps.productId);
        console.log('📋 ProductService: Product IDs to fetch:', productIds);
        
        // Try admin endpoint first, fallback to regular endpoint
        const productRequests = productIds.map(id => 
          this.http.get<IProduct>(`${this._fallbackBaseUrl}/${id}`).pipe(
            tap(product => console.log(`✅ ProductService: Successfully fetched product ${id} from fallback endpoint`)),
            catchError(error => {
              console.log(`⚠️ ProductService: Fallback endpoint failed for product ${id}, trying admin endpoint:`, error);
              return this.http.get<IProduct>(`${this._baseUrl}/${id}`).pipe(
                tap(product => console.log(`✅ ProductService: Successfully fetched product ${id} from admin endpoint`)),
                catchError(adminError => {
                  console.error(`❌ ProductService: Both endpoints failed for product ${id}:`, adminError);
                  return of(null);
                })
              );
            })
          )
        );

        return forkJoin(productRequests).pipe(
          map(products => {
            const validProducts = products.filter(p => p !== null) as IProduct[];
            console.log('📦 ProductService: Total valid products fetched:', validProducts.length);
            return validProducts.map(product => this.processProductImage(product));
          })
        );
      }),
      tap(products => {
        this.productsCache = products;
        this.lastFetchTime = Date.now();
        this.loadingSubject.next(false);
        console.log('💾 ProductService: Products cached, count:', products.length);
      }),
      catchError(error => {
        console.error('❌ ProductService: Error fetching products for seller:', error);
        this.loadingSubject.next(false);
        return throwError(() => new Error('Failed to fetch products'));
      })
    );
  }

  // Get product by ID from API
  getById(id: string): Observable<IProduct> {
    // Check cache first
    const cachedProduct = this.productsCache.find(p => p.id === id);
    if (cachedProduct) {
      // Only return approved products to customers
      if (cachedProduct.approvalStatus === 2) {
        return of(cachedProduct);
      } else {
        return throwError(() => new Error(`Product with ID ${id} not found`));
      }
    }

    return this.http.get<IProduct>(`${this._baseUrl}/${id}`).pipe(
      map(product => {
        // Only return approved products to customers
        if (product.approvalStatus === 2) {
          return this.processProductImage(product);
        } else {
          throw new Error(`Product with ID ${id} not found`);
        }
      }),
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
  add(product: IProduct, images?: File[]): Observable<IProduct> {
    // Always use FormData because backend expects [FromForm] ProductCreateDto
    const formData = new FormData();
    formData.append('Name', product.name);
    formData.append('Description', product.description);
    formData.append('PricePerPiece', product.pricePerPiece.toString());
    if (product.pricePer50Piece) {
      formData.append('PricePer50Piece', product.pricePer50Piece.toString());
    }
    if (product.pricePer100Piece) {
      formData.append('PricePer100Piece', product.pricePer100Piece.toString());
    }
    formData.append('NoINStock', product.noINStock.toString());
    formData.append('MinNumToFactoryOrder', product.minNumToFactoryOrder.toString());
    formData.append('ApprovalStatus', product.approvalStatus.toString());
    formData.append('Shipping', product.shipping.toString());
    formData.append('SubCategoryId', product.subCategoryId);
    if (product.warrantyNMonths) {
      formData.append('WarrantyNMonths', product.warrantyNMonths.toString());
    }

    // Add images if any
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append('Images', image);
      });
    }

    console.log('Sending create request to:', `${this._baseUrl}`);
    console.log('Request data: FormData with keys:', Array.from(formData.keys()));

    return this.http.post<IProduct>(`${this._baseUrl}`, formData).pipe(
      switchMap(newProduct => {
        // After creating the product, create the ProductSupplier relationship
        const currentSellerId = this.auth.getCurrentUser()?.UserId;
        if (currentSellerId && newProduct.id) {
          const productSupplierData: ProductSupplierCreateDto = {
            productId: newProduct.id,
            supplierId: currentSellerId
          };
          
          return this.productSupplierService.create(productSupplierData).pipe(
            map(() => newProduct) // Return the product after creating the relationship
          );
        } else {
          return of(newProduct); // Return the product if no seller ID
        }
      }),
      map(newProduct => this.processProductImage(newProduct)),
      tap(newProduct => {
        // Update cache with approved products only
        if (newProduct.approvalStatus === ProductApprovalStatus.Approved) {
          this.productsCache.push(newProduct);
        }
        // Notify admin about new product submission
        const currentSellerId = this.auth.getCurrentUser()?.UserId;
        if (currentSellerId && newProduct.name) {
          this.notificationService.createNewProductNotification(currentSellerId, newProduct.name).subscribe({
            next: () => {},
            error: () => {}
          });
        }
      }),
      catchError(error => {
        console.error('Error creating product:', error);
        // Re-throw the original HttpErrorResponse so callers can inspect status/message
        return throwError(() => error);
      })
    );
  }

  // Update product via API
  update(product: IProduct, images?: File[]): Observable<IProduct> {
    console.log('ProductService.update called with:', { product, images });

    // Always use FormData because backend expects [FromForm] ProductUpdateDto
    const formData = new FormData();
    formData.append('Id', product.id);
    formData.append('Name', product.name);
    formData.append('Description', product.description);
    formData.append('PricePerPiece', product.pricePerPiece.toString());
    if (product.pricePer50Piece) {
      formData.append('PricePer50Piece', product.pricePer50Piece.toString());
    }
    if (product.pricePer100Piece) {
      formData.append('PricePer100Piece', product.pricePer100Piece.toString());
    }
    formData.append('NoINStock', product.noINStock.toString());
    formData.append('MinNumToFactoryOrder', product.minNumToFactoryOrder.toString());
    formData.append('ApprovalStatus', product.approvalStatus.toString());
    formData.append('Shipping', product.shipping.toString());
    formData.append('SubCategoryId', product.subCategoryId);
    if (product.warrantyNMonths) {
      formData.append('WarrantyNMonths', product.warrantyNMonths.toString());
    }

    // Add images if any
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append('Images', image);
      });
    }

    console.log('Sending update request to:', `${this._baseUrl}`);
    console.log('Request data: FormData with keys:', Array.from(formData.keys()));

    return this.http.put<IProduct>(`${this._baseUrl}`, formData).pipe(
      map(updatedProduct => {
        console.log('Product update response received:', updatedProduct);
        return this.processProductImage(updatedProduct);
      }),
      tap(updatedProduct => {
        console.log('Product update successful, updating cache');
        // Maintain approved-only cache
        const index = this.productsCache.findIndex(p => p.id === updatedProduct.id);
        if (updatedProduct.approvalStatus === ProductApprovalStatus.Approved) {
          if (index !== -1) {
            this.productsCache[index] = updatedProduct;
          } else {
            this.productsCache.push(updatedProduct);
          }
        } else if (index !== -1) {
          this.productsCache.splice(index, 1);
        }
      }),
      catchError(error => {
        console.error(`Error updating product with ID ${product.id}:`, error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message,
          url: error.url
        });
        
        // Return a more detailed error
        let errorMessage = 'Failed to update product';
        if (error.status === 400) {
          errorMessage = 'Bad request - invalid data provided';
        } else if (error.status === 401) {
          errorMessage = 'Unauthorized - please login again';
        } else if (error.status === 403) {
          errorMessage = 'Forbidden - insufficient permissions';
        } else if (error.status === 404) {
          errorMessage = 'Product not found';
        } else if (error.status === 500) {
          errorMessage = 'Internal server error';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Delete product via API
  delete(id: string): Observable<void> {
    const currentSellerId = this.auth.getCurrentUser()?.UserId;
    
    if (currentSellerId) {
      // First get the ProductSupplier relationships for this product and seller
      return this.productSupplierService.getProductsBySupplier(currentSellerId).pipe(
        switchMap(productSuppliers => {
          // Find the ProductSupplier relationship for this product
          const productSupplier = productSuppliers.find(ps => ps.productId === id);
          
          if (productSupplier) {
            // Delete the ProductSupplier relationship first
            return this.productSupplierService.delete(productSupplier.id).pipe(
              switchMap(() => {
                // Then delete the product
                return this.http.delete<void>(`${this._baseUrl}/${id}`);
              })
            );
          } else {
            // If no relationship found, just delete the product
            return this.http.delete<void>(`${this._baseUrl}/${id}`);
          }
        }),
        tap(() => {
          // Update cache
          this.productsCache = this.productsCache.filter(p => p.id !== id);
        }),
        catchError(error => {
          console.error(`Error deleting product with ID ${id}:`, error);
          return throwError(() => new Error('Failed to delete product'));
        })
      );
    } else {
      // If no seller ID, just delete the product
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
  }

  // Process multiple products' images and filter for approved products only
  private processProductImages(products: IProduct[]): IProduct[] {
    // Filter to only show approved products to customers
    const approvedProducts = products.filter(product => product.approvalStatus === 2); // 2 = Approved
    return approvedProducts.map(product => this.processProductImage(product));
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