import { Injectable, OnDestroy } from '@angular/core';
import { FuellingPointModeOperationChangedArgs } from 'app/shared/signalr-server-responses/multiTpvHub/fuelling-point-mode-operation-changed-args';
import { FuellingPointModeOperationResponse } from 'app/shared/signalr-server-responses/multiTpvHub/fuelling-point-mode-operation-response';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { ServiceModeType } from 'app/shared/fuelling-point/service-mode-type.enum';
import { FuellingPointsInternalService } from 'app/services/fuelling-points/fuelling-points-internal.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { ISignalRMultiTPVConnectionManager } from 'app/shared/isignalr-multitpv-conection-manager';
import { OperatorChangedArgs } from 'app/shared/signalr-server-responses/multiTpvHub/operator-changed-args';
import { OperatorService } from 'app/services/operator/operator.service';
import { OperatorTpvInitialResponse } from 'app/shared/signalr-server-responses/multiTpvHub/operator-tpv-initial-response';
// tslint:disable-next-line: max-line-length
import { FuellingPointOperationModeInitialResponse } from 'app/shared/signalr-server-responses/multiTpvHub/fuelling-point-operation-mode-initial-response';
import { NotifyGenericChangesArgs } from 'app/shared/signalr-server-responses/multiTpvHub/notify-generic-changes-args';
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { ConnectionStatus } from 'app/shared/connection-status.enum';
import { Subject } from 'rxjs/Subject';
import { UpdateDocumentVirtualResponse } from 'app/shared/signalr-server-responses/multiTpvHub/update-document-virtual-response';
import { DocumentVirtualInitialResponse } from 'app/shared/signalr-server-responses/multiTpvHub/document-virtual-initial-response';
import { DocumentVirtualDoms } from 'app/shared/document/document-virtual-doms';
import { LogHelper } from 'app/helpers/log-helper';

@Injectable()
export class SignalRMultiTPVService implements OnDestroy {
    private _hubProxy: SignalR.Hub.Proxy;
    private _connectionManager: ISignalRMultiTPVConnectionManager;
    connectionStatus = ConnectionStatus;
    private _multiTPVInsertDocumentVirtual: Subject<string> = new Subject<string>();
    multiTPVInsertDocumentVirtual$ = this._multiTPVInsertDocumentVirtual.asObservable();
    private _multiTPVDeleteDocumentVirtual: Subject<string> = new Subject<string>();
    multiTPVDeleteDocumentVirtual$ = this._multiTPVDeleteDocumentVirtual.asObservable();
    private _multiTPVSetDocumentVirtual: Subject<UpdateDocumentVirtualResponse> = new Subject<UpdateDocumentVirtualResponse>();
    multiTPVSetDocumentVirtual$ = this._multiTPVSetDocumentVirtual.asObservable();
    private _multiTPVMasterReset: Subject<boolean> = new Subject<boolean>();
    multiTPVMasterReset$ = this._multiTPVMasterReset.asObservable();

