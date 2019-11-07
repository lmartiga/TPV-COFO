import { Currency } from 'app/shared/currency/currency';
import {
  GetCurrenciesResponseStatuses
} from 'app/shared/hubble-pos-web-api-responses/get-currencies/get-currencies-response-statuses.enum';

export interface GetCurrenciesResponse {
  status: GetCurrenciesResponseStatuses;
  message: string;

  currencyList: Currency[];
}
