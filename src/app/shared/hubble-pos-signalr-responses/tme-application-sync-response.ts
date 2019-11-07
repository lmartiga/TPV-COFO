import { TMEApplicationSyncResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-application-sync-response-statuses.enum';

export interface TMEApplicationSyncResponse {
  status: TMEApplicationSyncResponseStatuses;
  message: string;
}
