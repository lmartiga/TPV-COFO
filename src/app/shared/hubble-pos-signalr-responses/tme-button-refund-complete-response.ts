import { Document } from 'app/shared/document/document';
import { TMEButtonRefundCompleteResponseStatuses } from './tme-button-refund-complete-response-statuses.enum';

export interface TMEButtonRefundCompleteResponse {
  status: TMEButtonRefundCompleteResponseStatuses;
  message: string;
  objDocument: Document;
}
