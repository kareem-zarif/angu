import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerOrdersService, SellerOrderStats } from '../../services/seller-orders.service';
import { IOrder } from '../../models/i-order';
import { PaginationComponent } from '../shared/pagination/pagination';
import { OrderStatusHistoryService, OrderStatusHistoryResDto, OrderStatus } from '../../services/order-status-history.service';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './seller-orders.html',
  styleUrl: './seller-orders.css'
})
export class SellerOrdersComponent implements OnInit {
  orders: IOrder[] = [];
  filteredOrders: IOrder[] = [];
  orderStats: SellerOrderStats = {
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  };
  isLoading = false;
  isSubmitting = false;

  // Search properties
  searchTerm = '';
  searchField = 'all'; // 'all', 'customer', 'orderId', 'status'
  statusFilter = 'all';

  // Modal states
  showDetailsModal = false;
  showStatusHistoryModal = false;
  selectedOrder: IOrder | null = null;
  selectedOrderHistory: OrderStatusHistoryResDto[] = [];
  
  // Add property to store status history for each order
  orderStatusHistory: { [orderId: string]: OrderStatusHistoryResDto[] } = {};

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 1;

  constructor(
    private sellerOrdersService: SellerOrdersService,
    private orderStatusHistoryService: OrderStatusHistoryService
  ) {}

