export interface Supplier {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  factoryName: string;
  description?: string;
  state?: string;
  city?: string;
  productSuppliers?: ProductSupplierResDto[];
}

export interface SupplierCreateDto {
  firstName: string;
  lastName: string;
  phone: string;
  factoryName: string;
  description?: string;
}

export interface SupplierResDto {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  factoryName: string;
  description: string;
  state?: string;
  city?: string;
  productSuppliers: ProductSupplierResDto[];
  
}

export interface SupplierUpdateDto {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  factoryName: string;
  description?: string;
}

export interface ProductSupplierResDto {
  id: string;
  productId: string;
  supplierId: string;
  productName?: string;
  description?: string;
  pricePerPiece?: number;
  factoryName?: string;
}
