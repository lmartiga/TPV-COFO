import { AuthorizationEntityType } from './authorization-entity-type.enum';
import { AuthorizationPermissionType } from './authorization-permission-type.enum';

export interface AuthorizationContext {
  entityType: AuthorizationEntityType;
  permissionType: AuthorizationPermissionType;
}
