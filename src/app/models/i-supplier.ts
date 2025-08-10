import { IProduct } from './i-product';

export interface ISupplier {
  id: string;
  firstName: string;
  lastName: string;
  factoryName: string;
  description: string;
  phone: string;
  city: string;
  state: string;
  products?: IProduct[];
  averageRating?: number; // Added property for average rating
}
