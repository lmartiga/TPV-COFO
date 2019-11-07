import {
  POSApplicationSyncResponseStatuses
} from 'app/shared/hubble-pos-signalr-responses/pos-application-sync-response-statuses.enum';

export interface POSApplicationSyncResponse {
  status: POSApplicationSyncResponseStatuses;
  message: string;
  posId: string;
}
