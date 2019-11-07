import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { LogHelper } from 'app/helpers/log-helper';
import { Alert } from 'app/shared/alerts/alert';
// import { AlertPurposeType } from 'app/shared/alerts/alert-purpose-type.enum';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { AlertsService } from 'app/services/alerts/alerts.service';
import { LanguageService } from 'app/services/language/language.service';
import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';

@Injectable()
export class AlertsInternalService {

  // LITERALES
  acceptLiteral: string;
  constructor(
    private _confirmActionService: ConfirmActionService,
    private _alertService: AlertsService,
    private _languageService: LanguageService,
    private _electronicJournalService:  ElectronicJournalService,
    private _logHelper: LogHelper,
  ) {
    this.acceptLiteral = this._getLiteral('common', 'aceptar');
  }

  showAvailableAlerts(alerts: Alert[]): Observable<boolean> {
    // this._logHelper.trace(JSON.stringify(alerts));
    return Observable.create((observer: Subscriber<boolean>) => {
      if (alerts != undefined && alerts.length > 0 && alerts[0] != undefined) {
        if (alerts[0].timesShownCounter <= alerts[0].timesToBeShown) {
          // Electronic Journal - alertShown
          this._electronicJournalService.writeAction({
            type: ActionType.alertShown,
            idAlert: alerts[0].id.toString(),
            alertType: alerts[0].purpose.toString(),
            timesShown: alerts[0].timesShownCounter.toString(),
          });

          this._confirmActionService.promptActionConfirm(
            alerts[0].message,
            this.acceptLiteral,
            undefined,
            alerts[0].title,
            ConfirmActionType.Information
          )
            .first()
            .subscribe(_ => {
              // Electronic Journal - alertClosed
            this._electronicJournalService.writeAction({
              type: ActionType.alertClosed,
              idAlert: alerts[0].id.toString(),
              alertType: alerts[0].purpose.toString(),
              timesShown: (alerts[0].timesShownCounter + 1).toString(),
            });

              if (alerts.length > 0) {
                alerts[0].timesShownCounter++;
                // Solicitar al servicio de alertar incrementar el contador de muestras para la alerta mostrada
                this._alertService.setAlertAsShown(alerts[0].id);
                alerts.shift();
                this.showAvailableAlerts(alerts)
                  .first().subscribe(resultAvailableAlerts => {
                    observer.next(resultAvailableAlerts);
                  });
                }
            });
        } else {
          this._logHelper.trace('Alerta ignorada al alcanzar máximo de muestras');
          alerts.shift();
          this.showAvailableAlerts(alerts)
            .first().subscribe(resultAvailableAlerts => {
              observer.next(resultAvailableAlerts);
            });
        }
      } else {
        if (alerts != undefined && alerts.length == 0) {
          observer.next(true);
        } else {
          this._logHelper.trace('Objeto no definido');
          observer.next(false);
        }
      }
    });
  }
  
  private _getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
