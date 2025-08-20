import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, forkJoin, map, switchMap, catchError, of } from 'rxjs';
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
    return this.http.get<SupplierResDto[]>(this.apiUrl).pipe(
      map(suppliers => {
        console.log('Raw suppliers from API:', suppliers);
        // Add empty productSuppliers array to each supplier
        return suppliers.map(supplier => ({
          ...supplier,
          productSuppliers: []
        }));
      }),
      catchError(error => {
        console.error('Error getting suppliers:', error);
        // Return empty array if API fails
        return of([]);
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
    // Since the backend doesn't have a Create method, we'll throw an error
    return new Observable(observer => {
      observer.error(new Error('Supplier creation is not available. Suppliers must be created through the registration process.'));
    });
  }

  update(data: SupplierUpdateDto): Observable<SupplierResDto> {
    const formData = new FormData();
    formData.append('Id', data.id);
    formData.append('FirstName', data.firstName);
    formData.append('LastName', data.lastName);
    formData.append('PhoneNumber', data.phoneNumber);
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
    
              return this.http.delete<SupplierResDto>(`${this.apiUrl}/${id}`).pipe(
                tap(response => {
        console.log('Supplier deleted successfully:', response);
        // Send notification about deletion
                  this.notifySupplier('supplier_deleted', 'Account Deleted', 
          `Your supplier account has been deleted.`,
                    id, '/supplier/dashboard', { 
            supplierName: `${response.firstName} ${response.lastName}`,
                      factoryName: response.factoryName 
                    });
            }),
            catchError(error => {
        console.error('Error deleting supplier:', error);
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