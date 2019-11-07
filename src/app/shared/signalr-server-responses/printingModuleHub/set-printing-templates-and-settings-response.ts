import {
  SetPrintingTemplatesAndSettingsResponseStatuses
} from 'app/shared/signalr-server-responses/printingModuleHub/set-printing-templates-and-settings-response-statuses.enum';

export interface SetPrintingTemplatesAndSettingsResponse {
  status: SetPrintingTemplatesAndSettingsResponseStatuses;
  message: string;
}
