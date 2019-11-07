import {
  SendCommandToPrinterResponseStatuses
} from 'app/shared/signalr-server-responses/printingModuleHub/send-command-to-printer-response-statuses.enum';

export interface SendCommandToPrinterResponse {
  status: SendCommandToPrinterResponseStatuses;
  message: string;
}
