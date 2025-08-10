import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOrdersService, Order, OrderCreateDto, OrderUpdateDto, OrderItemCreateDto } from '../../services/admin-orders-service';
import { OrderStatusHistoryService, OrderStatusHistoryCreateDto } from '../../services/order-status-history.service';
import { NotificationService } from '../../services/notification.service';
import { PaginationComponent } from '../shared/pagination/pagination';
import { OrderStatus, OrderStatus as OrderStatusModel } from '../../models/i-order-status-history';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './admin-orders.html',
})
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = false;

  showModal = false;
  showStatusHistoryModal = false;
  editOrder: Order | null = null;
  form: Partial<Order> = {};
  selectedOrderHistory: any[] = [];

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 1;

  // Search properties
  searchTerm = '';
  searchField = 'all'; // 'all', 'customer', 'orderId', 'status'

  // Validation properties
  formErrors: { [key: string]: string } = {};
  isSubmitting = false;

  // Order status options
  orderStatuses = [
    { value: OrderStatusModel.Pending, label: 'Pending' },
    { value: OrderStatusModel.Confirmed, label: 'Confirmed' },
    { value: OrderStatusModel.Shipped, label: 'Shipped' },
    { value: OrderStatusModel.Deliverd, label: 'Delivered' },
    { value: OrderStatusModel.Cancelled, label: 'Cancelled' },
    { value: OrderStatusModel.Returned, label: 'Returned' }
  ];

  constructor(
    private ordersService: AdminOrdersService,
    private orderStatusHistoryService: OrderStatusHistoryService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadOrders();
    // Test the status history API
    this.testStatusHistoryAPI();
  }

  // Test method to debug status history API
  testStatusHistoryAPI() {
    console.log('Testing status history API...');
    this.orderStatusHistoryService.getOrderStatusHistories().subscribe({
      next: (allHistory) => {
        console.log('All status history from API:', allHistory);
        if (allHistory.length > 0) {
          console.log('Sample status history record:', allHistory[0]);
        } else {
          console.log('No status history records found in the database');
        }
      },
      error: (error) => {
        console.error('Error testing status history API:', error);
      }
    });
  }

  loadOrders() {
    this.loading = true;
    this.ordersService.getOrders().subscribe({
      next: (res) => {
        console.log('Orders loaded:', res);
        this.orders = res;
        this.applyFilters();

        // Debug: Log order IDs
        console.log('Order IDs available:', this.orders.map(order => order.id));

        // Load status history for each order
        this.orders.forEach(order => {
          console.log(`Loading status history for order ID: ${order.id}`);
          this.loadOrderStatusHistory(order.id);
        });

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    // Apply search filter
    this.filteredOrders = this.orders.filter(order => {
      if (!this.searchTerm) return true;

      const searchLower = this.searchTerm.toLowerCase();

      switch (this.searchField) {
        case 'customer':
          return (order.customerName && order.customerName.toLowerCase().includes(searchLower));
        case 'orderId':
          return order.id.toLowerCase().includes(searchLower);
        case 'status':
          return this.getStatusLabel(order.currentStatus || 1).toLowerCase().includes(searchLower);
        case 'all':
        default:
          return (
            (order.customerName && order.customerName.toLowerCase().includes(searchLower)) ||
            order.id.toLowerCase().includes(searchLower) ||
            this.getStatusLabel(order.currentStatus || 1).toLowerCase().includes(searchLower) ||
            order.totalAmount.toString().includes(searchLower)
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

  getPaginatedOrders(): Order[] {
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
    this.currentPage = 1;
    this.applyFilters();
  }

  openAdd() {
    this.editOrder = null;
    this.form = {
      totalAmount: 0,
      orderItems: []
    };
    this.formErrors = {};
    this.showModal = true;
  }

  openEdit(order: Order) {
    this.editOrder = order;
    this.form = { ...order };
    this.formErrors = {};
    this.showModal = true;
  }

  validateForm(): boolean {
    this.formErrors = {};

    // Total Amount validation
    if (!this.form.totalAmount || this.form.totalAmount <= 0) {
      this.formErrors['totalAmount'] = 'Total amount must be greater than 0';
    }

    // Customer ID validation (optional but recommended)
    if (!this.form.customerId) {
      this.formErrors['customerId'] = 'Customer is required';
    }

    // Payment Method ID validation (optional)
    if (!this.form.paymentMethodId) {
      this.formErrors['paymentMethodId'] = 'Payment method is required';
    }

    // Order Status validation
    if (!this.form.currentStatus) {
      this.formErrors['currentStatus'] = 'Order status is required';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  saveOrder() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    if (this.editOrder) {
      // Update
      const updateDto: OrderUpdateDto = {
        id: this.editOrder.id,
        totalAmount: this.form.totalAmount!,
        paymentMethodId: this.form.paymentMethodId,
        customerId: this.form.customerId,
        currentStatus: this.form.currentStatus,
        orderItems: this.form.orderItems || []
      };
      console.log('Updating order with data:', updateDto);
      this.ordersService.updateOrder(updateDto).subscribe({
        next: (response) => {
          console.log('Order updated successfully:', response);

          // Create status history entry if status changed
          if (this.editOrder && this.editOrder.currentStatus !== this.form.currentStatus) {
            const statusHistoryDto: OrderStatusHistoryCreateDto = {
              orderStatus: this.form.currentStatus!,
              orderId: this.editOrder.id
            };

            this.orderStatusHistoryService.createOrderStatusHistory(statusHistoryDto).subscribe({
              next: (historyResponse) => {
                console.log('Status history created successfully:', historyResponse);
                this.showModal = false;
                this.loadOrders();
                this.isSubmitting = false;
              },
              error: (historyError) => {
                console.error('Error creating status history:', historyError);
                // Even if status history creation fails, the order was updated successfully
                this.showModal = false;
                this.loadOrders();
                this.isSubmitting = false;
                alert('Order updated but failed to create status history. Please check the logs.');
              }
            });
          } else {
            this.showModal = false;
            this.loadOrders();
            this.isSubmitting = false;
          }
        },
        error: (error) => {
          console.error('Error updating order:', error);
          console.error('Error details:', error.error);
          this.formErrors['general'] = `Failed to update order: ${error.error?.message || error.message || 'Unknown error'}`;
          this.isSubmitting = false;
        }
      });
    } else {
      // Create
      const createDto: OrderCreateDto = {
        totalAmount: this.form.totalAmount!,
        paymentMethodId: this.form.paymentMethodId,
        customerId: this.form.customerId,
        orderItems: this.form.orderItems || []
      };
      console.log('Creating order with data:', createDto);
      this.ordersService.createOrder(createDto).subscribe({
        next: (response) => {
          console.log('Order created successfully:', response);
          this.showModal = false;
          this.loadOrders();
          this.isSubmitting = false;

          // Create notification for seller about new order
          // Note: In a real app, you'd get the seller ID from the order items or customer data
          const sellerId = 'seller-123'; // This should come from order.sellerId or orderItems[].sellerId
          const customerName = 'Customer'; // This should come from customer data
          this.notificationService.createNewOrderNotification(
            sellerId,
            response.id,
            customerName
          ).subscribe({
            next: () => console.log('Notification created for new order'),
            error: (error) => console.error('Error creating notification:', error)
          });
        },
        error: (error) => {
          console.error('Error creating order:', error);
          console.error('Error details:', error.error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          this.formErrors['general'] = `Failed to create order: ${error.error?.message || error.message || 'Unknown error'}`;
          this.isSubmitting = false;
        }
      });
    }
  }

  deleteOrder(order: Order) {
    if (confirm(`Are you sure you want to delete order #${order.id}?`)) {
      this.ordersService.deleteOrder(order.id).subscribe({
        next: () => {
          this.loadOrders();
        },
        error: (error) => {
          console.error('Error deleting order:', error);
          alert('Failed to delete order. Please try again.');
        }
      });
    }
  }

  clearError(field: string) {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  getStatusLabel(status: OrderStatus): string {
    const statusOption = this.orderStatuses.find(s => s.value === status);
    return statusOption ? statusOption.label : 'Unknown';
  }

  getStatusClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Deliverd:
        return 'bg-green-200 text-green-800';
      case OrderStatus.Shipped:
        return 'bg-blue-200 text-blue-800';
      case OrderStatus.Confirmed:
        return 'bg-yellow-200 text-yellow-800';
      case OrderStatus.Cancelled:
        return 'bg-red-200 text-red-800';
      case OrderStatus.Returned:
        return 'bg-purple-200 text-purple-800';
      case OrderStatus.Pending:
      default:
        return 'bg-gray-200 text-gray-800';
    }
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  }

  getOrderItemsCount(order: Order): number {
    return order.orderItems?.length || 0;
  }

  // Add property to store status history
  orderStatusHistory: { [orderId: string]: any[] } = {};

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

  // Method to show status history modal for an order
  showOrderStatusHistory(orderId: string) {
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

  // Method to get status history for an order
  getOrderStatusHistory(orderId: string): any[] {
    return this.orderStatusHistory[orderId] || [];
  }

  // Method to format status history date
  formatStatusHistoryDate(date: Date | string): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString();
  }

  // Method to close status history modal
  closeStatusHistoryModal() {
    this.showStatusHistoryModal = false;
    this.selectedOrderHistory = [];
  }

  updateOrderStatus(order: Order, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const newStatus = parseInt(selectElement.value) as OrderStatus;

    if (newStatus === order.currentStatus) {
      return; // No change needed
    }

    this.isSubmitting = true;

    const updateDto: OrderUpdateDto = {
      id: order.id,
      totalAmount: order.totalAmount,
      paymentMethodId: order.paymentMethodId,
      customerId: order.customerId,
      currentStatus: newStatus,
      orderItems: order.orderItems || []
    };

    // First update the order
    this.ordersService.updateOrder(updateDto).subscribe({
      next: (response) => {
        console.log('Order status updated successfully:', response);

        // Create status history entry
        const statusHistoryDto: OrderStatusHistoryCreateDto = {
          orderStatus: newStatus,
          orderId: order.id
        };

        this.orderStatusHistoryService.createOrderStatusHistory(statusHistoryDto).subscribe({
          next: (historyResponse) => {
            console.log('Status history created successfully:', historyResponse);
            // Update the local order object
            order.currentStatus = newStatus;
            this.isSubmitting = false;

            // Create notification for seller about order status change
            // Note: In a real app, you'd get the seller ID from the order data
            const sellerId = 'seller-123'; // This should come from order.sellerId or order.supplierId
            const statusLabel = this.getStatusLabel(newStatus);
            this.notificationService.createOrderStatusChangeNotification(
              sellerId,
              order.id,
              statusLabel
            ).subscribe({
              next: () => console.log('Notification created for order status change'),
              error: (error) => console.error('Error creating notification:', error)
            });
          },
          error: (historyError) => {
            console.error('Error creating status history:', historyError);
            // Even if status history creation fails, the order was updated successfully
            order.currentStatus = newStatus;
            this.isSubmitting = false;
            alert('Order status updated but failed to create status history. Please check the logs.');
          }
        });
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        // Reset the select to the original value
        selectElement.value = order.currentStatus?.toString() || '1';
        this.isSubmitting = false;
        alert('Failed to update order status. Please try again.');
      }
    });
  }
}
