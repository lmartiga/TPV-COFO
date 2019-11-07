import { OPOSDisplayApplicationInitResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/opos-displayappinit-response-statuses.enum';

export interface OPOSDisplayApplicationInitResponse {
  status: OPOSDisplayApplicationInitResponseStatuses;
  message: string;
}
