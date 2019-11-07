import { OPOSOpenCashDrawerResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/opos-opencashdrawer-response-statuses.enum';

export interface OPOSOpenCashDrawerResponse {
  status: OPOSOpenCashDrawerResponseStatuses;
  message: string;
}
