
import { CashboxRecordReasonOff } from '../shared-cierre-diferido/cashbox-record-off-Reason';
import { GetCashboxRecordReasonsOfflineResponseStatuses } from './get-cashbox-record-reasons-offline-response-statuses.enum';

export interface GetCashboxRecordReasonsResponseOffline {
  status: GetCashboxRecordReasonsOfflineResponseStatuses;
  message: string;

  availableCashboxRecordReasonsOffline: CashboxRecordReasonOff[];
}
