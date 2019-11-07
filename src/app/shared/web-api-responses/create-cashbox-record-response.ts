import {
  createCashboxRecordResponseStatuses
} from 'app/shared/web-api-responses/create-cashbox-record-response-statuses.enum';

export interface createCashboxRecordResponse {
  status: createCashboxRecordResponseStatuses;
  message: string;
}
