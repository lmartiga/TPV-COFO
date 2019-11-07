
import { ClosureOfflineResponseStatuses } from './closure-offline-response-statuses.enum';
import { CashboxClosureSummaryOffline } from '../shared-cierre-diferido/cashbox-closure-offline-summary';

export interface ClosureOfflineResponse {
  status: ClosureOfflineResponseStatuses;
  message: string;

  cashboxClosureOff: CashboxClosureSummaryOffline;
}
