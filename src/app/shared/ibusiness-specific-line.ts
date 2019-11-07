import { BusinessType } from 'app/shared/business-type.enum';
import { ConfirmPaymentRequest } from 'app/shared/confirm-payment-request';
import { Observable } from 'rxjs/Observable';
import { SuplyTransaction } from './fuelling-point/suply-transaction';

export abstract class IbusinessSpecificLine {
    type: BusinessType;
    supplyTransaction?: SuplyTransaction;
    abstract onDeleteLine(): Observable<boolean>;
    abstract onConfirmPay(data: ConfirmPaymentRequest): Observable<boolean>;
}
