import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, map, BehaviorSubject } from 'rxjs';
import { IProduct, ProductCreateDto, ProductUpdateDto } from '../models/i-product';
import { LocalStorageNotificationService } from './local-storage-notification.service';
import { environment } from '../../environment/environment';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'product_created' | 'product_approved' | 'product_rejected' | 'product_deleted' | 'product_updated';
  recipientType: 'seller';
  recipientId: string;
  isRead: boolean;
  timestamp: Date;
  actionUrl: string;
  metadata?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AdminProductsService {
  // Base path should match controller route: [Route("api/[controller]")]
  private apiUrl = `${environment.apiUrl}/Product`;
  private fallbackApiUrl = `${environment.apiUrl}/Product`;
  private _imageBaseUrl = environment.imgUrl;

  // Notification subjects for real-time updates
  private sellerNotificationsSubject = new BehaviorSubject<AdminNotification[]>([]);
  public sellerNotifications$ = this.sellerNotificationsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private localNotificationService: LocalStorageNotificationService
  ) { }

  // Get all products - matches GET /api/admin/Product or fallback to /api/Product
  getAllProducts(): Observable<IProduct[]> {
    console.log('🔍 AdminProductsService: Trying admin endpoint:', this.apiUrl);
    return this.http.get<IProduct[]>(this.apiUrl).pipe(
      map(products => this.processProductImages(products)),
      tap(response => console.log('✅ Admin endpoint successful, got products:', response.length)),
      catchError(error => {
        console.log('⚠️ Admin endpoint failed, trying fallback:', this.fallbackApiUrl);
        return this.http.get<IProduct[]>(this.fallbackApiUrl).pipe(
          map(products => this.processProductImages(products)),
          tap(response => console.log('✅ Fallback endpoint successful, got products:', response.length)),
          catchError(fallbackError => {
            console.error('❌ Both endpoints failed:', error, fallbackError);
            throw fallbackError;
          })
        );
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
      tap(response => {
        console.log('Admin Create - Success response:', response);
        // Send notification to seller about new product creation
        this.notifySeller('product_created', 'New Product Created', 
          `Admin has created a new product: ${productData.name}`, 
          'seller-123', '/seller/products', { productName: productData.name });
      }),
      catchError(error => {
        console.error('Admin Create - HTTP Error:', error);
        throw error;
      })
    );
  }

  // Update existing product - try admin endpoint first, then fallback to /api/Product
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
    console.log('Admin Update - API URL (primary):', this.apiUrl);

    const attemptAdmin$ = this.http.put<IProduct>(this.apiUrl, formData);
    const attemptFallback$ = () => {
      console.log('Admin Update - Falling back to:', this.fallbackApiUrl);
      return this.http.put<IProduct>(this.fallbackApiUrl, formData);
    };

    return attemptAdmin$.pipe(
      tap(updated => {
        console.log('Admin Update - Success response:', updated);
        // Send notification to seller about approval/rejection if status changed
        const isApproved = updated.approvalStatus === 2; // Approved enum
        const sellerId = 'seller-123'; // TODO: replace with sellerId from product when available
        if (sellerId) {
          if (isApproved) {
            this.notifySeller('product_approved', 'Product Approved', 
              `Your product "${updated.name}" has been approved and is now live.`, 
              sellerId, '/seller/products', { productName: updated.name });
          } else if (updated.approvalStatus === 3) { // Rejected enum
            this.notifySeller('product_rejected', 'Product Rejected', 
              `Your product "${updated.name}" has been rejected. Please review and update.`, 
              sellerId, '/seller/products', { productName: updated.name });
          } else {
            this.notifySeller('product_updated', 'Product Updated', 
              `Admin has updated your product: ${updated.name}`, 
              sellerId, '/seller/products', { productName: updated.name });
          }
        }
      }),
      catchError(error => {
        console.error('Admin Update - HTTP Error (primary):', error);
        // Fallback to non-admin endpoint if admin route fails
        return attemptFallback$().pipe(
          tap(updated => {
            console.log('Admin Update - Success via fallback:', updated);
          }),
          catchError(fallbackError => {
            console.error('Admin Update - Fallback HTTP Error:', fallbackError);
            throw fallbackError;
          })
        );
      })
    );
  }

  // Delete product - matches DELETE /api/Product/{id:guid}
  deleteProduct(id: string): Observable<IProduct> {
    console.log('Admin Delete - API URL:', `${this.apiUrl}/${id}`);
    return this.http.delete<IProduct>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        console.log('Admin Delete - Success response:', response);
        // Send notification to seller about product deletion
        const sellerId = 'seller-123'; // TODO: replace with sellerId from product when available
        if (sellerId) {
          this.notifySeller('product_deleted', 'Product Deleted', 
            `Admin has deleted your product: ${response.name || 'Unknown Product'}`, 
            sellerId, '/seller/products', { productName: response.name });
        }
      }),
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

  // Private method to create and emit notifications
  private notifySeller(type: AdminNotification['type'], title: string, message: string, 
                      recipientId: string, actionUrl: string, metadata?: any): void {
    // Create notification using local storage service
    this.localNotificationService.createNotification({
      title,
      message,
      type: type as any, // Cast to match the service interface
      recipientType: 'seller',
      recipientId,
      isRead: false,
      actionUrl,
      metadata
    });
    
    console.log('Admin notification sent to seller via local storage:', { title, message, recipientId });
  }

  // Method to get seller notifications (for seller components to subscribe to)
  getSellerNotifications(): Observable<AdminNotification[]> {
    return this.sellerNotifications$;
  }

  // Method to mark notification as read
  markNotificationAsRead(notificationId: string): void {
    const currentNotifications = this.sellerNotificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    );
    this.sellerNotificationsSubject.next(updatedNotifications);
  }

  // Method to clear all notifications for a seller
  clearSellerNotifications(sellerId: string): void {
    const currentNotifications = this.sellerNotificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(
      notification => notification.recipientId !== sellerId
    );
    this.sellerNotificationsSubject.next(filteredNotifications);
  }
} 