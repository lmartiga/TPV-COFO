import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { HttpService } from 'app/services/http/http.service';
import { FormatHelper } from 'app/helpers/format-helper';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { SearchOperatorCriteriaFieldType } from 'app/shared/operator/search-operator-criteria-field-type.enum';
import { AuthorizationContext } from 'app/shared/authorization/authorization-context';
import { AuthorizationEntityType } from 'app/shared/authorization/authorization-entity-type.enum';
import { AuthorizationPermissionType } from 'app/shared/authorization/authorization-permission-type.enum';
import { SearchOperatorResponse } from 'app/shared/web-api-responses/search-operator-response';
import { SearchOperatorResponseStatuses } from 'app/shared/web-api-responses/search-operator-response-statuses.enum';
import { SearchOperator } from 'app/shared/web-api-responses/search-operator';
import { OperatorPermissions } from 'app/shared/operator/operator-permissions.enum';
import { LogHelper } from 'app/helpers/log-helper';


@Injectable()
export class AuthorizationService {

  constructor(
    private _http: HttpService,
    private _appData: AppDataConfiguration,
    private _logHelper: LogHelper
  ) {
  }

  /**
   * Solicita autorización para el contexto indicado a la entidad pasada como parámetro.
   * En el caso del operador, en la entidad vendrá el tin o el código de operador.
   *
   * @param {AuthorizationContext} authContext Contexto de la autorización
   * @returns {Observable<boolean>}
   * @memberof AuthorizationService
   */
  authorize(authContext: AuthorizationContext, entityToAuthorize: string): Observable<boolean> {
    if (authContext != undefined) {
      if (authContext.entityType === AuthorizationEntityType.operator) {
        return this._requestOperatorAuthorization(authContext.permissionType, entityToAuthorize);
      } else { // Tipo de entidad no soportado
        return Observable.create((observer: Subscriber<boolean>) => observer.next(false));
      }
    } else { // Error en la llamada
      this._logHelper.logError('AuthorizationService-> Error en la llamada al método authorize, el contexto no puede ser undefined. Se devuelve falso.');
      return Observable.create((observer: Subscriber<boolean>) => observer.next(false));
    }
  }

  /**
   *
   *
   * @param {AuthorizationPermissionType} authType
   * @param {OperatorPermissions[]} permissionsToCheck
   * @returns {boolean}
   * @memberof AuthorizationService
   */
  validatePermissions(authType: AuthorizationPermissionType, permissionsToCheck: OperatorPermissions[]): boolean {
    let permissionFound: OperatorPermissions;

    if (authType === AuthorizationPermissionType.allowDocumentCancellation) {
      permissionFound = permissionsToCheck.find(i => i === OperatorPermissions.allowDocumentCancellation);
    } else if (authType === AuthorizationPermissionType.allowDocumentDiscount) {
      permissionFound = permissionsToCheck.find(i => i === OperatorPermissions.allowDocumentDiscount);
    } else if (authType === AuthorizationPermissionType.allowFuellingPointTest) {
      permissionFound = permissionsToCheck.find(i => i === OperatorPermissions.allowFuellingPointTest);
    } else if (authType === AuthorizationPermissionType.allowLineDiscount) {
      permissionFound = permissionsToCheck.find(i => i === OperatorPermissions.allowLineDiscount);
    } else if (authType === AuthorizationPermissionType.allowPriceChange) {
      permissionFound = permissionsToCheck.find(i => i === OperatorPermissions.allowPriceChange);
    } else if (authType === AuthorizationPermissionType.allowForecourtPriceChange) {
      permissionFound = permissionsToCheck.find(i => i === OperatorPermissions.allowForecourtPriceChange);
    }

    if (permissionFound != undefined) {
      return true;
    } else {
      return false;
    }
  }

  /**
   *
   *
   * @private
   * @param {AuthorizationPermissionType} authType Tipo de autorización
   * @returns {Observable<boolean>}
   * @memberof AuthorizationService
   */
  private _requestOperatorAuthorization(authType: AuthorizationPermissionType, entityToAuthorize: string): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      // TODO: Por parámetros de configuración tienen que venir los campos por los que hay que buscar el operador
      const fieldsToSearchIn = [
        SearchOperatorCriteriaFieldType.code,
        SearchOperatorCriteriaFieldType.tin
      ];

      const request = FormatHelper.formatSearchOperatorToServiceExpectedObject(entityToAuthorize, fieldsToSearchIn);
      request.identity = this._appData.userConfiguration.Identity;

      this._http.postJsonObservable(`${this._appData.apiUrl}/SearchOperator`, request)
        .first()
        .subscribe(
          (response: SearchOperatorResponse) => {
            if (response.status == SearchOperatorResponseStatuses.successful) {
              // sabemos que si viene operador solamente viene uno
              const operator: SearchOperator = response.operatorList[0];
              if (operator != undefined) {
                const operatorHasPermission: boolean = this.validatePermissions(authType, operator.permissions);
                if (operatorHasPermission) {
                  observer.next(true);
                } else {
                  observer.next(false);
                }
              } else {
                this._logHelper.logError('Error obteniendo el operador solicitado. El operador recibido es undefined');
                observer.next(false);
              }
            } else {
              this._logHelper.logError('Error obteniendo el operador solicitado->');
              this._logHelper.logError(response.message);
              observer.next(false);
            }
          },
          err => {
            this._logHelper.logError('Error obteniendo el operador solicitado->');
            this._logHelper.logError(err);
            observer.next(false);
          },
          () => observer.complete());
    });
  }
}
