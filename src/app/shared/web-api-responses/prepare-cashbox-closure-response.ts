import {
  PrepareCashboxClosureResponseStatuses
} from 'app/shared/web-api-responses/prepare-cashbox-closure-response-statuses.enum';

export interface PrepareCashboxClosureResponse {
  status: PrepareCashboxClosureResponseStatuses;
  message: string;

  isAnyDocumentReadyForCashboxClosure: boolean;
}
