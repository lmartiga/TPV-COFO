import { CardCustomer } from 'app/shared/customer/cardCustomer';
import {
    GetFleetCustomerResponseStatuses
} from 'app/shared/hubble-pos-web-api-responses/get-fleet-customer/get-fleet-customer-response-statuses.enum';

export interface GetFleetCustomerResponse {
    status: GetFleetCustomerResponseStatuses;
    errorMessage: string;
    cardCustomer: CardCustomer;
}
