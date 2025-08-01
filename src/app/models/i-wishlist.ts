import { IProduct } from './i-product';

export interface IWishlist {
  id: string;
  customerId: string;
  customerName: string;
  products: IProduct[];
}
