import { Document } from 'app/shared/document/document';
import {
  TMEButtonCanjeCodigoBarrasResponseStatuses
} from 'app/shared/hubble-pos-signalr-responses/tme-button-canje-codigo-barras-response-statuses.enum';

export interface TMEButtonCanjeCodigoBarrasResponse {
  status: TMEButtonCanjeCodigoBarrasResponseStatuses;
  message: string;
  objDocument: Document;
}
