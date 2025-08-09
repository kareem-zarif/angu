import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, map } from 'rxjs';
import { IProduct, ProductCreateDto, ProductUpdateDto } from '../models/i-product';

@Injectable({
  providedIn: 'root'
})
export class AdminProductsService {
  private apiUrl = 'https://localhost:7253/api/Product';
  private _imageBaseUrl = 'https://localhost:7253';

  constructor(private http: HttpClient) { }

  // Get all products - matches GET /api/Product
  getAllProducts(): Observable<IProduct[]> {
    console.log('Admin Get All - API URL:', this.apiUrl);
    return this.http.get<IProduct[]>(this.apiUrl).pipe(
      map(products => this.processProductImages(products)),
      tap(response => console.log('Admin Get All - Success response:', response)),
      catchError(error => {
        console.error('Admin Get All - HTTP Error:', error);
        throw error;
      })
    );
  }

  // Get single product by ID - matches GET /api/Product/{id}
  getProductById(id: string): Observable<IProduct> {
    console.log('Admin Get By ID - API URL:', `${this.apiUrl}/${id}`);
    return this.http.get<IProduct>(`${this.apiUrl}/${id}`).pipe(
      map(product => this.processProductImage(product)),
      tap(response => console.log('Admin Get By ID - Success response:', response)),
      catchError(error => {
        console.error('Admin Get By ID - HTTP Error:', error);
        throw error;
      })
    );
  }

  // Create new product - matches POST /api/Product with [FromForm]
  createProduct(productData: ProductCreateDto): Observable<IProduct> {
    const formData = new FormData();

    // Add all product data to FormData - matching backend DTO exactly
    formData.append('Name', productData.name);
    formData.append('Description', productData.description);
    formData.append('PricePerPiece', productData.pricePerPiece.toString());
    if (productData.pricePer50Piece) {
      formData.append('PricePer50Piece', productData.pricePer50Piece.toString());
    }
    if (productData.pricePer100Piece) {
      formData.append('PricePer100Piece', productData.pricePer100Piece.toString());
    }
    formData.append('NoINStock', productData.noINStock.toString());
    formData.append('MinNumToFactoryOrder', productData.minNumToFactoryOrder.toString());
    formData.append('ApprovalStatus', productData.approvalStatus.toString());
    formData.append('Shipping', productData.shipping.toString());
    formData.append('SubCategoryId', productData.subCategoryId);
    if (productData.warrantyNMonths) {
      formData.append('WarrantyNMonths', productData.warrantyNMonths.toString());
    }

    // Add images if they exist - backend expects List<IFormFile> Images
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((image) => {
        formData.append('Images', image);
      });
    }

    // Debug: Log the FormData contents
    console.log('Admin Create - FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    console.log('Admin Create - API URL:', this.apiUrl);

    return this.http.post<IProduct>(this.apiUrl, formData).pipe(
      tap(response => console.log('Admin Create - Success response:', response)),
      catchError(error => {
        console.error('Admin Create - HTTP Error:', error);
        throw error;
      })
    );
  }

  // Update existing product - matches PUT /api/Product with [FromForm]
  updateProduct(productData: ProductUpdateDto): Observable<IProduct> {
    const formData = new FormData();

    // Add all product data to FormData - matching backend DTO exactly
    formData.append('Id', productData.id);
    formData.append('Name', productData.name);
    formData.append('Description', productData.description);
    formData.append('PricePerPiece', productData.pricePerPiece.toString());
    if (productData.pricePer50Piece) {
      formData.append('PricePer50Piece', productData.pricePer50Piece.toString());
    }
    if (productData.pricePer100Piece) {
      formData.append('PricePer100Piece', productData.pricePer100Piece.toString());
    }
    formData.append('NoINStock', productData.noINStock.toString());
    formData.append('MinNumToFactoryOrder', productData.minNumToFactoryOrder.toString());
    formData.append('ApprovalStatus', productData.approvalStatus.toString());
    formData.append('Shipping', productData.shipping.toString());
    formData.append('SubCategoryId', productData.subCategoryId);
    if (productData.warrantyNMonths) {
      formData.append('WarrantyNMonths', productData.warrantyNMonths.toString());
    }

    // Add images if they exist - backend expects List<IFormFile>? Images
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((image) => {
        formData.append('Images', image);
      });
    }

    // Debug: Log the FormData contents
    console.log('Admin Update - FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    console.log('Admin Update - API URL:', this.apiUrl);

    return this.http.put<IProduct>(this.apiUrl, formData).pipe(
      tap(response => console.log('Admin Update - Success response:', response)),
      catchError(error => {
        console.error('Admin Update - HTTP Error:', error);
        throw error;
      })
    );
  }

  // Delete product - matches DELETE /api/Product/{id:guid}
  deleteProduct(id: string): Observable<IProduct> {
    console.log('Admin Delete - API URL:', `${this.apiUrl}/${id}`);
    return this.http.delete<IProduct>(`${this.apiUrl}/${id}`).pipe(
      tap(response => console.log('Admin Delete - Success response:', response)),
      catchError(error => {
        console.error('Admin Delete - HTTP Error:', error);
        throw error;
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
} 