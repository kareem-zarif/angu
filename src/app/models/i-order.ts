import { IOrderItem } from './i-order-item';
import { IOrderStatusHistory } from './i-order-status-history';

export interface IOrder {
  id: string;
  paymentMethodName?: number;
  customerName?: string;
  totalAmount: number;
  paymentMethodId?: string;
  customerId?: string;
  createdOn?: Date;
  orderStatusHistory?: IOrderStatusHistory[];
  orderItems: IOrderItem[];
}
