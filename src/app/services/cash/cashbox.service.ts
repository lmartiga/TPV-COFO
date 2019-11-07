import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { LogHelper } from 'app/helpers/log-helper';

import { CashboxRecordData } from 'app/shared/cashbox/cashbox-record-data';
import { CashboxRecordReason } from 'app/shared/cashbox/cashbox-record-reason';
import { CashboxRecordType } from 'app/shared/cashbox/cashbox-record-type.enum';
import { FormatHelper } from 'app/helpers/format-helper';
import { Operator } from 'app/shared/operator/operator';
import { PaymentMethod } from 'app/shared/payments/payment-method';
import { PaymentMethodType } from 'app/shared/payments/payment-method-type.enum';

import { createCashboxRecordResponse } from 'app/shared/web-api-responses/create-cashbox-record-response';
import { createCashboxRecordResponseStatuses } from 'app/shared/web-api-responses/create-cashbox-record-response-statuses.enum';
import { GetCashboxRecordReasonsResponse } from 'app/shared/web-api-responses/get-cashbox-record-reasons-response';
import {
  GetCashboxRecordReasonsResponseStatuses
} from 'app/shared/web-api-responses/get-cashbox-record-reasons-response-statuses.enum';

import { AppDataConfiguration } from 'app/config/app-data.config';
import { HttpService } from 'app/services/http/http.service';

@Injectable()
export class CashboxService {

  private _cashboxRecordReasonsRequested: Subject<CashboxRecordReason[]> = new Subject();

  private _cashboxRecordSent: Subject<boolean> = new Subject();

  constructor(
    private _http: HttpService,
    private _config: AppDataConfiguration,
    private _logHelper: LogHelper,
  ) {
  }

  // Se solicitan los tipos de apunte disponibles al servicio
  getAvailableCashRecordReasonsByCashboxRecordType(filter: CashboxRecordType): Observable<CashboxRecordReason[]> {
    const request = { identity: this._config.userConfiguration.Identity };
    this._http.postJsonObservable(`${this._config.apiUrl}/GetCashboxRecordReasons`, request)
      .first()
      .subscribe(
      (response: GetCashboxRecordReasonsResponse) => {
        if (response.status == GetCashboxRecordReasonsResponseStatuses.successful) {
          this._logHelper.trace(JSON.stringify(response.availableCashboxRecordReasons));
          const filteredResponse: CashboxRecordReason[] = response.availableCashboxRecordReasons.filter((item) => {
            return item.compatiblePurposes.includes(filter);
          });
          this._cashboxRecordReasonsRequested.next(filteredResponse);
        } else {
          this._logHelper.trace(
            `La respuesta ha sido negativa: ${GetCashboxRecordReasonsResponseStatuses[response.status]}. Mensaje: ${response.message}`);
          this._cashboxRecordReasonsRequested.next(undefined);
        }
      },
      error => {
        this._logHelper.trace(
          `Se produjo un error al solicitar la ejecución del servicio GetCashRecordTypes: ${error}`);
        this._cashboxRecordReasonsRequested.next(undefined);
      });
    return this._cashboxRecordReasonsRequested.asObservable();
  }

  // Se envia la entrada de caja al servicio
  createCashboxRecord(
    operator: Operator,
    recordType: CashboxRecordType,
    recordData: CashboxRecordData,
    currentDateTime: Date,
  ): Observable<boolean> {
    this._logHelper.trace(`La hora local es la siguiente: ${currentDateTime.toISOString()}`);
    const currentPosId: string = this._config.userConfiguration.Identity;
    const currentPaymentMethod: PaymentMethod = this._config.getPaymentMethodByType(PaymentMethodType.cash);
    const cashEntryJson: any = FormatHelper.formatTocreateCashboxRecordServiceExpectedObject(
      currentPosId, operator, recordType, recordData.amount, recordData.currency,
      currentPaymentMethod, recordData.cashboxRecordReason, recordData.observations, currentDateTime
    );
    this._logHelper.trace(`Se invocará CreateCashboxRecord con el siguiente json: ${JSON.stringify(cashEntryJson)}`);
    const request = { identity: currentPosId, cashboxRecordInfo: cashEntryJson };

    this._http.postJsonObservable(`${this._config.apiUrl}/CreateCashboxRecord`, request)
      .first()
      .subscribe(
      (response: createCashboxRecordResponse) => {
        if (response.status == createCashboxRecordResponseStatuses.successful) {
          this._cashboxRecordSent.next(true);
        } else {
          this._logHelper.trace(
            `La respuesta ha sido negativa: ${createCashboxRecordResponseStatuses[response.status]}. Mensaje: ${response.message}`);
          this._cashboxRecordSent.next(false);
        }
      },
      error => {
        this._logHelper.trace(`Se produjo un error al solicitar la ejecución del servicio CashEntry: ${error}`);
        this._cashboxRecordSent.next(false);
      });
    return this._cashboxRecordSent.asObservable();
  }
}
