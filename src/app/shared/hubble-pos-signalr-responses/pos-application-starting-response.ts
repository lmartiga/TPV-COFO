import {
  POSApplicationStartingResponseStatuses
} from 'app/shared/hubble-pos-signalr-responses/pos-application-starting-response-statuses.enum';

export interface POSApplicationStartingResponse {
  status: POSApplicationStartingResponseStatuses;
  message: string;
  posId: string;
}
