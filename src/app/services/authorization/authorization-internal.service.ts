import { Injectable, ComponentRef } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { AuthorizationPermissionType } from 'app/shared/authorization/authorization-permission-type.enum';
import { Operator } from 'app/shared/operator/operator';
import { SlideOverService } from 'app/services/slide-over/slide-over.service';
import { AuthorizationComponent } from 'app/components/authorization/authorization.component';
import { AuthorizationEntityType } from 'app/shared/authorization/authorization-entity-type.enum';
import { AuthorizationService } from 'app/services/authorization/authorization.service';

@Injectable()
export class AuthorizationInternalService {

  constructor(
    private _slider: SlideOverService,
    private _auth: AuthorizationService
  ) {
  }

  /**
   * Autoriza al operador pasado como parámetro para el el permiso indicado
   *
   * @param {Operator} operator Operador a autorizar
   * @param {AuthorizationPermissionType} permissionType tipo de permiso para el que tenemos que autorizar al operador
   * @returns {Observable<boolean>}
   * @memberof AuthorizationInternalService
   */
  validateOperatorPermission(operator: Operator, permissionType: AuthorizationPermissionType): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {

      const authorized: boolean = this._auth.validatePermissions(permissionType, operator.permissions);

      if (authorized === true) { // Si el operador está autorizado para el permiso indicado devolvemos true
        observer.next(true);
      } else { // Si el operador no está autorizado para el permiso indicado
        const componentRef: ComponentRef<AuthorizationComponent> = this._slider.openFromComponent(AuthorizationComponent);
        componentRef.instance.authorizationContext = {
          entityType: AuthorizationEntityType.operator,
          permissionType: permissionType
        };

        componentRef.instance.onFinish().subscribe(
          (response: boolean) => {
            if (response === true) {
              observer.next(true);
            } else {
              observer.next(false);
            }
          },
          err => observer.error(err),
          () => observer.complete());
        }
    });
  }
}
