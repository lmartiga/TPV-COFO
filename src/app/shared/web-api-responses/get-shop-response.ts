import { Shop } from 'app/shared/shop';
import {
  GetShopResponseStatuses
} from 'app/shared/web-api-responses/get-shop-response-statuses.enum';

export interface GetShopResponse {
  status: GetShopResponseStatuses;
  message: string;

  shop: Shop;
}
