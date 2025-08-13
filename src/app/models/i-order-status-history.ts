export enum OrderStatus {
  Pending = 1,
  Confirmed = 2,
  Shipped = 3,
  Deliverd = 4, // Note: matches backend enum spelling
  Cancelled = 5,
  Returned = 6
}

export interface IOrderStatusHistory {
  id: string;
  orderStatus: OrderStatus;
  modifiedOn: Date;
  orderId: string;
}
