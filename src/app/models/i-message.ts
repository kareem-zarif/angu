export interface MessageCreateDto {
  body: string;
  customerId?: string;
  supplierId?: string;
  senderType: 'Customer' | 'Supplier';
  Sendto:string;

}

export interface MessageReadDto {
  id: string;
  body: string;
  customerId?: string;
  supplierId?: string;
  customerName: string;
  supplierName: string;
  senderType: string;
  messageDateTime: string;

}