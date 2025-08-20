// Review interfaces matching backend DTOs
export interface IReview {
  id: string;
  rating: number;
  comment: string;
  productName: string;
  customerName: string;
  customerId: string;
  productId: string;
}

// Create DTO interface
export interface ReviewCreateDto {
  rating: number;
  comment?: string;
  customerId: string;
  productId: string;
}

// Response DTO interface
export interface ReviewResDto {
  id: string;
  rating: number;
  comment?: string;
  productName: string;
  customerId: string;
  customerName: string;
  productId: string;
}

// Update DTO interface
export interface ReviewUpdateDto {
  id: string;
  rating: number;
  comment?: string;
  customerId: string;
  productId: string;
}
