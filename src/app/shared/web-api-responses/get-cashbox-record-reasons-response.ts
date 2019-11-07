import { CashboxRecordReason } from 'app/shared/cashbox/cashbox-record-reason';

import {
  GetCashboxRecordReasonsResponseStatuses
} from 'app/shared/web-api-responses/get-cashbox-record-reasons-response-statuses.enum';

export interface GetCashboxRecordReasonsResponse {
  status: GetCashboxRecordReasonsResponseStatuses;
  message: string;

  availableCashboxRecordReasons: CashboxRecordReason[];
}
