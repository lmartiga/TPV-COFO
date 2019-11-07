
import {
  GetLiteralsResponseStatuses
} from 'app/shared/language/get-literals-response-statuses.enum';

import {
  LiteralConfig
} from 'app/shared/language/literal-config';

export interface GetLiteralsResponse {
  status: GetLiteralsResponseStatuses;
  message: string;
  literalsList: LiteralConfig[];
}
