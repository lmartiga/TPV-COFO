import { Customer } from 'app/shared/customer/customer';

export interface CustomerAddInformationRequest {
    customer: Customer;
    editPlate: boolean;
}
