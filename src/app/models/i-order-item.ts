export interface IOrderItem {
  id: string;
  quantity: number;
  productId: string;
  productName: string;
  pricePerPiece: number;
  totalPrice: number;
  orderId: string;
  productImage?: string;
}
