import { TMEApplicationInitResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-application-init-response-statuses.enum';

export interface TMEApplicationInitResponse {
  status: TMEApplicationInitResponseStatuses;
  message: string;
}
