import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { AppDataConfiguration } from 'app/config/app-data.config';

import { LogHelper } from 'app/helpers/log-helper';

import { HttpService } from 'app/services/http/http.service';

import { Operator } from 'app/shared/operator/operator';

/* import { Subscriber } from 'rxjs/Subscriber'; */
import { PrintResponseStatuses } from 'app/shared/signalr-server-responses/printingModuleHub/print-response-statuses.enum';
import { PrintResponse } from 'app/shared/signalr-server-responses/printingModuleHub/print-response';
// import { SignalRPrintingService } from 'app/services/signalr/signalr-printing.service';
import { FormatHelperCierre } from '../../helpers/format-helper-cierre';
/* import { GetCategoriasResponseStatuses
} from '../../shared/hubble-pos-web-api-responses/get-categorias/get-categorias-response-statuses.enum'; */
/* import { CloseCashboxResponse } from 'app/shared/web-api-responses/close-cashbox-response'; */
import { ClosureOfflineResponse } from '../../shared/web-api-responses/closure-offline-response';
import { ClosureOfflineResponseStatuses } from '../../shared/web-api-responses/closure-offline-response-statuses.enum';
import { CashboxClosure } from '../../shared/shared-cierre-diferido/cashbox-closure';
import { CreateCashboxRecordResponseOffline } from 'app/shared/web-api-responses/create-cashbox-record-offline-response';
import { createCashboxRecordResponseStatuses } from 'app/shared/web-api-responses/create-cashbox-record-response-statuses.enum';
import { CashboxClosureCierre } from '../../shared/shared-cierre-diferido/cashbox-closure-cierre';
import { PrintingService } from 'app/services/printing/printing.service';
/* import { CashboxClosureOfflineSummarySectionLine } from '../../shared/shared-cierre-diferido/cashbox-closure-offline-summary-section-line'; */
/* import { CashboxClosureSummaryOffline } from '../../shared/shared-cierre-diferido/cashbox-closure-offline-summary'; */
/* import { GetClosureOfflineResponse } from '../../shared/web-api-responses/get-closure-offline-response';
import { GetClosureOfflineResponseStatuses } from '../../shared/web-api-responses/get-closure-offline-response-statuses.enum.1'; */
/* import { CashboxClosureDataOffline } from '../../shared/shared-cierre-diferido/cashbox-closure-offline-data'; */
/* import { CategoriasData } from '../models/categorias-data'; */

@Injectable()
export class CashboxClosureServiceOffline {

  private _cashboxClosureSent: Subject<boolean> = new Subject();
  private _cashboxRecordSent: Subject<boolean> = new Subject();

  constructor(
    private _http: HttpService,
    private _appDataConfig: AppDataConfiguration,
    // private _printService: SignalRPrintingService
    private _printService: PrintingService,
    private _logHelper: LogHelper,
  ) {
  }

  // tslint:disable-next-line:member-ordering
static dateToISOString(dateToConvert: Date): string {
  let dateformatted;
  if (dateToConvert) {
    dateformatted = dateToConvert.getFullYear() + '-';
    if (dateToConvert.getMonth() + 1 < 10) {
      dateformatted += '0' + (dateToConvert.getMonth() + 1) + '-';
    } else {
      dateformatted += (dateToConvert.getMonth() + 1) + '-';
    }
    if (dateToConvert.getDate() < 10) {
      dateformatted += '0' + dateToConvert.getDate();
    } else {
      dateformatted += dateToConvert.getDate();
    }
    dateformatted += 'T';
    if (dateToConvert.getHours() == 0) {
      dateformatted += '00:';
    } else if (dateToConvert.getHours() < 10) {
      dateformatted += '0' + dateToConvert.getHours() + ':';
    } else {
      dateformatted += dateToConvert.getHours() + ':';
    }
    if (dateToConvert.getMinutes() == 0) {
      dateformatted += '00' + ':';
    } else if (dateToConvert.getMinutes() < 10) {
      dateformatted += '0' + dateToConvert.getMinutes() + ':';
    } else {
      dateformatted += dateToConvert.getMinutes() + ':';
    }
    if (dateToConvert.getSeconds() == 0) {
      dateformatted += '00';
    } else if (dateToConvert.getSeconds() < 10) {
      dateformatted += '0' + dateToConvert.getSeconds();
    } else {
      dateformatted += dateToConvert.getSeconds();
    }
    dateformatted += 'Z';
  }
  return dateformatted;
}

// Asegura que un objeto de entrada sea interpretado como numérico
// tslint:disable-next-line:member-ordering
static formatNumber(input?: any): number {
  if (input) {
    return Number(input);
  } else {
    return undefined;
  }
}

