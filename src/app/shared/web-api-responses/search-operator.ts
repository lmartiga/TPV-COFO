import { OperatorPermissions } from 'app/shared/operator/operator-permissions.enum';

export class SearchOperator {
  id: string;
  name: string;
  tin: string;
  login: string;
  code: string;
  isDischarged: boolean;
  permissions: OperatorPermissions[];
}
