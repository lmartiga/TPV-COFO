import { CashboxRecordType } from 'app/shared/cashbox/cashbox-record-type.enum';

export interface CashboxRecordReason {
    id: string;
    caption: string;
    compatiblePurposes: CashboxRecordType[];
}
