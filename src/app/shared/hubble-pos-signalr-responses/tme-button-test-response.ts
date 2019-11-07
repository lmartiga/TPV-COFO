import { TMEButtonTestResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-button-test-response-statuses.enum';

export interface TMEButtonTestResponse {
  status: TMEButtonTestResponseStatuses;
  message: string;
}
