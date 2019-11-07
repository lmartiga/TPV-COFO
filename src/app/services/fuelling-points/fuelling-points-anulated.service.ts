import { SignalRPSSService } from '../signalr/signalr-pss.service';
import { Injectable } from '@angular/core';
import { Subscriber } from 'rxjs/Subscriber';
import { Observable } from 'rxjs/Observable';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';
import { OperatorInternalService } from '../operator/operator-internal.service';
import { LogHelper } from 'app/helpers/log-helper';
// import { StatusBarService } from '../status-bar/status-bar.service';
import { SuplyTransactionsStatuses } from 'app/shared/hubble-pos-signalr-responses/suply-transactions-statuses.enum';
// import { FormatHelper } from 'app/helpers/format-helper';
import { AppDataConfiguration } from 'app/config/app-data.config';

@Injectable()
export class FuellingPointsAnulatedService {
  constructor(
    private _pssSvc: SignalRPSSService,
    private _operatorInternalSvc: OperatorInternalService,
    // private _statusBarSvc: StatusBarService,
    private _appDataSvc: AppDataConfiguration,
    private _logHelper : LogHelper,
  ) {
  }

  requestAllSuplyTransactionsAnulated(): Observable<SuplyTransaction[]> {
    return Observable.create((observer: Subscriber<SuplyTransaction[]>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.getSuplyTransactionsAnulated(operatorId)
        .first().subscribe(response => {
          if (response.status != SuplyTransactionsStatuses.Successful) {
            this._logError(response.status, response.message);
            observer.error();
            return;
          }
          observer.next(response.supplyTransactionList);
        },
          error => {
            this._logError(undefined, error);
            observer.error();
          });
    });
  }

  GetAllSuppliesAnulatedByShop(): Observable<SuplyTransaction[]> {
    return Observable.create((observer: Subscriber<SuplyTransaction[]>) => {
      const idTienda = this._appDataSvc.shop.id;
      this._pssSvc.GetAllSuppliesAnulatedByShop(idTienda)
        .first().subscribe(response => {
          if (response.status != SuplyTransactionsStatuses.Successful) {
            this._logError(response.status, response.message);
            observer.error();
            return;
          }
          observer.next(response.supplyTransactionList);
        },
          error => {
            this._logError(undefined, error);
            observer.error();
          });
    });
  }

  private _getIdOperator(): string {
    const currentOperator = this._operatorInternalSvc.currentOperator;
    return currentOperator == undefined ? undefined : currentOperator.id;
  }
  private _logError(status: number = -1, text: string) {
    this._logHelper.logError(status, text);
  }

}