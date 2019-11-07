import { PaymentDetail } from 'app/shared/payments/payment-detail';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';

export class DocumentList {
    id: string;
    totalAmountWithTax: number;
    pendingAmountWithTax: number;
    paymentDetailList?: PaymentDetail[] = [];
    supplyTransactionList?: SuplyTransaction[] = [];
  }
