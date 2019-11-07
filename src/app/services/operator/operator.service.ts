import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { HttpService } from 'app/services/http/http.service';
import { FormatHelper } from 'app/helpers/format-helper';
import { Operator } from 'app/shared/operator/operator';
import { SearchOperatorCriteriaFieldType } from 'app/shared/operator/search-operator-criteria-field-type.enum';
import { SearchOperatorResponse } from 'app/shared/web-api-responses/search-operator-response';
import { SearchOperatorResponseStatuses } from 'app/shared/web-api-responses/search-operator-response-statuses.enum';
import { GetOperatorResponse } from 'app/shared/hubble-pos-web-api-responses/get-operator/get-operator-response';
import { GetOperatorResponseStatuses } from 'app/shared/hubble-pos-web-api-responses/get-operator/get-operator-response-statuses.enum';
import { Subject } from 'rxjs/Subject';
import { EstadoOperatorResponse } from 'app/shared/web-api-responses/estado-operator-response';
import { EstadoOperatorResponseStatuses } from 'app/shared/web-api-responses/estado-operator-response-statuses.enum';
import { OperatorChangedArgs } from 'app/shared/signalr-server-responses/multiTpvHub/operator-changed-args';
import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';
import { LogHelper } from 'app/helpers/log-helper';

@Injectable()
export class OperatorService {

  private _operator = new Subject<any>();
  private _operatorAcept = new Subject<any>();
  private arrOperatorMultiTpv: Array<OperatorChangedArgs>;

  _Operador: Subject<Operator> = new Subject<Operator>();
  Operador$ = this._Operador.asObservable();
  constructor(
    private _http: HttpService,
    private _appDataConfig: AppDataConfiguration,
    private _electronicJournal: ElectronicJournalService,
    private  _logHelper: LogHelper
  ) {
  }

  escucharOperador() {
    return this._operator.asObservable();
  }

  seAbrioOperador() {
    return this._operator.next('');
  }

  escucharOperadorAcept() {
    return this._operatorAcept.asObservable();
  }

  seAbrioOperadorAcept() {
    return this._operatorAcept.next('');
  }

  limpiadoOperador(operador: string): Observable<Boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const estadoOperador: any = FormatHelper.formatEstadoOperatorToServiceExpectedObject(
        operador, // El  operador en principio es pasado pero no se utiliza
        this._appDataConfig.userConfiguration.PosId,
        this._appDataConfig.shop);

