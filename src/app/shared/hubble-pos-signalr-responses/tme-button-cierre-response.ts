import { TMEButtonCierreResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-button-cierre-response-statuses.enum';

export interface TMEButtonCierreResponse {
  status: TMEButtonCierreResponseStatuses;
  message: string;
}