  ngOnInit() {
    this.loadOrders();
    this.loadOrderStats();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.sellerOrdersService.getSellerOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        
        // Load status history for each order
        this.orders.forEach(order => {
          this.loadOrderStatusHistory(order.id);
        });
        
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.isLoading = false;
        // Show error message to user
        alert('Failed to load orders. Please try again later.');
      }
    });
  }

  loadOrderStats(): void {
    this.sellerOrdersService.getSellerOrderStats().subscribe({
      next: (stats) => {
        this.orderStats = stats;
      },
      error: (error) => {
        console.error('Error loading order stats:', error);
        // Show error message to user
        alert('Failed to load order statistics. Please try again later.');
      }
    });
  }

  applyFilters() {
    // Apply search and status filters
    this.filteredOrders = this.orders.filter(order => {
      // Search filter
      if (!this.searchTerm) return true;
      
      const searchLower = this.searchTerm.toLowerCase();
      
      switch (this.searchField) {
        case 'orderId':
          return order.id.toLowerCase().includes(searchLower);
        case 'customer':
          return order.customerName?.toLowerCase().includes(searchLower) || false;
        case 'status':
          return this.getOrderStatus(order).toLowerCase().includes(searchLower);
        case 'all':
        default:
          return (
            order.id.toLowerCase().includes(searchLower) ||
            (order.customerName?.toLowerCase().includes(searchLower) || false) ||
            this.getOrderStatus(order).toLowerCase().includes(searchLower)
          );
      }
    });

    // Update pagination
    this.totalItems = this.filteredOrders.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    // Reset to first page if current page is out of bounds
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  getPaginatedOrders(): IOrder[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredOrders.slice(startIndex, endIndex);
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onItemsPerPageChange(itemsPerPage: number) {
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1; // Reset to first page
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
  }

  onSearch() {
    this.currentPage = 1; // Reset to first page when searching
    this.applyFilters();
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchField = 'all';
    this.statusFilter = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }

  viewDetails(order: IOrder): void {
    this.selectedOrder = order;
    this.showDetailsModal = true;
  }

  updateOrderStatus(orderId: string, newStatus: string): void {
    this.isSubmitting = true;
    
    // Find the order in the current list
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      this.isSubmitting = false;
      alert('Order not found!');
      return;
    }

    // Map the status string to enum value
    const statusMap: { [key: string]: OrderStatus } = {
      'Pending': OrderStatus.Pending,
      'Confirmed': OrderStatus.Confirmed,
      'Shipped': OrderStatus.Shipped,
      'Delivered': OrderStatus.Deliverd, // Note: UI shows "Delivered" but enum is "Deliverd"
      'Cancelled': OrderStatus.Cancelled,
      'Returned': OrderStatus.Returned
    };

    const orderStatus = statusMap[newStatus] || OrderStatus.Pending;
    
    const updateDto = {
      orderId: orderId,
      status: newStatus
    };
    
    this.sellerOrdersService.updateOrderStatus(updateDto).subscribe({
      next: () => {
        // Update the local status history immediately
        if (!this.orderStatusHistory[orderId]) {
          this.orderStatusHistory[orderId] = [];
        }
        
        // Add new status to history
        this.orderStatusHistory[orderId].push({
          id: '',
          orderStatus: orderStatus,
          modifiedOn: new Date(),
          orderId: orderId
        });
        
        // Reapply filters to update the display
        this.applyFilters();
        this.isSubmitting = false;
        alert('Order status updated successfully!');
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        this.isSubmitting = false;
        alert('Failed to update order status. Please try again.');
      }
    });
  }

  // Method to load status history for an order (without showing modal)
  loadOrderStatusHistory(orderId: string) {
    console.log(`Attempting to load status history for order: ${orderId}`);
    this.orderStatusHistoryService.getOrderStatusHistoriesByOrderId(orderId).subscribe({
      next: (history) => {
        this.orderStatusHistory[orderId] = history;
        console.log(`Status history loaded for order ${orderId}:`, history);
      },
      error: (error) => {
        console.error(`Error loading status history for order ${orderId}:`, error);
        console.error('Error details:', error);
        this.orderStatusHistory[orderId] = [];
      }
    });
  }

  showOrderStatusHistory(orderId: string): void {
    console.log(`Attempting to load status history for order: ${orderId}`);
    this.orderStatusHistoryService.getOrderStatusHistoriesByOrderId(orderId).subscribe({
      next: (history) => {
        console.log(`Raw status history response for order ${orderId}:`, history);
        this.selectedOrderHistory = history || [];
        this.showStatusHistoryModal = true;
        console.log(`Status history loaded for order ${orderId}:`, this.selectedOrderHistory);
      },
      error: (error) => {
        console.error(`Error loading status history for order ${orderId}:`, error);
        this.selectedOrderHistory = [];
        this.showStatusHistoryModal = true;
      }
    });
  }

  closeStatusHistoryModal(): void {
    this.showStatusHistoryModal = false;
    this.selectedOrderHistory = [];
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatStatusHistoryDate(date: Date | string): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString();
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusOptions(): { value: string; label: string }[] {
    return [
      { value: 'Pending', label: 'Pending' },
      { value: 'Confirmed', label: 'Confirmed' },
      { value: 'Shipped', label: 'Shipped' },
      { value: 'Delivered', label: 'Delivered' },
      { value: 'Cancelled', label: 'Cancelled' },
      { value: 'Returned', label: 'Returned' }
    ];
  }

  getOrderStatusValue(order: IOrder): string {
    const history = this.orderStatusHistory[order.id];
    if (history && history.length > 0) {
      const lastStatus = history[history.length - 1].orderStatus;
      return this.getStatusName(lastStatus);
    }
    return 'Pending';
  }

  getStatusName(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Pending: return 'Pending';
      case OrderStatus.Confirmed: return 'Confirmed';
      case OrderStatus.Shipped: return 'Shipped';
      case OrderStatus.Deliverd: return 'Delivered'; // Note: enum is "Deliverd" but UI shows "Delivered"
      case OrderStatus.Cancelled: return 'Cancelled';
      case OrderStatus.Returned: return 'Returned';
      default: return 'Unknown';
    }
  }

  getOrderItemsCount(order: IOrder): number {
    return order.orderItems?.length || 0;
  }

  // Helper method to get order status from loaded status history
  getOrderStatus(order: IOrder): string {
    const history = this.orderStatusHistory[order.id];
    if (history && history.length > 0) {
      const lastStatus = history[history.length - 1].orderStatus;
      return this.getStatusName(lastStatus);
    }
    return 'Pending';
  }
} 