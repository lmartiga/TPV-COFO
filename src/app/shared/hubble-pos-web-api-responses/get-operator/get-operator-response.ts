import { GetOperatorResponseStatuses } from './get-operator-response-statuses.enum';
import { Operator } from 'app/shared/operator/operator';

export interface GetOperatorResponse {
  status: GetOperatorResponseStatuses;
  message: string;

  operator: Operator;
}
