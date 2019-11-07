import { TMEButtonTarjetaResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-button-Tarjeta-response-statuses.enum';
import { Document } from 'app/shared/document/document';

export interface TMEButtonTarjetaResponse {
  status: TMEButtonTarjetaResponseStatuses;
  message: string;
  objDocument: Document;
}
