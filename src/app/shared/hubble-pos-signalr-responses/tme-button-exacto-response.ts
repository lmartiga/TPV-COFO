import { TMEButtonExactoResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-button-exacto-response-statuses.enum';
import { Document } from 'app/shared/document/document';

export interface TMEButtonExactoResponse {
  status: TMEButtonExactoResponseStatuses;
  message: string;
  objDocument: Document;
}
