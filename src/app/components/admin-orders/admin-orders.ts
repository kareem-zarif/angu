import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOrdersService, Order, OrderCreateDto, OrderUpdateDto, OrderStatus, OrderItemCreateDto } from '../../services/admin-orders-service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.html',
})
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = false;

  showModal = false;
  editOrder: Order | null = null;
  form: Partial<Order> = {};
  
  // Validation properties
  formErrors: { [key: string]: string } = {};
  isSubmitting = false;

  // Order status options
  orderStatuses = [
    { value: OrderStatus.pending, label: 'Pending' },
    { value: OrderStatus.Confirmed, label: 'Confirmed' },
    { value: OrderStatus.Shipped, label: 'Shipped' },
    { value: OrderStatus.Deliverd, label: 'Delivered' },
    { value: OrderStatus.Cancelled, label: 'Cancelled' },
    { value: OrderStatus.Returned, label: 'Returned' }
  ];

  constructor(private ordersService: AdminOrdersService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.ordersService.getOrders().subscribe({
      next: (res) => {
        console.log('Orders loaded:', res);
        this.orders = res;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loading = false;
      }
    });
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
        orderItems: this.form.orderItems || []
      };
      console.log('Updating order with data:', updateDto);
      this.ordersService.updateOrder(updateDto).subscribe({
        next: (response) => {
          console.log('Order updated successfully:', response);
          this.showModal = false;
          this.loadOrders();
          this.isSubmitting = false;
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
      case OrderStatus.pending:
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
}