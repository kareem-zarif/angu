import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOrdersService } from '../../services/admin-orders-service';
import { OrderStatusHistoryService } from '../../services/order-status-history.service';
import { IOrder } from '../../models/i-order';
import { OrderStatus, IOrderStatusHistory } from '../../models/i-order-status-history';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.html'
})
export class AdminOrders implements OnInit {
  orders: IOrder[] = [];
  filteredOrders: IOrder[] = [];
  searchQuery: string = '';
  selectedStatus: string = '';
  loading: boolean = false;
  error: string | null = null;

  // For status update
  selectedOrderId: string | null = null;
  newStatus: OrderStatus | null = null;

  // Enum for template
  orderStatuses = OrderStatus;

  constructor(
    private adminOrdersService: AdminOrdersService,
    private orderStatusHistoryService: OrderStatusHistoryService
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;

    this.adminOrdersService.getAllOrders().subscribe({
      next: (orders) => {
        // Create an array of observables for fetching status history for each order
        const statusHistoryObservables = orders.map(order => {
          return this.orderStatusHistoryService.getOrderStatusHistoryByOrderId(order.id).pipe(
            catchError(error => {
              console.error(`Error fetching status history for order ${order.id}:`, error);
              return of([] as IOrderStatusHistory[]);
            })
          );
        });

        // Wait for all status history requests to complete
        forkJoin(statusHistoryObservables).subscribe({
          next: (statusHistories) => {
            // Assign status histories to their respective orders
            orders.forEach((order, index) => {
              order.orderStatusHistory = statusHistories[index];
            });

            this.orders = orders;
            this.applyFilters();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error fetching order status histories:', error);
            this.orders = orders; // Still use the orders even if status histories failed
            this.applyFilters();
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.error = 'Failed to load orders. Please try again later.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.orders];

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(order =>
        order.id.toLowerCase().includes(query) ||
        (order.customerName && order.customerName.toLowerCase().includes(query)) ||
        order.orderItems.some(item => item.productName.toLowerCase().includes(query))
      );
    }

    // Filter by status
    if (this.selectedStatus) {
      result = result.filter(order => {
        const latestStatus = this.getLatestStatus(order);
        return latestStatus === this.selectedStatus;
      });
    }

    this.filteredOrders = result;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  // Helper method to get the latest status for an order
  getLatestStatus(order: IOrder): OrderStatus | null {
    if (!order.orderStatusHistory || order.orderStatusHistory.length === 0) {
      return null;
    }

    // Sort by modified date descending and return the status of the first (most recent)
    const latestStatusHistory = order.orderStatusHistory.sort((a, b) =>
      new Date(b.modifiedOn).getTime() - new Date(a.modifiedOn).getTime()
    )[0];

    return latestStatusHistory.orderStatus;
  }

  // Update order status
  updateOrderStatus(orderId: string, status: OrderStatus): void {
    this.loading = true;

    this.adminOrdersService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        // Refresh the orders to get the updated status
        this.loadOrders();
      },
      error: (error) => {
        console.error(`Error updating status for order ${orderId}:`, error);
        this.error = 'Failed to update order status. Please try again.';
        this.loading = false;
      }
    });
  }

  // Delete order
  deleteOrder(orderId: string): void {
    if (confirm('Are you sure you want to delete this order?')) {
      this.loading = true;

      this.adminOrdersService.deleteOrder(orderId).subscribe({
        next: () => {
          // Remove the order from the local arrays
          this.orders = this.orders.filter(o => o.id !== orderId);
          this.filteredOrders = this.filteredOrders.filter(o => o.id !== orderId);
          this.loading = false;
        },
        error: (error) => {
          console.error(`Error deleting order ${orderId}:`, error);
          this.error = 'Failed to delete order. Please try again.';
          this.loading = false;
        }
      });
    }
  }

  // Get sorted order status history
  getSortedOrderStatusHistory(order: IOrder): IOrderStatusHistory[] {
    if (!order.orderStatusHistory) return [];
    return [...order.orderStatusHistory].sort(
      (a, b) => new Date(b.modifiedOn).getTime() - new Date(a.modifiedOn).getTime()
    );
  }
}
