import { TMEButtonRefundFuelResponseStatuses } from './tme-button-refund-fuel-response-statuses.enum';
import { Document } from 'app/shared/document/document';

export interface TMEButtonRefundFuelResponse {
  status: TMEButtonRefundFuelResponseStatuses;
  message: string;
  objDocument: Document;
}
