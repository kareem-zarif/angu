// Updated interfaces to match your backend DTOs
export interface IAddress {
  id?: string; // Guid from AddressResDto
  personId?: string; // Guid from AddressResDto
  street?: string; // nullable
  city: string; // required
  state: string; // required
  postalCode?: string; // nullable
  country?: string; // nullable with default "Egypt"
  createdAt?: Date; // if your AddressResDto includes timestamps
  updatedAt?: Date; // if your AddressResDto includes timestamps
  IsDefault?: boolean
}

// Interface for creating addresses (matches AddressCreateDto)
export interface IAddressCreate {
  PersonId: string; // Guid - required (PersonId in backend)
  Street?: string; // nullable (Street in backend)
  City: string; // required (City in backend)
  State: string; // required (State in backend)
  PostalCode?: string; // nullable (PostalCode in backend)
  Country?: string; // nullable with default "Egypt" (Country in backend)
  IsDefault?: boolean
}

// Interface for updating addresses (matches AddressUpdateDto)
export interface IAddressUpdate {
  id: string; // Guid - required (Id in backend)
  personId: string; // Guid - required (PersonId in backend)
  street?: string; // nullable (Street in backend)
  city: string; // required (City in backend)
  state: string; // required (State in backend)
  postalCode?: string; // nullable (PostalCode in backend)
  country?: string; // nullable with default "Egypt" (Country in backend)
  IsDefault?: boolean
}
