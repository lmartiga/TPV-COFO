import { PrintResponseStatuses } from 'app/shared/signalr-server-responses/printingModuleHub/print-response-statuses.enum';

export interface PrintResponse {
  status: PrintResponseStatuses;
  message: string;
}
