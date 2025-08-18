import { IOrder } from "./i-order";

export interface IPaymentMethod {
  id: string;
  isDefault: boolean;

  // Visa info
  cardNumber?: string;
  cardHolderName?: string;
  expireDate?: string;
  cvv?: string;

  // VodafoneCash, OrangeCash
  phoneNumber?: string;

  // Fawry
  fawryCode?: string;

  customerId: string;

  // Orders array - إذا كنت تحتاجه من الـ API
  orders?: IOrder[];

  // Read-only
  paymentType: PaymentMethodType;
  paymentDetails?: string;
}


export enum PaymentMethodType {
  Stripe = 1,
  Instapay = 2,
  VisaCard = 3,
  VodafoneCash = 4,
  OrangeCash = 5,
  Fawry = 6,
  Cash = 7
}

