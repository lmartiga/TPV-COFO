import {
  PaymentTerminalResponseStatuses
} from 'app/shared/signalr-server-responses/paymentTerminalHub/payment-terminal-response-statuses.enum';

export interface PaymentTerminalResponse {
  status: PaymentTerminalResponseStatuses;
  message: string;
  stringedTerminalResponse: string;
}