    constructor(
      private _fpInternalSvc: FuellingPointsInternalService,
      private _appDataConfig: AppDataConfiguration,
      private _operatorSvc: OperatorService,
      private _conf: MinimumNeededConfiguration,
      private _statusBarService: StatusBarService,
      private  _logHelper: LogHelper
    ) {
    }

//#region Conection

init(): SignalRMultiTPVService {
  try {
      this._hubProxy = this._connectionManager.createHubProxy('multiTPVHub');
      this._hubProxy.on('FuellingPointModeOperationChanged',
      (param: FuellingPointModeOperationChangedArgs) => this.onUpdateFuellingPointModeOperationChanged(param));
      this._hubProxy.on('OperatorChanged',
      (param: OperatorChangedArgs) => this.onOperatorChanged(param));
      // this._hubProxy.on('InitialOperatorTpv',
      // (param: Array<OperatorChangedArgs>) => this.onInitialOperatorTpv(param));
      this._hubProxy.on('NotifyGenericChanges',
      (param: NotifyGenericChangesArgs) => this.onManageNotifyGenericChanges(param));
  } catch (error) {
      this._logHelper.trace(error);
  }
  return this;
}

/**
 *
 *
 * @param {ISignalRMultiTPVConnectionManager} connectionManager
 * @returns {ISignalRHub}
 * @memberof SignalRMultiTPVService
 * @throws {Error} when connectionManager is null
 */
setConnectionManager(connectionManager: ISignalRMultiTPVConnectionManager): SignalRMultiTPVService {
  if (connectionManager == undefined) {
    const errorMessage: string = 'ERROR -> connectionManager MultiTPV parameter cannot be null';
    throw new Error(errorMessage);
  }
  this._connectionManager = connectionManager;
  return this;
}

ngOnDestroy(): void {
  this._hubProxy.off('FuellingPointModeOperationChanged', _ => this.onUpdateFuellingPointModeOperationChanged(undefined));
  this._hubProxy.off('OperatorChanged', _ => this.onOperatorChanged(undefined));
  // this._hubProxy.off('InitialOperatorTpv', _ => this.onInitialOperatorTpv(undefined));
  this._hubProxy.off('NotifyGenericChanges', _ => this.onManageNotifyGenericChanges(undefined));
}

//#endregion

//#region Methods

  onUpdateFuellingPointModeOperationChanged(param: FuellingPointModeOperationChangedArgs) {
    this._fpInternalSvc.updateModeOperationSubject(param);
  }

  onOperatorChanged(param: OperatorChangedArgs) {
   this._operatorSvc.fnUpdateOperatorMultiTpv(param);
  }

  fnInitialOperatorTpv(param: Array<OperatorChangedArgs>) {
    this._operatorSvc.fnUpdateAllOperatorMultiTpv(param);
   }

