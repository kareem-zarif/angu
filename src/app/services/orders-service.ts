import { Injectable } from '@angular/core';
import { IOrder } from '../models/i-order';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private orders: IOrder[] = [
    {
      id: '1',
      orderDate: '2024-07-04',
      total: 456.99,
      shipTo: 'ASMAA',
      orderNumber: '#402-678-97532',
      status: 'Placed',
      items: [
        {
          name: 'Benjoma Coffee 3in1',
          image: 'assets/coffee.jpg',
          deliveryDate: '2024-07-22',
          returnWindowClosed: '2024-07-22',
          quantity: 2
        }
      ]
    },
    {
      id: '2',
      orderDate: '2023-10-12',
      total: 456.99,
      shipTo: 'ASMAA',
      orderNumber: '#402-678-97532',
      status: 'Placed',
      items: [
        {
          name: 'Benjoma Coffee 3in1',
          image: 'assets/coffee.jpg',
          deliveryDate: '2024-07-22',
          returnWindowClosed: '2024-07-22',
          quantity: 2
        },
        {
          name: 'Sheglam Brush',
          image: 'assets/brush.jpg',
          deliveryDate: '2024-07-22',
          returnWindowClosed: '2024-07-22',
          quantity: 1
        }
      ]
    }
  ];

  getOrders(): IOrder[] {
    return [...this.orders];
  }

  getOrdersByYear(year: number): IOrder[] {
    return this.orders.filter(order => new Date(order.orderDate).getFullYear() === year);
  }

  searchOrders(query: string): IOrder[] {
    const q = query.toLowerCase();
    return this.orders.filter(order =>
      order.orderNumber.toLowerCase().includes(q) ||
      order.items.some(item => item.name.toLowerCase().includes(q))
    );
  }

  getOrderById(id: string): IOrder | undefined {
    return this.orders.find(order => order.id === id);
  }
} 