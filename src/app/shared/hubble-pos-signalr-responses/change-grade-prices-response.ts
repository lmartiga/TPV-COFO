import { ChangeGradePricesStatus } from 'app/shared/hubble-pos-signalr-responses/change-grade-prices-status.enum'

export interface ChangeGradePricesResponse {
  status: ChangeGradePricesStatus;
  message: string;
}