  onManageNotifyGenericChanges(param: NotifyGenericChangesArgs) {
    switch (param.methodInvoke) {
      case 'SuppliesAnulated':
        this._fpInternalSvc.fnSuppliesAnulatedRedSubject(true);
        break;
      case 'resetServerTPVCtrlF5':
        this._statusBarService.setMultiTPVConectionChange(this.connectionStatus.reconnected);
        break;
      case 'changeTransactionVirtual':
        this.changeTransactionVirtual(param.data);
        break;
      case 'MasterReset':
          this.onMasterResetMultiTpv(true);
        break;
      default:
    }
  }

//#endregion

//#region MethodsSignalR

requestChangeServiceModeMultiTPV(targetMode: ServiceModeType, idFuellingPoint: number,
    tpv: string,
    hasPostPaidTransaction: boolean,
    hasPrePaidTransaction: boolean,
    targetModeOld: ServiceModeType,
    hasPostPaidTransactionOld: boolean,
    hasPrePaidTransactionOld: boolean,
    operatorId: string): Observable<FuellingPointModeOperationResponse> {
  const doms =  this._appDataConfig.getConfigurationParameterByName('PSS_IP', 'PSS_CONNECTION').meaningfulStringValue;
  const request = {
        tpv:  tpv,
        fuellingPointId: idFuellingPoint,
        doms: doms,
        isAttend: (ServiceModeType.AttendPaid === targetMode) ? true : false,
        isPreAuthorized: (ServiceModeType.PreAuthorized === targetMode) ? true : false,
        modeType: targetMode,
        hasPostPaidTransaction : hasPostPaidTransaction,
        hasPrePaidTransaction : hasPrePaidTransaction,
        modeTypeOld: targetModeOld,
        hasPostPaidTransactionOld : hasPostPaidTransactionOld,
        hasPrePaidTransactionOld : hasPrePaidTransactionOld,
  };
  const requestObservable: Observable<FuellingPointModeOperationResponse>
  = this._createObservableFromPromise('ChangeFuellingPointOperationModeRemote', request);
  requestObservable.first()
  .subscribe(
    response => {
        if (response === undefined) {
          this.onUpdateFuellingPointModeOperationChanged(request);
        }
    }
  );
  return requestObservable;
}

requestServiceModeInitialMultiTPVHead(): Observable<FuellingPointOperationModeInitialResponse> {
  return this._createObservableFromPromise('FuellingPointOperationModeInitial');
}

requestOperatorInitialMultiTPVHead(): Observable<OperatorTpvInitialResponse> {
  return this._createObservableFromPromise('OperatorTpvInitial');
}

requestOperatorChangedRedTPV(tpv: string, operator: string): Observable<FuellingPointModeOperationResponse> {
  const request = {
        tpv:  tpv,
        operator: operator,
  };
  this._operatorSvc.fnUpdateOperatorMultiTpv(request); // cambio sobre la misma tpv
  const requestObservable: Observable<FuellingPointModeOperationResponse>
  = this._createObservableFromPromise('ChangedOperatorRemote', request);
  return requestObservable;
}

requestNotifyGenericChangesRed(methodInvoke: string, datos: string = ''): Observable<FuellingPointModeOperationResponse> {
  const request = {
        tpv:  this._conf.POSInformation.code,
        methodInvoke: methodInvoke,
        data: datos,
  };
  return  this._createObservableFromPromise('NotifyGenericChangesRed', request);
}

sendFuellingPointOperationModeToServer(
  listFuellingPointMode: Array<FuellingPointModeOperationChangedArgs>): Observable<FuellingPointOperationModeInitialResponse> {
  const request = {
    fpList: listFuellingPointMode
  }
  return this._createObservableFromPromise('FuellingPointOperationModeClientToServer', request);
}

sendDocumentVirtualDomsToServer(
  listDocumentVirtual: Array<DocumentVirtualDoms>): Observable<FuellingPointOperationModeInitialResponse> {
  const request = {
    docVirtualList: listDocumentVirtual
  }
  return this._createObservableFromPromise('DocumentVirtualDomsToServer', request);
}

insertDocumentVirtualMultiTpv(request: string) {
  return this._multiTPVInsertDocumentVirtual.next(request);
}
deleteDocumentVirtualMultiTpv(request: string) {
  return this._multiTPVDeleteDocumentVirtual.next(request);
}
setDocumentVirtualMultiTpv(request: UpdateDocumentVirtualResponse) {
  return this._multiTPVSetDocumentVirtual.next(request);
}
onMasterResetMultiTpv(request: boolean) {
  return this._multiTPVMasterReset.next(request);
}

requestDocumentVirtualInitialMultiTPV(): Observable<DocumentVirtualInitialResponse> {
  return this._createObservableFromPromise('DocumentVirtualInitial');
}

//#endregion

//#region PRIVATE FUNCTIONS SIGNALR

private _createObservableFromPromise<T>(actionName: string, params?: any): Observable<T> {
  return Observable.create((observer: Subscriber<T>) => {
    if (params != undefined) {
      if (this._hubProxy.connection.state === 1) {
      this._hubProxy.invoke(actionName, params).then(
        (response: T) => observer.next(response),
        failResponse => observer.error(failResponse));
      }
      else { observer.next(undefined); }
    } else {
      this._hubProxy.invoke(actionName).then(
        (response: T) => observer.next(response),
        failResponse => observer.error(failResponse));
    }
  });
}

changeTransactionVirtual (request: string) {
  if (request) {
    if (request != '') {
      const data = JSON.parse(request);
      if (data) {
        if (data.type == 'insert') {
          this.insertDocumentVirtualMultiTpv(data);
        } else if (data.type == 'delete') {
          this.deleteDocumentVirtualMultiTpv(data);
        } else if (data.type == 'update') {
          this.setDocumentVirtualMultiTpv(data);
        } else if (data.type == 'masterReset') {
          this.onMasterResetMultiTpv(data);
        }
      }
    }
  }
}
//#endregion
}
