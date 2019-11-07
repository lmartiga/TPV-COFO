import {
  CloseCashboxResponseStatuses
} from 'app/shared/web-api-responses/close-cashbox-response-statuses.enum';

import {
  CashboxClosureSummary
} from 'app/shared/cashbox/cashbox-closure-summary';

export interface CloseCashboxResponse {
  status: CloseCashboxResponseStatuses;
  message: string;

  cashboxClosure: CashboxClosureSummary;
}
