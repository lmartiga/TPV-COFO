import { City } from 'app/shared/address/city';
import { Country } from 'app/shared/address/country';
import { AddressType } from 'app/shared/address/address-type.enum';

export interface Address {
  city?: City;
  country?: Country;
  // countryId?: string;
  street?: string;
  type?: AddressType;
  phoneNumber?: string;
}
