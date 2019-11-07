import { OPOSWriteDisplayResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/opos-writedisplay-response-statuses.enum';

export interface OPOSWriteDisplayResponse {
  status: OPOSWriteDisplayResponseStatuses;
  message: string;
}
