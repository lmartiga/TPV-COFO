import {
  SearchOperatorResponseStatuses
} from 'app/shared/web-api-responses/search-operator-response-statuses.enum';
import { SearchOperator } from 'app/shared/web-api-responses/search-operator';

export interface SearchOperatorResponse {
  status: SearchOperatorResponseStatuses;
  message: string;

  operatorList: SearchOperator[];
}
