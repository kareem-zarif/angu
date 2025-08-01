export enum OrderStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Shipped = 'Shipped',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled',
  Returned = 'Returned'
}

export interface IOrderStatusHistory {
  id: string;
  orderStatus: OrderStatus;
  modifiedOn: Date;
  orderId: string;
}
