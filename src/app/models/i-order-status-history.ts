export enum OrderStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Shipped = 'Shipped',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled'
}

export interface IOrderStatusHistory {
  id: string;
  orderStatus: OrderStatus;
  modifiedOn: Date;
  orderId: string;
}

export interface OrderStatusHistoryCreateDto {
  orderStatus: OrderStatus;
  orderId: string;
}

export interface OrderStatusHistoryResDto {
  id: string;
  orderStatus: OrderStatus;
  modifiedOn: Date;
  orderId: string;
}

export interface OrderStatusHistoryUpdateDto {
  id: string;
  orderStatus: OrderStatus;
  orderId: string;
}
