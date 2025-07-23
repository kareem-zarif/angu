export interface IProduct {
  id: string;
  name: string;
  description: string;
  pricePerPiece: number;
  pricePer50Piece?: number | null;
  pricePer100Piece?: number | null;
  noInStock: number;
  minNumToFactoryOrder: number;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  productPicsPathes: string[];
  warrantyNMonths?: number | null;
  shipping: 'Free' | 'FreeINSameGovernate' | 'Paid' | 'None';
  subCategoryId: string;
  rating?: number | null;
  supplierNames?: string[] | null;
}

