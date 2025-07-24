import { Component, OnInit } from '@angular/core';
import { OrdersService } from '../../services/orders-service';
import { IOrder } from '../../models/i-order';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

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

  constructor(private ordersService: OrdersService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.orders = this.ordersService.getOrders();
    this.applyFilters();
  }

  applyFilters() {
    let result = this.orders;
    if (this.selectedYear) {
      result = result.filter(order => order.orderDate.startsWith(this.selectedYear));
    }
    if (this.searchQuery) {
      result = result.filter(order =>
        order.orderNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(this.searchQuery.toLowerCase()))
      );
    }
    // Tab filtering (for demo, only 'orders' tab is functional)
    if (this.activeTab === 'cancelled') {
      result = result.filter(order => order.status === 'Cancelled');
    } else if (this.activeTab === 'buyAgain') {
      // Placeholder: could filter for delivered orders, etc.
      result = result;
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
} 