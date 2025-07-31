export interface IOrder {
  id: string;
  orderDate: string; // ISO date string
  total: number;
  shipTo: string;
  orderNumber: string;
  items: Array<{
    name: string;
    image: string;
    deliveryDate: string;
    returnWindowClosed: string;
    quantity: number;
  }>;
  status: 'Placed' | 'Cancelled' | 'Delivered';
} 