import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { LogHelper } from 'app/helpers/log-helper';
import { Operator } from 'app/shared/operator/operator';
import { PaymentMethod } from 'app/shared/payments/payment-method';
import { PaymentMethodType } from 'app/shared/payments/payment-method-type.enum';

import { CreateCashboxRecordResponseOffline } from 'app/shared/web-api-responses/create-cashbox-record-offline-response';
import { createCashboxRecordResponseStatuses } from 'app/shared/web-api-responses/create-cashbox-record-response-statuses.enum';

import {
  GetCashboxRecordReasonsResponseStatuses
} from 'app/shared/web-api-responses/get-cashbox-record-reasons-response-statuses.enum';

import { AppDataConfiguration } from 'app/config/app-data.config';
import { HttpService } from 'app/services/http/http.service';
import { GetCashboxRecordReasonsResponseOffline } from '../../shared/web-api-responses/get-cashbox-record-reasons-offline-response';
import { FormatHelperCierre } from '../../helpers/format-helper-cierre';
import { CashboxRecordReasonOff } from '../../shared/shared-cierre-diferido/cashbox-record-off-Reason';
/* import { CashboxAll } from '../../shared/shared-cierre-diferido/cashbox-all'; */
import { CashboxRecordTypeOffline } from '../../shared/shared-cierre-diferido/cashbox-record-offline-type.enum';
import { CashboxRecordDataOffline } from '../../shared/shared-cierre-diferido/cashbox-record-offline-data';
import { GetCashboxRecordReasonsOfflineResponseStatuses
} from '../../shared/web-api-responses/get-cashbox-record-reasons-offline-response-statuses.enum';
import { CashboxAll } from '../../shared/shared-cierre-diferido/cashbox-all';
import { CashboxOnline } from '../../shared/shared-cierre-diferido/cashbox-online';
import { Currency } from 'app/shared/currency/currency';
/* import { Currency } from 'app/shared/currency/currency'; */
/* import { Currency } from 'app/shared/currency/currency'; */

/* import { CashboxAll } from '../../shared/shared-cierre-diferido/cashbox-all'; */


@Injectable()
export class CashboxOfflineService {

  private _cashboxRecordReasonsRequested: Subject<CashboxRecordReasonOff[]> = new Subject();

  private _cashboxRecordSent: Subject<boolean> = new Subject();
  /* private data: Subject<any> = new Subject(); */


  constructor(
    private _http: HttpService,
    private _config: AppDataConfiguration,
    private _logHelper: LogHelper,
    /* private _cashbox: CashboxAll, */
    /* private _cajaoff: CashboxRecordDataOffline,
    private _operador: Operator, */
  ) {
  }

