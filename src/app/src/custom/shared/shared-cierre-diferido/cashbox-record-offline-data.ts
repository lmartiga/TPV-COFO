import { Currency } from 'app/shared/currency/currency';
import { CashboxRecordReasonOff } from './cashbox-record-off-Reason';

export interface CashboxRecordDataOffline {
    tanotacion: string;
    cashboxRecordReasonOffline: CashboxRecordReasonOff;
    importe: number;
    divisa: Currency;
    descripcion: string;
}
