import { ICartItem } from './i-cart-item';

export interface ICart {
  id: string;
  customerId: string;
  cartItems: ICartItem[];
}
