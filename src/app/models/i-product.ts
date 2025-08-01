export enum ProductApprovalStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected'
}

export enum ShippingTypes {
  Free = 'Free',
  FreeINSameGovernate = 'FreeINSameGovernate',
  Paid = 'Paid',
  None = 'None'
}

export interface IProduct {
  id: string;
  rating?: number | null;
  supplierNames?: string[] | null;
  productPicsPathes: string[];
  name: string;
  description: string;
  pricePerPiece: number;
  pricePer50Piece?: number | null;
  pricePer100Piece?: number | null;
  noINStock: number;
  minNumToFactoryOrder: number;
  approvalStatus: ProductApprovalStatus;
  warrantyNMonths?: number | null;
  shipping: ShippingTypes;
  subCategoryId: string;
  suppliers: string[];
}
