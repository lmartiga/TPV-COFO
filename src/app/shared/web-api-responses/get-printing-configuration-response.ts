import {
  GetPrintingConfigurationResponseStatuses
} from 'app/shared/web-api-responses/get-printing-configuration-response-statuses.enum';
import { IDictionaryStringKey } from 'app/shared/idictionary';
import { PrintingTemplate } from 'app/shared/printing/printing-template';
import { PosCommands } from 'app/shared/printing/pos-commands';

export interface GetPrintingConfigurationResponse {
  status: GetPrintingConfigurationResponseStatuses;
  message: string;
  templates: PrintingTemplate[];
  globalSettings: IDictionaryStringKey<string>;
  posCommands: PosCommands;
}