  llamadaAspxReplica(data: CashboxClosureCierre) /*: Observable<boolean> */ {

    // let id: number;
    let idCaja: string;
    let operador: string;
    let fecha: Date;
    let metalicoReal: number;
    let metalicoCierre: number;
    let online: boolean;
    let subido: boolean;
    let fechaSubida: Date;

    // id = data.id;
    idCaja = data.cierre.idCaja;
    operador = data.cierre.operador;
    fecha = new Date(data.cierre.fecha);
    metalicoReal = CashboxClosureServiceOffline.formatNumber(data.cierre.metalicoReal);
    metalicoCierre = CashboxClosureServiceOffline.formatNumber(data.cierre.metalicoCierre);
    online = Boolean(data.cierre.online);
    subido = Boolean(data.cierre.subido);
    fechaSubida = new Date(data.cierre.fechaSubida);

    const formatofecha = CashboxClosureServiceOffline.dateToISOString(fecha);
    const formatofechaSubida = CashboxClosureServiceOffline.dateToISOString(fechaSubida);

    const cashEntryJson: CashboxClosure = /*FormatHelperCierre.formatTocreateCashboxRecordOnlineServiceExpectedObject */{
      idCaja,
      operador,
      fecha: formatofecha,
      metalicoReal,
      metalicoCierre,
      online,
      subido,
      fechaSubida: formatofechaSubida
    };

    const identity: string = this._appDataConfig.userConfiguration.Identity;

  this._logHelper.trace(`Se invocará CloseCashboxOffline con el siguiente json: ${JSON.stringify(cashEntryJson)}`);
  const request = {
    identity: identity ,
    cashboxClosureInfoOff: cashEntryJson
  };

  this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/CloseCashboxOffline`, request)
    .first()
    .subscribe(
      (response: CreateCashboxRecordResponseOffline) => {
        if (response.status == createCashboxRecordResponseStatuses.successful) {
          this._cashboxRecordSent.next(true);
        } else {
          this._logHelper.trace(
            `La respuesta ha sido negativa: ${createCashboxRecordResponseStatuses[response.status]}. Mensaje: ${response.message}`);
          this._cashboxRecordSent.next(false);
        }
      },
      error => {
        this._logHelper.trace(`Se produjo un error al solicitar la ejecución del servicio CashEntry Offline: ${error}`);
        this._cashboxRecordSent.next(false);
      });
    }

  // Se envia el cierre al servicio
  closeCashboxOffline(operador: Operator, extractedAmount: number, countedAmount: number): Observable<boolean> {
    const currentDateTime: Date = new Date();
    this._logHelper.trace(`La hora local es la siguiente: ${currentDateTime.toISOString()}`);
    const cashboxClosureJson: any = FormatHelperCierre.formatToCashboxClosureInfoServiceExpectedObject(
      operador,
      extractedAmount,
      countedAmount,
      currentDateTime);
    cashboxClosureJson.posId = this._appDataConfig.userConfiguration.Identity;
    const request = { identity: this._appDataConfig.userConfiguration.Identity, cashboxClosureInfoOff: cashboxClosureJson };
    this._logHelper.trace(`Se invocará CloseCashboxOffline con el siguiente json: ${JSON.stringify(cashboxClosureJson)}`);
    this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/CloseCashboxOffline`, request)
      .first()
      .subscribe(
      (response: ClosureOfflineResponse) => {
        if (response.status == ClosureOfflineResponseStatuses.successful) {
          this._logHelper.trace(JSON.stringify(response.cashboxClosureOff));

          // Se invoca la impresión al servicio de impresión signalR de angular
           this._printService.printCashboxOfflineClosure(operador, response.cashboxClosureOff)
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
            `La respuesta ha sido negativa: ${ClosureOfflineResponseStatuses[response.status]}. Mensaje: ${response.message}`);
          this._cashboxClosureSent.next(false);
        }
      },
      error => {
        this._logHelper.trace(`Se produjo un error al solicitar la ejecución del servicio CloseCashbox: ${error}`);
        this._cashboxClosureSent.next(false);
      });
    return this._cashboxClosureSent.asObservable();
  }
}
