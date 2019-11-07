import { PaymentMethod } from 'app/shared/payments/payment-method';
import {
  GetPaymentMethodsResponseStatuses
} from 'app/shared/hubble-pos-web-api-responses/get-payment-methods/get-payment-methods-response-statuses.enum';

export interface GetPaymentMethodsResponse {
  status: GetPaymentMethodsResponseStatuses;
  message: string;

  paymentMethodList: PaymentMethod[];
  defaultBankCardId: string;
}
