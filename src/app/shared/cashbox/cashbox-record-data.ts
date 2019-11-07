import { CashboxRecordReason } from 'app/shared/cashbox/cashbox-record-Reason';
import { Currency } from 'app/shared/currency/currency';

export interface CashboxRecordData {
    cashboxRecordReason: CashboxRecordReason;
    amount: number;
    currency: Currency;
    observations: string;
}
