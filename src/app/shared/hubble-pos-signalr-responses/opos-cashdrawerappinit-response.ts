import { OPOSCashDrawerApplicationInitResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/opos-cashdrawerappinit-response-statuses.enum';

export interface OPOSCashDrawerApplicationInitResponse {
  status: OPOSCashDrawerApplicationInitResponseStatuses;
  message: string;
}
