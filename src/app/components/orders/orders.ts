import { Component, OnInit } from '@angular/core';
import { OrdersService } from '../../services/orders-service';
import { IOrder } from '../../models/i-order';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IOrderStatusHistory, OrderStatus } from '../../models/i-order-status-history';
import { OrderStatusHistoryService } from '../../services/order-status-history.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Auth } from '../../services/auth';
import { environment } from '../../../environment/environment';
import { IOrderItem } from '../../models/i-order-item';

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
  selectedYear: string = '2025';
  activeTab: 'orders' | 'buyAgain' | 'cancelled' = 'orders';
  loading: boolean = false;
  error: string | null = null;

  // Add OrderStatus enum as a class property to use in template
  OrderStatus = OrderStatus;

  private shortOrderIds: Map<string, string> = new Map();
  constructor(
    private ordersService: OrdersService,
    private orderStatusHistoryService: OrderStatusHistoryService,
    private router: Router,
    private auth: Auth,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/orders' } });
      return; //علشان نوقف أي تنفيذ بعد التحويل (يعني مينفذش الكود اللي بعده).
    }

    // Check for orderId from Stripe redirect
    const orderId = this.route.snapshot.queryParamMap.get('orderId');
    if (orderId) {
      this.showToast('Payment successful! Your order is confirmed.');
      // Clear query params for clean URL
      this.router.navigate(['/orders'], { replaceUrl: true });
    }
    this.loadOrders();
  }
  private showToast(message: string): void {
    this.error = message; // Reuse error property for success message
    setTimeout(() => {
      this.error = null;
    }, 3000);
  }
  loadOrders(): void {
    this.loading = true;
    this.error = null;

    const currUser = this.auth.getCurrentUser();
    if (!currUser?.UserId || typeof currUser?.UserId !== 'string') {
      this.error = 'User not authenticated';
      this.loading = false;
      return;
    }

    this.ordersService.getOrdersByCustomerId(currUser?.UserId).subscribe({
      next: (orders) => {
        // this.orders = orders;
        this.orders = orders.map(order => ({
          ...order,
          orderItems: order.orderItems.map(item => ({
            ...item,
            unitPrice: item.quantity ? item.totalPrice / item.quantity : item.pricePerPiece // Fallback to pricePerPiece if quantity is 0
          } as IOrderItem))
        } as IOrder));

        // For each order, ensure we have the latest status
        const orderStatusObservables = orders.map(order => {
          return this.orderStatusHistoryService.getOrderStatusHistoriesByOrderId(order.id).pipe(
            map(statusHistories => {
              // Create a proper IOrder object with status history
              return {
                ...order,
                orderStatusHistory: statusHistories
              } as IOrder;
            }),
            catchError(error => {
              console.error(`Error fetching status history for order ${order.id}:`, error);
              return of({
                ...order,
                orderStatusHistory: [] // Initialize as empty array
              } as IOrder);
            })
          );
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

  applyFilters(): void {
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
      result = result.filter(order => this.getLatestStatus(order) === OrderStatus.Cancelled);
    } else if (this.activeTab === 'buyAgain') {
      result = result.filter(order => this.getLatestStatus(order) === OrderStatus.Deliverd);
    }

    this.filteredOrders = result;
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  onYearChange(year: string): void {
    this.selectedYear = year;
    this.applyFilters();
  }

  setTab(tab: 'orders' | 'buyAgain' | 'cancelled'): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  // Update getLatestStatus to handle null safely
  getLatestStatus(order: IOrder): OrderStatus | null {
    if (!order.orderStatusHistory?.length) return null;

    const sorted = [...order.orderStatusHistory].sort((a, b) =>
      new Date(b.modifiedOn).getTime() - new Date(a.modifiedOn).getTime()
    );
    return sorted[0]?.orderStatus ?? null;
  }

  // Add method to convert OrderStatus to display name
  getStatusDisplayName(status: OrderStatus | null): string {
    if (!status) return 'Unknown';

    switch (status) {
      case OrderStatus.Pending: return 'Pending';
      case OrderStatus.Confirmed: return 'Confirmed';
      case OrderStatus.Shipped: return 'Shipped';
      case OrderStatus.Deliverd: return 'Delivered';
      case OrderStatus.Cancelled: return 'Cancelled';
      case OrderStatus.Returned: return 'Returned';
      default: return 'Unknown';
    }
  }

  getSortedOrderStatusHistory(order: IOrder): IOrderStatusHistory[] {
    if (!order.orderStatusHistory) return [];

    return [...order.orderStatusHistory].sort((a, b) =>
      new Date(b.modifiedOn).getTime() - new Date(a.modifiedOn).getTime()
    );
  }

  getImageUrl(imagePath: string | undefined): string {
    return imagePath ? `${environment.imgUrl}${imagePath}` : 'assets/placeholder-image.png';
  }
  getShortOrderId(orderId: string): string {
    if (!this.shortOrderIds.has(orderId)) {
      const baseId = orderId.slice(-8);
      // Simple deterministic hash using orderId length and a fixed modulo
      const hash = (orderId.length + orderId.charCodeAt(0)) % 100; // 00-99
      const suffix = hash.toString().padStart(2, '0');
      this.shortOrderIds.set(orderId, `${suffix}${baseId}`);
    }
    return this.shortOrderIds.get(orderId)!;
  }
}