      const request = { identity: this._appDataConfig.userConfiguration.Identity, estadoOperador };
      this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/LimpiadoOperador`, request)
        .first()
        .subscribe(
          (response: EstadoOperatorResponse) => {
            if (response.status == EstadoOperatorResponseStatuses.successful) {
              observer.next(response.estadoOperador.respuesta);
              this._logHelper.trace(`Obtenemos operador: ${response.message}`);
            } else {
              observer.next(true);
              this._logHelper.trace(`ERROR getting operator: ${response.message}`);
            }
          });
    });
  }


  estadoOperador(operador: string): Observable<Boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const estadoOperador: any = FormatHelper.formatEstadoOperatorToServiceExpectedObject(
        operador,
        this._appDataConfig.userConfiguration.PosId,
        this._appDataConfig.shop);

      const request = { identity: this._appDataConfig.userConfiguration.Identity, estadoOperador };
      this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/EstadoOperador`, request)
        .first()
        .subscribe(
          (response: EstadoOperatorResponse) => {
            if (response.status == EstadoOperatorResponseStatuses.successful) {
              observer.next(response.estadoOperador.respuesta);
              this._logHelper.trace(`Obtenemos operador: ${response.message}`);
            } else {
              observer.next(true);
              this._logHelper.trace(`ERROR getting operator: ${response.message}`);

            }
          });
    });
  }

  searchOperator(textToSearch: string): Observable<Operator> {
    return Observable.create((observer: Subscriber<Operator>) => {
      // TODO: Por parámetros de configuración tienen que venir los campos por los que hay que buscar el operador
      const fieldsToSearchIn = [
        SearchOperatorCriteriaFieldType.code,
        SearchOperatorCriteriaFieldType.tin
      ];

      const request = FormatHelper.formatSearchOperatorToServiceExpectedObject(textToSearch, fieldsToSearchIn);
      request.identity = this._appDataConfig.userConfiguration.Identity;

      this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/SearchOperator`, request)
        .first()
        .subscribe(
          (response: SearchOperatorResponse) => {
            if (response.status == SearchOperatorResponseStatuses.successful) {
              // sabemos que si viene operador solamente viene uno
              const receivedOperator = response.operatorList[0] as Operator;
              if (receivedOperator != undefined) {
                // Electronic Journal - operatorSet
                this._electronicJournal.writeAction({
                  type: ActionType.operatorSet,
                  operatorCode: receivedOperator.code
                });
              } else {
                // Electronic Journal - operatorSetFailed
                this._electronicJournal.writeAction({
                  type: ActionType.operatorSetFailed,
                  genericDetail: textToSearch,
                });
              }
              observer.next(receivedOperator);
            } else {
               // Electronic Journal - operatorSetFailed
            this._electronicJournal.writeAction({
              type: ActionType.operatorSetFailed,
              genericDetail: textToSearch,
              });
              observer.next(undefined);
              this._logHelper.trace(`ERROR getting operator: ${response.message}`);
            }
          },
          error => observer.next(error),
          () => observer.complete());
    });
  }

  getOperator(operatorId: string): Observable<Operator | undefined> {
    return Observable.create((observer: Subscriber<Operator>) => {

      const request = {
        identity: this._appDataConfig.userConfiguration.Identity,
        id: operatorId
      };

      this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/GetOperator`, request)
        .first()
        .subscribe(
          (response: GetOperatorResponse) => {
            if (response.status === GetOperatorResponseStatuses.successful) {
              observer.next(response.operator);
            } else {
              this._logHelper.logError(response.message);
              observer.next(undefined);
            }
          },
          error => observer.error(error),
          () => observer.complete());
    });
  }

  fnOperador(value: Operator) {
    this._Operador.next(value);
  }

  fnUpdateOperatorMultiTpv(value: OperatorChangedArgs) {
    if (this.arrOperatorMultiTpv) {
      const tpvOperator: OperatorChangedArgs = this.arrOperatorMultiTpv.find( x => x.tpv == value.tpv);
      const index = this.arrOperatorMultiTpv.indexOf(tpvOperator);
      if ((tpvOperator) && !(value.operator)) {
        this.arrOperatorMultiTpv.splice(index, 1);
      } else if ((tpvOperator) && (value.operator)) {
         this.arrOperatorMultiTpv[index].operator = value.operator;
      } else {
        if (value.operator) {
          this.arrOperatorMultiTpv.push(value);
        }
      }
    } else {
      this.arrOperatorMultiTpv = new Array<OperatorChangedArgs>();
      if (value.operator) {
        this.arrOperatorMultiTpv.push(value);
      }
    }
  }

  fnExistOperatorMultiTpv(): boolean {
    let existOperator: boolean = false;
    if (this.arrOperatorMultiTpv && this.arrOperatorMultiTpv.length > 0
        && this.arrOperatorMultiTpv.filter( x => x.operator != undefined).length > 0 ) {
      existOperator = true;
    }
    return existOperator;
  }

  fnExistOperatorinTpv(tpv: string): boolean {
    let existOperatorinTpv: boolean = false;
    if (this.arrOperatorMultiTpv && this.arrOperatorMultiTpv.length > 0
        && this.arrOperatorMultiTpv.filter( x => x.tpv === tpv &&  x.operator != undefined ).length > 0 ) {
          existOperatorinTpv = true;
    }
    return existOperatorinTpv;
  }

  fnUpdateAllOperatorMultiTpv(values: Array<OperatorChangedArgs>) {
    if (this.arrOperatorMultiTpv) {
      this.arrOperatorMultiTpv = values;
    } else {
      this.arrOperatorMultiTpv = new Array<OperatorChangedArgs>();
        this.arrOperatorMultiTpv = values;
    }
  }

}
