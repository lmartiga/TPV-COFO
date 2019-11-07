import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { AppDataConfiguration } from 'app/config/app-data.config';

import { LogHelper } from 'app/helpers/log-helper';
import { FormatHelper } from 'app/helpers/format-helper';

import { HttpService } from 'app/services/http/http.service';
// import { SignalRPrintingService } from 'app/services/signalr/signalr-printing.service';

import { Operator } from 'app/shared/operator/operator';
import {
  PrepareCashboxClosureResponses
} from 'app/shared/cashbox/prepare-cashbox-closure-responses.enum';

import { PrintResponse } from 'app/shared/signalr-server-responses/printingModuleHub/print-response';
import { PrintResponseStatuses } from 'app/shared/signalr-server-responses/printingModuleHub/print-response-statuses.enum';

import { CloseCashboxResponse } from 'app/shared/web-api-responses/close-cashbox-response';
import { CloseCashboxResponseStatuses } from 'app/shared/web-api-responses/close-cashbox-response-statuses.enum';
import {
  PrepareCashboxClosureResponse
} from 'app/shared/web-api-responses/prepare-cashbox-closure-response';
import {
  PrepareCashboxClosureResponseStatuses
} from 'app/shared/web-api-responses/prepare-cashbox-closure-response-statuses.enum';
import { PrintingService } from '../printing/printing.service';

@Injectable()
export class CashboxClosureService {

  private _cashboxClosureSent: Subject<boolean> = new Subject();
  private _prepareCashboxClosureRequested: Subject<PrepareCashboxClosureResponses> = new Subject();
  private _CierreCajaSubject: Subject<boolean> = new Subject<boolean>();
  CierreCajaSubject$ = this._CierreCajaSubject.asObservable();

  constructor(
    private _http: HttpService,
    private _appDataConfig: AppDataConfiguration,
    // private _printService: SignalRPrintingService
    private _printService: PrintingService,
    private _logHelper: LogHelper,
  ) {
  }

  // Se prepara el cierre:
  // El servicio asegura la sincronía de documentos y nos indica si hay documentos susceptibles de participar en un nuevo cierre de caja
  prepareCashboxClosure(): Observable<PrepareCashboxClosureResponses> {
    const request = { identity: this._appDataConfig.userConfiguration.Identity };
    this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/PrepareCashboxClosure`, request)
      .first()
      .subscribe(
      (response: PrepareCashboxClosureResponse) => {
        if (response.status == PrepareCashboxClosureResponseStatuses.successful) {
          if (response.isAnyDocumentReadyForCashboxClosure) {
            this._prepareCashboxClosureRequested.next(PrepareCashboxClosureResponses.Ready);
          } else {
            this._prepareCashboxClosureRequested.next(PrepareCashboxClosureResponses.NoPendingToCloseDocuments);
          }
        } else if (response.status == PrepareCashboxClosureResponseStatuses.documentsPendingToInsertError) {
          this._prepareCashboxClosureRequested.next(PrepareCashboxClosureResponses.NotReadyDueToPendingToInsertDocuments);
        } else {
          this._logHelper.trace(
            `El servicio respondió con un estado de error: ${response.status.toString()} ; Mensaje: ${response.message}`);
          this._prepareCashboxClosureRequested.next(PrepareCashboxClosureResponses.Fail);
        }
      },
      error => {
        this._logHelper.trace(
          `Se produjo un error al solicitar la ejecución del servicio PrepareCashboxClosure: ${error}`);
        this._prepareCashboxClosureRequested.next(PrepareCashboxClosureResponses.Fail);
      });
    return this._prepareCashboxClosureRequested.asObservable();
  }

  // Se envia el cierre al servicio
  closeCashbox(operator: Operator, countedAmount: number, extractedAmount: number): Observable<boolean> {
    const currentDateTime: Date = new Date();
    this._logHelper.trace(`La hora local es la siguiente: ${currentDateTime.toISOString()}`);
    const cashboxClosureJson: any = FormatHelper.formatToCashboxClosureInfoServiceExpectedObject(
      operator, countedAmount, extractedAmount, currentDateTime);
    cashboxClosureJson.posId = this._appDataConfig.userConfiguration.Identity;
    const request = { identity: this._appDataConfig.userConfiguration.Identity, cashboxClosureInfo: cashboxClosureJson };
    this._logHelper.trace(`Se invocará CloseCashbox con el siguiente json: ${JSON.stringify(cashboxClosureJson)}`);
    this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/CloseCashbox`, request)
      .first()
      .subscribe(
      (response: CloseCashboxResponse) => {
        if (response.status == CloseCashboxResponseStatuses.successful) {
          this._logHelper.trace(JSON.stringify(response.cashboxClosure));

          // Se invoca la impresión al servicio de impresión signalR de angular
          this._printService.printCashboxClosure(operator, response.cashboxClosure)
            .first()
            .subscribe(
            (printResponse: PrintResponse) => {
              if (printResponse.status == PrintResponseStatuses.successful) {
                // Si la respuesta de ambas solicitudes es positiva, reportamos ok al llamante
                this._cashboxClosureSent.next(true);
              } else {
                this._logHelper.trace(
                  `La respuesta ha sido positiva, pero la impresión falló: ` +
                  `${PrintResponseStatuses[printResponse.status]}. Mensaje: ${printResponse.message}`);
                this._cashboxClosureSent.next(false);
              }
            });
        } else {
          this._logHelper.trace(
            `La respuesta ha sido negativa: ${CloseCashboxResponseStatuses[response.status]}. Mensaje: ${response.message}`);
          this._cashboxClosureSent.next(false);
        }
      },
      error => {
        this._logHelper.trace(`Se produjo un error al solicitar la ejecución del servicio CloseCashbox: ${error}`);
        this._cashboxClosureSent.next(false);
      });
    return this._cashboxClosureSent.asObservable();
  }
  fnCierreCajaSubject(value: boolean) {
    this._CierreCajaSubject.next(value);
  }
}
