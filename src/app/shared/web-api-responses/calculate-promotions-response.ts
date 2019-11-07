import {
  CalculatePromotionsResponseStatuses
} from 'app/shared/web-api-responses/calculate-promotions-response-statuses.enum';

import {
  DocumentLinePromotion
} from 'app/shared/document/document-line-promotion';

export interface CalculatePromotionsResponse {
  status: CalculatePromotionsResponseStatuses;
  message: string;

  availablePromotions: Array<DocumentLinePromotion>;
}
