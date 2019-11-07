import { CashboxRecordTypeOffline } from './cashbox-record-offline-type.enum';

export interface CashboxRecordReasonOff {
    id: number;
    codigo: string;
    caption: string;
    valor: string;
    cuenta: string;
    visibletpv: boolean;
    compatiblePurposes?: CashboxRecordTypeOffline;

}
