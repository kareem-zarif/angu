import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, forkJoin, map, switchMap, catchError } from 'rxjs';
import { Supplier, SupplierCreateDto, SupplierResDto, SupplierUpdateDto } from '../models/supplier';
import { ProductSupplierService } from './product-supplier.service';

export interface AdminSupplierNotification {
  id: string;
  title: string;
  message: string;
  type: 'supplier_created' | 'supplier_updated' | 'supplier_deleted' | 'supplier_approved';
  recipientType: 'supplier';
  recipientId: string;
  isRead: boolean;
  timestamp: Date;
  actionUrl: string;
  metadata?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AdminSuppliersService {
  private apiUrl = 'https://localhost:7253/api/Supplier';

  // Notification subjects for real-time updates
  private supplierNotificationsSubject = new BehaviorSubject<AdminSupplierNotification[]>([]);
  public supplierNotifications$ = this.supplierNotificationsSubject.asObservable();

  constructor(private http: HttpClient, private productSupplierService: ProductSupplierService) {}

  getAll(): Observable<SupplierResDto[]> {
    return this.http.get<SupplierResDto[]>(this.apiUrl).pipe(
      switchMap(suppliers => {
        // Get product counts for all suppliers
        const suppliersWithCounts = suppliers.map(supplier => 
          this.productSupplierService.getProductsBySupplier(supplier.id).pipe(
            map(productSuppliers => ({
              ...supplier,
              productSuppliers: productSuppliers
            }))
          )
        );
        
        return forkJoin(suppliersWithCounts);
      })
    );
  }

  // Alternative method to get suppliers with product counts
  getAllWithProductCounts(): Observable<SupplierResDto[]> {
    return forkJoin({
      suppliers: this.http.get<SupplierResDto[]>(this.apiUrl),
      productSuppliers: this.productSupplierService.getAll()
    }).pipe(
      map(({ suppliers, productSuppliers }) => {
        // Create a map of supplier ID to product count
        const supplierProductCounts = new Map<string, number>();
        
        productSuppliers.forEach(ps => {
          const count = supplierProductCounts.get(ps.supplierId) || 0;
          supplierProductCounts.set(ps.supplierId, count + 1);
        });
        
        // Add product counts to suppliers
        return suppliers.map(supplier => ({
          ...supplier,
          productSuppliers: Array.from({ length: supplierProductCounts.get(supplier.id) || 0 }, (_, i) => ({
            id: `temp-${i}`,
            productId: `temp-product-${i}`,
            supplierId: supplier.id
          }))
        }));
      })
    );
  }

  getById(id: string): Observable<SupplierResDto> {
    return this.http.get<SupplierResDto>(`${this.apiUrl}/${id}`).pipe(
      switchMap(supplier => 
        this.productSupplierService.getProductsBySupplier(supplier.id).pipe(
          map(productSuppliers => ({
            ...supplier,
            productSuppliers: productSuppliers
          }))
        )
      )
    );
  }

  create(data: SupplierCreateDto): Observable<SupplierResDto> {
    return this.http.post<SupplierResDto>(this.apiUrl, data).pipe(
      tap(response => {
        // Send notification to supplier about creation
        this.notifySupplier('supplier_created', 'Account Created', 
          `Your supplier account has been created successfully. Welcome to our platform!`, 
          response.id, '/supplier/dashboard', { 
            supplierName: `${data.firstName} ${data.lastName}`,
            factoryName: data.factoryName 
          });
      })
    );
  }

  update(data: SupplierUpdateDto): Observable<SupplierResDto> {
    const formData = new FormData();
    formData.append('Id', data.id);
    formData.append('FirstName', data.firstName);
    formData.append('LastName', data.lastName);
    formData.append('Phone', data.phone);
    formData.append('FactoryName', data.factoryName);
    if (data.description) {
      formData.append('Description', data.description);
    }
    return this.http.put<SupplierResDto>(this.apiUrl, formData).pipe(
      tap(response => {
        // Send notification to supplier about update
        this.notifySupplier('supplier_updated', 'Account Updated', 
          `Your supplier account information has been updated.`, 
          response.id, '/supplier/dashboard', { 
            supplierName: `${data.firstName} ${data.lastName}`,
            factoryName: data.factoryName 
          });
      })
    );
  }

  delete(id: string): Observable<SupplierResDto> {
    console.log(`AdminSuppliersService.delete() called for supplier ID: ${id}`);
    
    // First, get the supplier details to know what we're deleting
    return this.getById(id).pipe(
      switchMap(supplier => {
        console.log(`Retrieved supplier details for deletion:`, supplier);
        
        // If supplier has products, we need to handle them first
        if (supplier.productSuppliers && supplier.productSuppliers.length > 0) {
          console.log(`Supplier ${supplier.factoryName} has ${supplier.productSuppliers.length} products. Cleaning up...`);
          
          // Delete all ProductSupplier relationships for this supplier
          const deleteProductSupplierRequests = supplier.productSuppliers.map(ps => 
            this.productSupplierService.delete(ps.id)
          );
          
          return forkJoin(deleteProductSupplierRequests).pipe(
            switchMap(() => {
              console.log(`Deleted ${supplier.productSuppliers.length} ProductSupplier relationships for supplier ${supplier.factoryName}`);
              
              // Now delete the supplier
              console.log(`Now deleting supplier ${supplier.factoryName} (ID: ${id})`);
              return this.http.delete<SupplierResDto>(`${this.apiUrl}/${id}`).pipe(
                tap(response => {
                  console.log(`Supplier deletion successful. Response:`, response);
                  // Send notification to supplier about deletion
                  this.notifySupplier('supplier_deleted', 'Account Deleted', 
                    `Your supplier account has been deleted from our platform.`, 
                    id, '/supplier/dashboard', { 
                      supplierName: response.firstName ? `${response.firstName} ${response.lastName}` : 'Unknown',
                      factoryName: response.factoryName 
                    });
                })
              );
            }),
            catchError(error => {
              console.error('Error cleaning up ProductSupplier relationships:', error);
              throw new Error(`Failed to clean up supplier's products: ${error.message}`);
            })
          );
        } else {
          // No products, safe to delete supplier directly
          console.log(`Supplier ${supplier.factoryName} has no products. Safe to delete.`);
          console.log(`Deleting supplier ${supplier.factoryName} (ID: ${id}) directly`);
          
          return this.http.delete<SupplierResDto>(`${this.apiUrl}/${id}`).pipe(
            tap(response => {
              console.log(`Supplier deletion successful. Response:`, response);
              // Send notification to supplier about deletion
              this.notifySupplier('supplier_deleted', 'Account Deleted', 
                `Your supplier account has been deleted from our platform.`, 
                id, '/supplier/dashboard', { 
                  supplierName: response.firstName ? `${response.firstName} ${response.lastName}` : 'Unknown',
                  factoryName: response.factoryName 
                });
            })
          );
        }
      }),
      catchError(error => {
        console.error('Error in supplier deletion process:', error);
        throw error;
      })
    );
  }

  // Private method to create and emit notifications
  private notifySupplier(type: AdminSupplierNotification['type'], title: string, message: string, 
                        recipientId: string, actionUrl: string, metadata?: any): void {
    const notification: AdminSupplierNotification = {
      id: `admin-supplier-${Date.now()}-${Math.random()}`,
      title,
      message,
      type,
      recipientType: 'supplier',
      recipientId,
      isRead: false,
      timestamp: new Date(),
      actionUrl,
      metadata
    };

    // Add to supplier notifications
    const currentNotifications = this.supplierNotificationsSubject.value;
    this.supplierNotificationsSubject.next([notification, ...currentNotifications]);
    
    console.log('Admin supplier notification sent:', notification);
  }

  // Method to get supplier notifications (for supplier components to subscribe to)
  getSupplierNotifications(): Observable<AdminSupplierNotification[]> {
    return this.supplierNotifications$;
  }

  // Method to mark notification as read
  markNotificationAsRead(notificationId: string): void {
    const currentNotifications = this.supplierNotificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    );
    this.supplierNotificationsSubject.next(updatedNotifications);
  }

  // Method to clear all notifications for a supplier
  clearSupplierNotifications(supplierId: string): void {
    const currentNotifications = this.supplierNotificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(
      notification => notification.recipientId !== supplierId
    );
    this.supplierNotificationsSubject.next(filteredNotifications);
  }
}