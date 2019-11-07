import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { LogHelper } from 'app/helpers/log-helper';

import { Alert } from 'app/shared/alerts/alert';
import { AlertPurposeType } from 'app/shared/alerts/alert-purpose-type.enum';

import { GetActiveAlertsResponse } from 'app/shared/web-api-responses/get-active-alerts-response';
import { GetActiveAlertsResponseStatuses } from 'app/shared/web-api-responses/get-active-alerts-response-statuses.enum';
import { SetAlertAsShownResponse } from 'app/shared/web-api-responses/set-alert-as-shown-response';
import { SetAlertAsShownResponseStatuses } from 'app/shared/web-api-responses/set-alert-as-shown-response-statuses.enum';

import { Operator } from 'app/shared/operator/operator';
import { FormatHelper } from 'app/helpers/format-helper';

import { AppDataConfiguration } from 'app/config/app-data.config';
import { HttpService } from 'app/services/http/http.service';

@Injectable()
export class AlertsService {

  private _getactiveAlertsRequested: Subject<Alert[]> = new Subject();

  private _setAlertAsShownSent: Subject<boolean> = new Subject();

  constructor(
    private _http: HttpService,
    private _config: AppDataConfiguration,
    private _logHelper: LogHelper,
  ) {
  }

  // Se solicitan las alertas para un determinado uso
  getActiveAlerts(filter: AlertPurposeType = AlertPurposeType.undefined, operator?: Operator): Observable<Alert[]> {
    const request = { identity: this._config.userConfiguration.Identity,
                      operatorId: (operator == undefined ? '' : operator.id),
                      purpose: filter,
                      currentUTCDateTime: FormatHelper.dateToISOString(FormatHelper.formatToUTCDateFromLocalDate(new Date())),
                      };
      this._http.postJsonObservable(`${this._config.apiUrl}/GetActiveAlerts`, request)
      .first().subscribe((response: GetActiveAlertsResponse) => {
        if (response.status == GetActiveAlertsResponseStatuses.successful) {
          this._logHelper.trace(JSON.stringify(response.alerts));
          const filteredResponse: Alert[] = response.alerts.filter((item) => {
            return item.purpose == filter;
          });
          this._getactiveAlertsRequested.next(filteredResponse);
        } else {
          this._logHelper.trace(
            `La respuesta ha sido negativa: ${GetActiveAlertsResponseStatuses[response.status]}. Mensaje: ${response.message}`);
          this._getactiveAlertsRequested.next(undefined);
        }
      },
      error => {
        this._logHelper.trace(
          `Se produjo un error al solicitar la ejecución del servicio GetActiveAlerts: ${error}`);
        this._getactiveAlertsRequested.next(undefined);
      });
          this._getactiveAlertsRequested.next(undefined);
    return this._getactiveAlertsRequested.asObservable();
  }

  // Se envia la entrada de caja al servicio
  setAlertAsShown(alertId: number): Observable<boolean> {
    const request = { identity: this._config.userConfiguration.Identity, alertId: alertId };
    this._http.postJsonObservable(`${this._config.apiUrl}/SetAlertAsShown`, request)
      .first()
      .subscribe(
      (response: SetAlertAsShownResponse) => {
        if (response.status == SetAlertAsShownResponseStatuses.successful) {
          this._setAlertAsShownSent.next(true);
        } else {
          this._logHelper.trace(
            `La respuesta ha sido negativa: ${SetAlertAsShownResponseStatuses[response.status]}. Mensaje: ${response.message}`);
          this._setAlertAsShownSent.next(false);
        }
      },
      error => {
        this._logHelper.trace(`Se produjo un error al solicitar la ejecución del servicio SetAlertAsShown: ${error}`);
        this._setAlertAsShownSent.next(false);
      });
    return this._setAlertAsShownSent.asObservable();
  }
}
