import { OperatorPermissions } from './operator-permissions.enum';

export interface Operator {
  id: string;
  name: string;
  tin: string;
  login: string;
  code: string;
  isDischarged: boolean;
  permissions: OperatorPermissions[];
}
