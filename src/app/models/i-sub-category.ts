import { IProduct } from './i-product';

export interface ISubCategory {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  products: IProduct[];
}
