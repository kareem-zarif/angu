  import { IReview } from './i-reviews'; 
  export enum ProductApprovalStatus {
    Pending = 1,
    Approved = 2,
    Rejected = 3
  }

  export enum ShippingTypes {
    Free = 1,
    FreeINSameGovernate = 2,
    Paid = 3,
    None = 4
  }

// Main product interface matching ProductResDto from backend
export interface IProduct {
  id: string; // Backend returns Guid as string
  rating?: number;
  supplierNames?: string[];
  suppliers?: string[]; // For backward compatibility
  productPicsPathes: string[];
  name: string;
  description: string;
  pricePerPiece: number;
  pricePer50Piece?: number;
  pricePer100Piece?: number;
  noINStock: number;
  minNumToFactoryOrder: number;
  approvalStatus: ProductApprovalStatus;
  warrantyNMonths?: number;
  shipping: ShippingTypes;
  subCategoryId: string; // Backend returns Guid as string
  reviews?: IReview[];
}

// Create DTO interface matching ProductCreateDto from backend
export interface ProductCreateDto {
  name: string;
  description: string;
  pricePerPiece: number;
  pricePer50Piece?: number;
  pricePer100Piece?: number;
  noINStock: number;
  minNumToFactoryOrder: number;
  approvalStatus: ProductApprovalStatus;
  images?: File[];
  warrantyNMonths?: number;
  shipping: ShippingTypes;
  subCategoryId: string; // Backend expects Guid but we handle as string
}

// Update DTO interface matching ProductUpdateDto from backend
export interface ProductUpdateDto {
  id: string; // Backend expects Guid but we handle as string
  name: string;
  description: string;
  pricePerPiece: number;
  pricePer50Piece?: number;
  pricePer100Piece?: number;
  noINStock: number;
  minNumToFactoryOrder: number;
  approvalStatus: ProductApprovalStatus;
  images?: File[] | null;
  warrantyNMonths?: number;
  shipping: ShippingTypes;
  subCategoryId: string; // Backend expects Guid but we handle as string
}

