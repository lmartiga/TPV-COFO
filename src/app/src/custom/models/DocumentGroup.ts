import { Customer } from 'app/shared/customer/customer';
import { DocumentList } from './DocumentList';
import { PaymentDetail } from 'app/shared/payments/payment-detail';
import { CarburanteContingencia } from 'app/src/custom/models/CarburanteContingencia';

export class DocumentGroup {
  cliente: Customer;
  documentIdList: DocumentList[] = [];
  totalAmountWithTax: number = 0;
  pendingAmountWithTax: number = 0;
  cambio: number = 0;
  operator?: string;
  paymentDetailList?: PaymentDetail[] = [];
  carburantesContingencia?: CarburanteContingencia[] = [];
}
