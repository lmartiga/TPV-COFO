import { GetGradePricesStatus } from 'app/shared/hubble-pos-signalr-responses/get-grade-prices-status.enum';
import { GradePrice } from 'app/shared/fuelling-point/grade-price';

export interface GetGradePricesResponse {
  status: GetGradePricesStatus;
  message: string;
  gradePrices: Array<GradePrice>;
}
