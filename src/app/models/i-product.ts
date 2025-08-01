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

// Main product interface matching ProductResDto
export interface IProduct {
  id: string;
  rating?: number;
  supplierNames?: string[];
  productPicsPathes: string[];
  name: string;
  description: string;
  pricePerPiece: number;
  pricePer50Piece?: number;
  pricePer100Piece?: number;
  noINStock: number;  // Changed to match C# property name
  minNumToFactoryOrder: number;
  approvalStatus: ProductApprovalStatus;
  warrantyNMonths?: number;
  shipping: ShippingTypes;
  subCategoryId: string;
}

// Create DTO interface
export interface ProductCreateDto {
  name: string;
  description: string;
  pricePerPiece: number;
  pricePer50Piece?: number;
  pricePer100Piece?: number;
  noINStock: number;  // Changed to match C# property name
  minNumToFactoryOrder: number;
  approvalStatus: ProductApprovalStatus;
  images?: File[];
  warrantyNMonths?: number;
  shipping: ShippingTypes;
  subCategoryId: string;
}

// Update DTO interface
export interface ProductUpdateDto {
  id: string;
  name: string;
  description: string;
  pricePerPiece: number;
  pricePer50Piece?: number;
  pricePer100Piece?: number;
  noINStock: number;  // Changed to match C# property name
  minNumToFactoryOrder: number;
  approvalStatus: ProductApprovalStatus;
  images?: File[] | null;
  warrantyNMonths?: number;
  shipping: ShippingTypes;
  subCategoryId: string;
}

