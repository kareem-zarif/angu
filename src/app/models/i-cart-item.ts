import { IProduct } from "./i-product";

export interface ICartItem {
 id: string;
  quantity: number;
  Product:IProduct;
  // productId: string;
  // productName: string;
  // pricePerPiece: number;
  // totalPrice: number;
  // orderId: string;
  // productImage?: string;
}
