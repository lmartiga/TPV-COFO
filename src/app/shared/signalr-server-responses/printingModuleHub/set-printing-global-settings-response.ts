import {
  SetPrintingGlobalSettingsResponseStatuses
} from 'app/shared/signalr-server-responses/printingModuleHub/set-printing-global-settings-response-statuses.enum';

export interface SetPrintingGlobalSettingsResponse {
  status: SetPrintingGlobalSettingsResponseStatuses;
  message: string;
}
