export interface IOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerPiece: number;
  totalPrice: number;
  orderId: string;
  productImage?: string;
}
