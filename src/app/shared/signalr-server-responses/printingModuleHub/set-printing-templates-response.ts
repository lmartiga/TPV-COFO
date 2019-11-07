import {
  SetPrintingTemplatesResponseStatuses
} from 'app/shared/signalr-server-responses/printingModuleHub/set-printing-templates-response-statuses.enum';

export interface SetPrintingTemplatesResponse {
  status: SetPrintingTemplatesResponseStatuses;
  message: string;
}
