import { TestConnectivityResponseStatuses } from 'app/shared/web-api-responses/test-connectivity-response-statuses.enum';

export interface TestConnectivityResponse {
  status: TestConnectivityResponseStatuses;
  message: string;
}