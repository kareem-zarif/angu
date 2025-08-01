import { Component, OnInit } from '@angular/core';
import { OrdersService } from '../../services/orders-service';
import { IOrder } from '../../models/i-order';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrderStatus } from '../../models/i-order-status-history';
import { OrderStatusHistoryService } from '../../services/order-status-history.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './orders.html',
})
export class OrdersComponent implements OnInit {
  orders: IOrder[] = [];
  filteredOrders: IOrder[] = [];
  searchQuery: string = '';
  selectedYear: string = '2024';
  activeTab: 'orders' | 'buyAgain' | 'cancelled' = 'orders';
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private ordersService: OrdersService,
    private orderStatusHistoryService: OrderStatusHistoryService
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.error = null;

    this.ordersService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;

        // For each order, ensure we have the latest status
        const orderStatusObservables = orders.map(order => {
          if (!order.orderStatusHistory || order.orderStatusHistory.length === 0) {
            return this.orderStatusHistoryService.getByOrderId(order.id).pipe(
              map(statusHistories => {
                order.orderStatusHistory = statusHistories;
                return order;
              }),
              catchError(error => {
                console.error(`Error fetching status history for order ${order.id}:`, error);
                return of(order); // Return the order without status history
              })
            );
          }
          return of(order);
        });

        forkJoin(orderStatusObservables).subscribe({
          next: (ordersWithStatus) => {
            this.orders = ordersWithStatus;
            this.applyFilters();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading order status histories:', error);
            this.error = 'Failed to load some order status histories';
            this.applyFilters();
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.error = 'Failed to load orders';
        this.loading = false;
      }
    });
  }

  applyFilters() {
    let result = [...this.orders];

    // Year filter
    if (this.selectedYear) {
      result = result.filter(order => {
        if (order.createdOn) {
          const orderDate = new Date(order.createdOn);
          return orderDate.getFullYear().toString() === this.selectedYear;
        }
        return false;
      });
    }

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(order =>
        order.id.toLowerCase().includes(query) ||
        (order.customerName && order.customerName.toLowerCase().includes(query)) ||
        order.orderItems.some(item => item.productName.toLowerCase().includes(query))
      );
    }

    // Tab filtering
    if (this.activeTab === 'cancelled') {
      result = result.filter(order => {
        if (order.orderStatusHistory && order.orderStatusHistory.length > 0) {
          // Get the latest status
          const latestStatus = order.orderStatusHistory.sort((a, b) =>
            new Date(b.modifiedOn).getTime() - new Date(a.modifiedOn).getTime()
          )[0];
          return latestStatus.orderStatus === OrderStatus.Cancelled;
        }
        return false;
      });
    } else if (this.activeTab === 'buyAgain') {
      // Filter for delivered orders that can be purchased again
      result = result.filter(order => {
        if (order.orderStatusHistory && order.orderStatusHistory.length > 0) {
          // Get the latest status
          const latestStatus = order.orderStatusHistory.sort((a, b) =>
            new Date(b.modifiedOn).getTime() - new Date(a.modifiedOn).getTime()
          )[0];
          return latestStatus.orderStatus === OrderStatus.Delivered;
        }
        return false;
      });
    }

    this.filteredOrders = result;
  }

  onSearch(query: string) {
    this.searchQuery = query;
    this.applyFilters();
  }

  onYearChange(year: string) {
    this.selectedYear = year;
    this.applyFilters();
  }

  setTab(tab: 'orders' | 'buyAgain' | 'cancelled') {
    this.activeTab = tab;
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

  // Helper method to get a display-friendly status name
  getStatusDisplayName(status: OrderStatus | null): string {
    if (!status) return 'Unknown';

    // Convert enum value to a more user-friendly format
    // e.g., "OrderStatus.Delivered" becomes "Delivered"
    return status.toString();
  }

  getSortedOrderStatusHistory(order: IOrder): any[] {
    return order.orderStatusHistory!.sort((a, b) => new Date(b.modifiedOn).getTime() - new Date(a.modifiedOn).getTime());
  }
}
