import { OPOSClearLineDisplayResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/opos-clearlinedisplay-response-statuses.enum';

export interface OPOSClearLineDisplayResponse {
  status: OPOSClearLineDisplayResponseStatuses;
  message: string;
}
