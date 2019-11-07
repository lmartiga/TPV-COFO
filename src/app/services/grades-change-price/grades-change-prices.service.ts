import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { OperatorInternalService } from 'app/services/operator/operator-internal.service';
import { SignalRPSSService } from 'app/services/signalr/signalr-pss.service';
import { GradePrice } from 'app/shared/fuelling-point/grade-price';
import { GetGradePricesResponse } from 'app/shared/hubble-pos-signalr-responses/get-grade-prices-response';
import { GetGradePricesStatus } from 'app/shared/hubble-pos-signalr-responses/get-grade-prices-status.enum';
import { AuthorizationInternalService } from 'app/services/authorization/authorization-internal.service';
import { AuthorizationPermissionType } from 'app/shared/authorization/authorization-permission-type.enum';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { LanguageService } from 'app/services/language/language.service';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { ChangeGradePricesResponse } from 'app/shared/hubble-pos-signalr-responses/change-grade-prices-response';
import { ChangeGradePricesStatus } from 'app/shared/hubble-pos-signalr-responses/change-grade-prices-status.enum';

@Injectable()
export class GradesChangePricesService {

  constructor(
    private _signalrPSSService: SignalRPSSService,
    private _operatorInternalSvc: OperatorInternalService,
    private _auth: AuthorizationInternalService,
    private _confirmActionSvc: ConfirmActionService,
    private _languageService: LanguageService,
  ) { }


  getGradePrices(): Observable<Array<GradePrice>> {
    return Observable.create((observer: Subscriber<Array<GradePrice>>) => {
      const operatorId: string = this._getIdOperator();
      this._signalrPSSService.getGradePrices(operatorId).first().subscribe((response: GetGradePricesResponse) => {
        if (response != undefined && response.status == GetGradePricesStatus.successful) {
          if (response.gradePrices != undefined && response.gradePrices.length > 0) {
            observer.next(response.gradePrices);
          }
        }
        observer.next();
      });
    });
  }

  changeGradePrices(newGradePriceList: Array<GradePrice>, observations: string,
    shop: string,isDeferred: boolean , dateDeferred : Date ): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const allowed: Observable<boolean> =
      this._auth.validateOperatorPermission(this._operatorInternalSvc.currentOperator, AuthorizationPermissionType.allowForecourtPriceChange);
      allowed.subscribe(responseAuthorization => {
        if (responseAuthorization === true && this._operatorInternalSvc.currentOperator != undefined && this._operatorInternalSvc.currentOperator.id != undefined) {
          this._signalrPSSService.changeGradePrices(this._operatorInternalSvc.currentOperator.id, newGradePriceList, observations,
            shop,isDeferred,dateDeferred).first()
          .subscribe((response: ChangeGradePricesResponse) => {
            if (response != undefined && response.status == ChangeGradePricesStatus.successful) {
              observer.next(true);
            } else {
              this._confirmActionSvc.promptActionConfirm(
                this._getLiteral('grades_change_prices_service', 'change_error'),
                this._getLiteral('common', 'aceptar'),
                undefined,
                this._getLiteral('common', 'error'),
                ConfirmActionType.Error
              ).first()
              .subscribe(alertResponse => observer.next(false));
            }
          });
        } else {
          this._confirmActionSvc.promptActionConfirm(
            this._languageService.getLiteral('options_components', 'operatorHasNotPermission'),
            this._languageService.getLiteral('common', 'aceptar'),
            undefined,
            this._languageService.getLiteral('common', 'error'),
            ConfirmActionType.Error).first().subscribe(resp => observer.next(false));
        }
      });
    });
  }

  private _getIdOperator(): string {
    const currentOperator = this._operatorInternalSvc.currentOperator;
    return currentOperator == undefined ? undefined : currentOperator.id;
  }

  private _getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

}
