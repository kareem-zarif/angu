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
          image: "assets/61cI-CFN4ZL._UF894,1000_QL80_.jpg",
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
          image: "assets/61cI-CFN4ZL._UF894,1000_QL80_.jpg",
          deliveryDate: '2024-07-22',
          returnWindowClosed: '2024-07-22',
          quantity: 2
        },
        {
          name: 'Sheglam Brush',
          image:"assets/images.jpeg",
          deliveryDate: '2024-07-22',
          returnWindowClosed: '2024-07-22',
          quantity: 1
        }
      ]
    },
    {
      id: '3',
      orderDate: '2022-05-15',
      total: 89.99,
      shipTo: 'JOHN DOE',
      orderNumber: '#402-123-45678',
      status: 'Delivered',
      items: [
        {
          name: 'High-Quality Kitchen Appliance Set',
          image: "assets/images.jpeg",
          deliveryDate: '2022-05-20',
          returnWindowClosed: '2022-06-01',
          quantity: 1
        }
      ]
    },
    {
      id: '4',
      orderDate: '2023-11-02',
      total: 59.99,
      shipTo: 'JANE SMITH',
      orderNumber: '#402-987-65432',
      status: 'Placed',
      items: [
        {
          name: 'Wireless Headphones',
          image: "assets/71NMUHszF4L._UF894,1000_QL80_.jpg",
          deliveryDate: '2023-11-07',
          returnWindowClosed: '2023-11-20',
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