  // Actualiza el índice del documento actual
  /* set selectedCashboxIndex(index: number) {
    this._selectedCashboxIndex = index;
  } */
  get defaultDateCopy(): Date {
    return new Date();
  }
  // Por ahora usaremos este servicio como almacén principal para quien quiera consultar el documento
  /* get cashbox(): CashboxAll {
    return this._cashbox[this._selectedCashboxIndex];
  } */
  // Se solicitan los tipos de apunte disponibles al servicio
  getAvailableCashRecordReasonsByCashboxRecordType(filter: CashboxRecordTypeOffline): Observable<CashboxRecordReasonOff[]> {
    const request = { identity: this._config.userConfiguration.Identity};
    this._http.postJsonObservable(`${this._config.apiUrl}/GetCashboxRecordReasonsOffline`, request)
      .first()
      .subscribe(
        (response: GetCashboxRecordReasonsResponseOffline) => {
          if (response.status == GetCashboxRecordReasonsOfflineResponseStatuses.successful) {
            this._logHelper.trace(JSON.stringify(response.availableCashboxRecordReasonsOffline));
            const filteredResponse: CashboxRecordReasonOff[] = response.availableCashboxRecordReasonsOffline.filter((item) => {
              return  (item.compatiblePurposes === filter) || (item.compatiblePurposes === 0);
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
 llamadaAspxReplica(data: CashboxAll) /*: Observable<boolean> */ {
    let operadorId: Operator;
    let operadorName: Operator;
    /* let id: number; */
    let idCaja: string;
    /* let nanotacion: number; */
    let tanotacion: CashboxRecordTypeOffline;
    let fecha: Date;
    let importe: number;
    let medio: PaymentMethod;
    let descripcion: string;
    /* let ndocumento: string;
    let tdocumento: string;*/
    let divisa: Currency;
    let contabilizado: boolean;
    let tapunte: CashboxRecordReasonOff;
    /* let ndocumento_pro: string;
    let ntraspaso: string;
    /*let cierre: string;*/
    let porgasto: number;
    /*let nbalance: string; */
    let tienda: string;
    let change_Currency: number;
    /*let totalChange: number;*/
    let fechaNegocio: Date;
    let online: boolean;

    const identity: string = this._config.userConfiguration.Identity;
    /* const cashEntryJson: CashboxAll = JSON.parse(data){ */
    operadorId = data.cashboxRecordInfoOff.operadorId,
    operadorName = data.cashboxRecordInfoOff.operadorName,
    /* id = Number(data.cashboxRecordInfoOff.cashboxRecordInfoOff.id), */
    idCaja = data.cashboxRecordInfoOff.idCaja,
    /* nanotacion = Number(data.cashboxRecordInfoOff.nanotacion), */
    tanotacion = data.cashboxRecordInfoOff.tanotacion,
    fecha = new Date(data.cashboxRecordInfoOff.fecha),
    importe = (data.cashboxRecordInfoOff.importe),
    medio = data.cashboxRecordInfoOff.medio,
    descripcion = data.cashboxRecordInfoOff.descripcion,
    /* ndocumento = data.cashboxRecordInfoOff.ndocumento,
    tdocumento = data.cashboxRecordInfoOff.tdocumento,*/
    divisa = data.cashboxRecordInfoOff.divisa,
    contabilizado = Boolean(data.cashboxRecordInfoOff.contabilizado),
    tapunte = data.cashboxRecordInfoOff.tapunte,
    /* ndocumento_pro = data.cashboxRecordInfoOff.ndocumento_pro,
    ntraspaso = data.cashboxRecordInfoOff.ntraspaso,
    cierre = data.cashboxRecordInfoOff.cierre,*/
    porgasto = data.cashboxRecordInfoOff.porgasto,
    /*nbalance = data.cashboxRecordInfoOff.nbalance, */
    tienda = data.cashboxRecordInfoOff.tienda,
    change_Currency = data.cashboxRecordInfoOff.change_Currency,
    /*totalChange = parseFloat(data.cashboxRecordInfoOff.totalChange),-*/
    fechaNegocio = new Date(data.cashboxRecordInfoOff.fechaNegocio),
    online = Boolean(data.cashboxRecordInfoOff.online);

/*   const medio: PaymentMethod = this._config.getPaymentMethodByType(PaymentMethodType.cash); */
/* const cashEntryJson: CashboxAll = {
  descripcion: data.decripcion
}; */
  const formatofecha = CashboxOfflineService.dateToISOString(fecha);

  const cashEntryJson: CashboxOnline = /*FormatHelperCierre.formatTocreateCashboxRecordOnlineServiceExpectedObject */{
    operadorId,
    operadorName,
    idCaja,
    tanotacion,
    fecha: formatofecha,
    importe: CashboxOfflineService.formatNumber(importe),
    medio,
    descripcion,
    divisa,
    contabilizado,
    tapunte,
    porgasto,
    tienda,
    change_Currency,
    fechaNegocio,
    online,
  };

    /*
    cashEntryJson.operadorId = data.cashboxRecordInfoOff.operadorId.id,
    cashEntryJson.operadorName = data.cashboxRecordInfoOff.operadorName.name,
    // id = Number(data.cashboxRecordInfoOff.cashboxRecordInfoOff.id),
    cashEntryJson.idCaja = data.cashboxRecordInfoOff.idCaja,
    // nanotacion = Number(data.cashboxRecordInfoOff.nanotacion),
    cashEntryJson.tanotacion = data.cashboxRecordInfoOff.tanotacion,
    cashEntryJson.fecha = new Date(data.cashboxRecordInfoOff.fecha),
    cashEntryJson.importe = parseFloat(data.cashboxRecordInfoOff.importe),
    cashEntryJson.medio = data.cashboxRecordInfoOff.medio,
    cashEntryJson.descripcion = data.cashboxRecordInfoOff.descripcion,
    cashEntryJson.ndocumento = data.cashboxRecordInfoOff.ndocumento,
    cashEntryJson.tdocumento = data.cashboxRecordInfoOff.tdocumento,
    cashEntryJson.divisa = data.cashboxRecordInfoOff.divisa.id,
    cashEntryJson.contabilizado = Boolean(data.cashboxRecordInfoOff.contabilizado),
    cashEntryJson.tapunte = data.cashboxRecordInfoOff.tapunte,
    cashEntryJson.ndocumento_pro = data.cashboxRecordInfoOff.ndocumento_pro,
    cashEntryJson.ntraspaso = data.cashboxRecordInfoOff.ntraspaso,
    cashEntryJson.cierre = data.cashboxRecordInfoOff.cierre,
    cashEntryJson.porgasto = parseFloat(data.cashboxRecordInfoOff.porgasto),
    cashEntryJson.nbalance = data.cashboxRecordInfoOff.nbalance,
    cashEntryJson.tienda = data.cashboxRecordInfoOff.tienda,
    cashEntryJson.change_Currency = parseFloat(data.cashboxRecordInfoOff.change_Currency),
    cashEntryJson.totalChange = parseFloat(data.cashboxRecordInfoOff.totalChange),
    cashEntryJson.fechaNegocio = new Date(data.cashboxRecordInfoOff.fechaNegocio),
    cashEntryJson.online = Boolean(data.cashboxRecordInfoOff.online);
    */
    /* cashEntryJson.operadorName = operadorName; */

   this._logHelper.trace(`Se invocará CreateCashboxRecordOffline con el siguiente json: ${JSON.stringify(cashEntryJson)}`);
  const request = {
    identity: identity ,
    cashboxRecordInfoOff: cashEntryJson
  };
  this._http.postJsonObservable(`${this._config.apiUrl}/CreateCashboxRecordOffline`, request)
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
  /* return this._cashboxRecordSent.asObservable(); */
  }

// Se envia la entrada de caja al servicio
/* createCashboxRecordOnline(
  operadorId: Operator,
  tanotacion: CashboxRecordTypeOffline,
  recordData: CashboxRecordDataOffline,
  fecha: Date,
): Observable<boolean> {
  this._logHelper.trace(`La hora local es la siguiente: ${fecha.toISOString()}`);
  const posId: string = this._config.userConfiguration.Identity;
  const medio: PaymentMethod = this._config.getPaymentMethodByType(PaymentMethodType.cash);
  const cashEntryJson: any = FormatHelperCierre.formatTocreateCashboxRecordOfflineServiceExpectedObject(
    posId,
    operadorId,
    tanotacion,
    recordData.importe,
    recordData.divisa,
    medio,
    recordData.cashboxRecordReasonOffline,
    recordData.descripcion,
    fecha,
  );
  this._logHelper.trace(`Se invocará CreateCashboxRecordOffline con el siguiente json: ${JSON.stringify(cashEntryJson)}`);
  const request = {
    identity: posId,
    cashboxRecordInfoOff: cashEntryJson
  };
  this._http.postJsonObservable(`${this._config.apiUrl}/CreateCashboxRecordOffline`, request)
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
  return this._cashboxRecordSent.asObservable();
} */

  // Se envia la entrada de caja al servicio
  createCashboxRecordOffline(
    operadorId: Operator,
    tanotacion: CashboxRecordTypeOffline,
    recordData: CashboxRecordDataOffline,
    fecha: Date,
  ): Observable<boolean> {
    this._logHelper.trace(`La hora local es la siguiente: ${fecha.toISOString()}`);
    const posId: string = this._config.userConfiguration.Identity;
    const medio: PaymentMethod = this._config.getPaymentMethodByType(PaymentMethodType.cash);
    const cashEntryJson: any = FormatHelperCierre.formatTocreateCashboxRecordOfflineServiceExpectedObject(
      posId,
      operadorId,
      tanotacion,
      recordData.importe,
      recordData.divisa,
      medio,
      recordData.cashboxRecordReasonOffline,
      recordData.descripcion,
      fecha,
    );
    this._logHelper.trace(`Se invocará CreateCashboxRecordOffline con el siguiente json: ${JSON.stringify(cashEntryJson)}`);
    const request = {
      identity: posId,
      cashboxRecordInfoOff: cashEntryJson
    };
    this._http.postJsonObservable(`${this._config.apiUrl}/CreateCashboxRecordOffline`, request)
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
    return this._cashboxRecordSent.asObservable();
  }
}
