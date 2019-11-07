import { DynamicActionsConfiguration } from 'app/shared/dynamic-actions/dynamic-actions-configuration';
import {
  GetDynamicActionsConfigurationResponseStatuses
} from 'app/shared/hubble-pos-web-api-responses/dynamic-actions/get-dynamic-actions-configuration-response-statuses.enum';

export interface GetDynamicActionsConfigurationResponse {
  status: GetDynamicActionsConfigurationResponseStatuses;
  message: string;
  dynamicActionsConfigurationDAO: DynamicActionsConfiguration;
}
