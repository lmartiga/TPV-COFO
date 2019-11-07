import { Document } from 'app/shared/document/document';
import { TMEButtonFacturarResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-button-facturar-response-statuses.enum';

export interface TMEButtonFacturarResponse {
  status: TMEButtonFacturarResponseStatuses;
  message: string;
  objDocument: Document;
}
