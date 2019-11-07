import { TMEButtonMixtoResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-button-mixto-response-statuses.enum';
import { Document } from 'app/shared/document/document';
export interface TMEButtonMixtoResponse {
  status: TMEButtonMixtoResponseStatuses;
  message: string;
  objDocument: Document;
}
