import { Injectable, OnDestroy } from '@angular/core';
import { ISignalRConnectionManager } from 'app/shared/isignalr-conection-manager';
import { FuellingPointInfo } from 'app/shared/fuelling-point/fuelling-point-info';
import { ConnectionStateChangedArgs } from 'app/shared/fuelling-point/signalR-Response/connection-state-changed-args';
import {
  FuellingPointTransactionCountChangedArgs
} from 'app/shared/fuelling-point/signalR-Response/fuelling-point-transaction-count-changed-args';
import { FuellingPointsSignalrUpdatesService } from 'app/services/fuelling-points/fuelling-points-signalr-updates.service';
import { GetPSSInitialConfigurationResponse } from 'app/shared/hubble-pos-signalr-responses/get-pss-initial-configuration-response';
import { AvailableActionsResponse } from 'app/shared/hubble-pos-signalr-responses/available-actions-response';
import { GetPSSInitialConfigurationResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/get-pss-initial-configuration-status.enum';
import { SuplyTransactionsResponse } from 'app/shared/hubble-pos-signalr-responses/suply-transactions-response';
import { FuellingLimit } from 'app/shared/fuelling-point/fuelling-limit';
import { PreparePrepaidOperationResponse } from 'app/shared/hubble-pos-signalr-responses/prepare-prepaid-operation-response';
import { PreparePresetOperationResponse } from 'app/shared/hubble-pos-signalr-responses/prepare-preset-operation-response';
import {
  PrepareFuellingPointForPostpaidOperationResponse
} from 'app/shared/hubble-pos-signalr-responses/prepare-fuelling-point-for-postpaid-operation-response';
import { AutorizeFuellingPointResponse } from 'app/shared/hubble-pos-signalr-responses/autorize-fuelling-point-response';
import { CancelLockingFuellingPointResponse } from 'app/shared/hubble-pos-signalr-responses/cancel-locking-fuelling-point-response';
import { EmergencyStopFuellingPointResponse } from 'app/shared/hubble-pos-signalr-responses/emergency-stop-fuelling-point-response';
import { CancelEmergencyStopResponse } from 'app/shared/hubble-pos-signalr-responses/cancel-emergency-stop-response';
import { LockSupplyTransactionResponse } from 'app/shared/hubble-pos-signalr-responses/lock-supply-transaction-response';
import { UnlockSupplyTransactionResponse } from 'app/shared/hubble-pos-signalr-responses/unlock-supply-transaction-response';
import { FinalizeSupplyTransactionResponse } from 'app/shared/hubble-pos-signalr-responses/finalize-supply-transaction-response';
import {
  FinalizeSupplyTransactionPartialPrepaidResponse
} from 'app/shared/hubble-pos-signalr-responses/finalize-supply-transaction-partial-prepaid-response';
import {
  FinalizeSupplyTransactionForFuelTestResponse
} from 'app/shared/hubble-pos-signalr-responses/finalize-supply-transaction-for-fuel-test-response';
import { LogHelper } from 'app/helpers/log-helper';
import { HubbleDocumentLine } from 'app/shared/hubble-document-line';
import { SeriesType } from 'app/shared/series/series-type';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { ChangeServiceModeResponse } from 'app/shared/hubble-pos-signalr-responses/change-service-mode-response';
import { ChangeSalePrepayOtherFuellingPointResponse } from 'app/shared/hubble-pos-signalr-responses/change-sale-prepay-other-fuelling-point-response';
import { ServiceModeType } from 'app/shared/fuelling-point/service-mode-type.enum';
import { PetrolStationMode } from 'app/shared/fuelling-point/petrol-station-mode.enum';
import { ChangePetrolStationModeResponse } from 'app/shared/hubble-pos-signalr-responses/change-petrol-station-mode-response';
import {
  LockPartialSuplyTransactionForRefundingResponse
} from 'app/shared/hubble-pos-signalr-responses/lock-partial-suply-transaction-for-refunding-response';
import {
  SetDefinitiveDocumentIdForSupplyTransactionsResponse
} from 'app/shared/hubble-pos-signalr-responses/set-definitive-document-id-for-supply-transactions-response';
import {
  SetDefinitiveDocumentIdForPrepaidOperationsResponse
} from 'app/shared/hubble-pos-signalr-responses/set-definitive-document-id-for-prepaid-operations-response';
import {
  GetTransactionDataForRefundingPrepaidWithoutFuellingResponse
} from 'app/shared/hubble-pos-signalr-responses/get-transaction-data-for-refunding-prepaid-without-fuelling-response';

import { CancelAuthorizationFuellingPointResponse } from 'app/shared/hubble-pos-signalr-responses/cancel-authorization-fuelling-point-response';
import { GetGradePricesResponse } from 'app/shared/hubble-pos-signalr-responses/get-grade-prices-response';
import { GradePrice } from 'app/shared/fuelling-point/grade-price';
import { ChangeGradePricesResponse } from 'app/shared/hubble-pos-signalr-responses/change-grade-prices-response';
import {
  GetSupplyTransactionOfFuellingPointResponse
} from 'app/shared/hubble-pos-signalr-responses/get-supply-transaction-of-fuelling-point-response';

@Injectable()
export class SignalRPSSService implements OnDestroy {
  private _hubProxy: SignalR.Hub.Proxy;
  private _connectionManager: ISignalRConnectionManager;

  constructor(
    private _fpSignalR: FuellingPointsSignalrUpdatesService,
    private _logHelper : LogHelper,
  ) {
  }

  ngOnDestroy() {
    // Eliminamos las suscripciones
    this._hubProxy.off('ConnectionStateChanged', _ => this._onConnectionStateChanged(undefined));
    this._hubProxy.off('FuellingPointStatusChanged', _ => this._onFuellingPointStatusChanged(undefined));
    this._hubProxy.off('FuellingPointTransactionCountChanged', _ => this._onFuellingPointTransactionCountChanged(undefined));
  }

  /**
   *
   *
   * @param {ISignalRConnectionManager} connectionManager
   * @returns {ISignalRHub}
   * @memberof SignalRPSSService
   * @throws {Error} when connectionManager is null
   */
  setConnectionManager(connectionManager: ISignalRConnectionManager): SignalRPSSService {
    if (connectionManager == undefined) {
      const errorMessage: string = 'ERROR -> connectionManager parameter cannot be null';
      // this._logHelper.trace(errorMessage);
      throw new Error(errorMessage);
    }
    this._connectionManager = connectionManager;
    return this;
  }

  init(): SignalRPSSService {
    this._hubProxy = this._connectionManager.createHubProxy('pssHub');
    this._hubProxy.on('ConnectionStateChanged',
      (param: ConnectionStateChangedArgs) => this._onConnectionStateChanged(param));
    this._hubProxy.on('FuellingPointStatusChanged',
      (param: FuellingPointInfo) => this._onFuellingPointStatusChanged(param));
    this._hubProxy.on('FuellingPointTransactionCountChanged',
      (param: FuellingPointTransactionCountChangedArgs) => this._onFuellingPointTransactionCountChanged(param));
    return this;
  }

  startInitializationProcess(): Observable<GetPSSInitialConfigurationResponse> {
    return this.getPSSInitialConfigurationToStart();
  }

  getPSSInitialConfigurationToStart(): Observable<GetPSSInitialConfigurationResponse> {
    return Observable.create((observer: Subscriber<GetPSSInitialConfigurationResponse>) => {
      this._createObservableFromPromise<GetPSSInitialConfigurationResponse>('GetPSSInitialConfigurationToStart')
        .first().subscribe(
          pssInitialResponse => {
            if (pssInitialResponse.status != GetPSSInitialConfigurationResponseStatuses.successful) {
              this._logHelper.logError(pssInitialResponse.status, pssInitialResponse.message);
            } else {
              const fpList = pssInitialResponse.fuellingPointList;
              fpList.forEach(fp => {
                const transactionCount = pssInitialResponse.fuellingPointIdAndTransactionCountDictionary[fp.id];
                fp.hasTransactions = transactionCount != undefined && transactionCount > 0;
                fp.hasPostPaidTransaction = false;
              });
              this._fpSignalR.updateAllFuellingPointsFromServer(fpList);
              this._fpSignalR.updateGradeConfigurationFromServer(pssInitialResponse.gradeConfigurationList);
              this._fpSignalR.updateForeCourtIdDictionaryFromServer(pssInitialResponse.forecourtControllerIdAndPOSCodeDictionary,
                pssInitialResponse.ownForecourtPOSId);
            }
            observer.next(pssInitialResponse);
          },
          error => {
            this._logHelper.logError(undefined, error);
            observer.next({
              status: GetPSSInitialConfigurationResponseStatuses.genericError,
              message: 'Ocurrio un error en la peticion getPSSInitialConfiguration',
              forecourtControllerIdAndPOSCodeDictionary: undefined,
              fuellingPointIdAndTransactionCountDictionary: undefined,
              fuellingPointList: undefined,
              gradeConfigurationList: undefined,
              ownForecourtPOSId: undefined
            });
          }
        );
    });
  }

  getSuplyTransactions(operatorId: string, fpId?: number): Observable<SuplyTransactionsResponse> {
    const isAllFp = fpId == undefined;
    return isAllFp ?
      this._createObservableFromPromise('GetAllSupplyTransactionsOfAllFuellingPoints', {
        operatorId
      }) :
      this._createObservableFromPromise('GetAllSupplyTransactionsOfFuellingPoint', {
        fuellingPointId: fpId,
        operatorId: operatorId
      });
  }

  getSuplyTransactionsAnulated(operatorId: string, fpId?: number): Observable<SuplyTransactionsResponse> {
    const isAllFp = fpId == undefined;
    return isAllFp ?
      this._createObservableFromPromise('GetAllSupplyTransactionsAnulatedOfAllFuellingPoint', {
        operatorId
      }) :
      this._createObservableFromPromise('GetAllSupplyTransactionsAnulatedOfFuellingPoint', {
        fuellingPointId: fpId,
        operatorId: operatorId
      });
  }

  GetAllSuppliesAnulatedByShop(idTienda: string): Observable<SuplyTransactionsResponse> {
    return this._createObservableFromPromise('GetAllSuppliesAnulatedByShop',
      idTienda
    );
  }

  UpdateSupplyAnulatedEnTicket(listaIdSumiAnul: number[], idTienda: string, enTicket: boolean): Observable<SuplyTransactionsResponse> {
    return this._createObservableFromPromise('UpdateSupplyAnulatedEnTicket', {
      listaIdSumiAnul,
      idTienda,
      enTicket
    });
  }

  getAvailableActions(operatorId: string, fpId: number): Observable<AvailableActionsResponse> {
    return this._createObservableFromPromise('GetAvailableActionsForFuellingPoint', {
      fuellingPointId: fpId,
      operatorId: operatorId
    });
  }

  preparePrepaidOperation(
    customerId: string,
    operatorId: string,
    fuellingPointId: number,
    gradeId: number,
    fuellingLimit: FuellingLimit,
    kilometers?: number,
    contactId?: string,
    vehicleLicensePlate?: string): Observable<PreparePrepaidOperationResponse> {
    return this._createObservableFromPromise('PreparePrepaidOperation', {
      customerId,
      operatorId,
      kilometers,
      fuellingPointId,
      gradeId,
      fuellingLimit,
      contactId,
      vehicleLicensePlate
    });
  }

  preparePresetOperation(
    customerId: string,
    operatorId: string,
    fuellingPointId: number,
    gradeId: number,
    fuellingLimit: FuellingLimit,
    presetValue?: number): Observable<PreparePresetOperationResponse> {
    return this._createObservableFromPromise('PreparePresetOperation', {
      customerId,
      operatorId,
      fuellingPointId,
      gradeId,
      fuellingLimit,
      presetValue
    });
  }

  prepareFuellingPointForPostpaidOperation(
    operatorId: string,
    fuellingPointId: number,
    gradeId?: number): Observable<PrepareFuellingPointForPostpaidOperationResponse> {
    return this._createObservableFromPromise('PrepareFuellingPointForPostpaidOperation', {
      operatorId,
      fuellingPointId,
      gradeId,
    });
  }

  autorizeFuellingPoint(
    operatorId: string,
    fuellingPointId: number,
    customerId: string,
    provisionalId: string,
    seriesType: SeriesType,
    lineDetail: HubbleDocumentLine,
    documentId: string,
    contactId?: string,
    odometerMeasure?: number,
    vehicleLicensePlate?: string): Observable<AutorizeFuellingPointResponse> {
    return this._createObservableFromPromise('AutorizeFuellingPoint', {
      operatorId: operatorId,
      fuellingPointId: fuellingPointId,
      customerId: customerId,
      provisionalId: provisionalId,
      seriesType: seriesType,
      lineDetail: lineDetail,
      possibleDocumentId: documentId,
      odometerMeasurement: odometerMeasure,
      vehicleLicensePlate: vehicleLicensePlate,
      contactId: contactId
    });
  }

  cancelLockingOfFuellingPoint(
    operatorId: string,
    fuellingPointId: number): Observable<CancelLockingFuellingPointResponse> {
    return this._createObservableFromPromise('CancelLockingOfFuellingPoint', {
      operatorId,
      fuellingPointId
    });
  }
  cancelAuthorizationOfFuellingPoint(
    operatorId: string,
    fuellingPointId: number): Observable<CancelAuthorizationFuellingPointResponse> {
    return this._createObservableFromPromise('CancelAuthorizationOfFuellingPoint', {
      operatorId,
      fuellingPointId
    });
  }

  emergencyStop(operatorId: string, fuellingPointId?: number): Observable<EmergencyStopFuellingPointResponse> {
    const isAllFp = fuellingPointId == undefined;
    return isAllFp ?
      this._createObservableFromPromise('EmergencyStopAllFuellingPoints', {
        operatorId
      })
      :
      this._createObservableFromPromise('EmergencyStopFuellingPoint', {
        operatorId,
        fuellingPointId
      });
  }

  cancelEmergencyStop(operatorId: string, fuellingPointId?: number): Observable<CancelEmergencyStopResponse> {
    const isAllFp = fuellingPointId == undefined;
    return isAllFp ? this._createObservableFromPromise('CancelEmergencyStopAllFuellingPoints', {
      operatorId
    }) :
      this._createObservableFromPromise('CancelEmergencyStopOfFuellingPoint', {
        operatorId,
        fuellingPointId
      });
  }

  lockSupplyTransaction(
    operatorId: string,
    customerId: string,
    supplyTransactionId: number,
    fuellingPointId: number): Observable<LockSupplyTransactionResponse> {
    return this._createObservableFromPromise('LockSupplyTransactionOfFuellingPoint', {
      operatorId,
      customerId,
      fuellingPointId,
      supplyTransactionId
    });
  }

  lockPartialSupplyTransactionForRefunding(
    operatorId: string,
    supplyTransactionId: number,
    fuellingPointId: number): Observable<LockPartialSuplyTransactionForRefundingResponse> {
    return this._createObservableFromPromise('LockSupplyTransactionOfFuellingPointForRefundingPartialPrepaid', {
      operatorId,
      supplyTransactionId,
      fuellingPointId
    });
  }
  unlockSupplyTransaction(
    operatorId: string,
    supplyTransactionId: number,
    fuellingPointId: number): Observable<UnlockSupplyTransactionResponse> {
    return this._createObservableFromPromise('UnlockSupplyTransactionOfFuellingPoint', {
      operatorId,
      fuellingPointId,
      supplyTransactionId
    });
  }

  finalizeSupplyTransaction(
    operatorId: string,
    supplyTransactionId: number,
    fuellingPointId: number,
    customerId: string,
    provisionalId: string,
    possibleDocumentId: string,
    lineNumberInDocument: number,
    contactId?: string,
    vehicleLicensePlate?: string,
    odometerMeasurement?: number): Observable<FinalizeSupplyTransactionResponse> {
    return this._createObservableFromPromise('FinalizeSupplyTransaction', {
      operatorId: operatorId,
      fuellingPointId: fuellingPointId,
      supplyTransactionId: supplyTransactionId,
      customerId: customerId,
      provisionalId: provisionalId,
      possibleDocumentId: possibleDocumentId,
      lineNumberInDocument: lineNumberInDocument,
      contactId: contactId,
      vehicleLicensePlate: vehicleLicensePlate,
      odometerMeasurement: odometerMeasurement
    });
  }

  finalizeSupplyTransactionPartialPrepaid(
    operatorId: string,
    supplyTransactionId: number,
    fuellingPointId: number): Observable<FinalizeSupplyTransactionPartialPrepaidResponse> {
    return this._createObservableFromPromise('FinalizeSupplyTransactionforPartialPrepaid', {
      operatorId,
      fuellingPointId,
      supplyTransactionId
    });
  }

  finalizeSupplyTransactionForFuelTest(
    operatorId: string,
    supplyTransactionId: number,
    fuellingPointId: number,
    deviation: number,
    returnTankId: string,
    observations: string
  ): Observable<FinalizeSupplyTransactionForFuelTestResponse> {
    return this._createObservableFromPromise('FinalizeSupplyTransactionForFuelTest', {
      operatorId,
      fuellingPointId,
      supplyTransactionId,
      deviation,
      returnTankId,
      observations
    });
  }

  requestChangeServiceMode(targetMode: ServiceModeType, idFuellingPoint: number,
    operatorId: string): Observable<ChangeServiceModeResponse> {
    return this._createObservableFromPromise('ChangeFuellingPointOperationMode', {
      fuellingPointId: idFuellingPoint,
      operatorId,
      operationMode: targetMode
    });
  }

  ChangeSalePrepayOtherFuellingPoint(
    idOrigenFP: number,
    idDestinoFP: number): Observable<ChangeSalePrepayOtherFuellingPointResponse> {
    return this._createObservableFromPromise('ChangeSalePrepayOtherFuellingPoint', {
      idOrigenFP,
      idDestinoFP
    });
  }

  requestChangePetrolStationMode(
    operatorId: string,
    mode: PetrolStationMode): Observable<ChangePetrolStationModeResponse> {
    return this._createObservableFromPromise('ChangePetrolStationPreconfiguredMode', {
      operatorId,
      mode
    });
  }
  setDefinitiveDocumentIdForSupplyTransactions(
    operatorId: string,
    definitiveDocumentId: string,
    SupplyTransactionIdList: Array<string>
  ): Observable<SetDefinitiveDocumentIdForSupplyTransactionsResponse> {
    return this._createObservableFromPromise('SetDefinitiveDocumentIdForSupplyTransactions', {
      operatorId,
      definitiveDocumentId,
      SupplyTransactionIdList
    });
  }
  setDefinitiveDocumentIdForPrepaidOperations(
    operatorId: string,
    definitiveDocumentId: string,
    supplyTransactionTokenList: Array<string>
  ): Observable<SetDefinitiveDocumentIdForPrepaidOperationsResponse> {
    return this._createObservableFromPromise('SetDefinitiveDocumentIdForPrepaidOperations', {
      operatorId,
      definitiveDocumentId,
      supplyTransactionTokenList
    });
  }

  getTransactionDataForRefundingPrepaidWithoutFuelling(operatorId: string,
    fuellingPointId: number): Observable<GetTransactionDataForRefundingPrepaidWithoutFuellingResponse> {
    return this._createObservableFromPromise('GetTransactionDataForRefundingPrepaidWithoutFuelling',
      {
        operatorId,
        fuellingPointId
      });
  }

  getGradePrices(operatorId: string): Observable<GetGradePricesResponse> {
    return this._createObservableFromPromise('GetGradePrices',
      {
        operatorId
      });
  }

  changeGradePrices(operatorId: string, newGradePriceList: Array<GradePrice>,
    observations: string, shop: string, isDeferred: boolean, dateDeferred: Date): Observable<ChangeGradePricesResponse> {
    return this._createObservableFromPromise('ChangeGradePrices',
      {
        operatorId,
        newGradePriceList,
        observations,
        shop,
        isDeferred,
        dateDeferred
      });
  }

  getSupplyTransactionOfFuellingPoint(supplyTransactionId: number, fuellingPointId: number):
    Observable<GetSupplyTransactionOfFuellingPointResponse> {
    return this._createObservableFromPromise('GetSupplyTransactionOfFuellingPoint',
      {
        supplyTransactionId,
        fuellingPointId,
      });
  }

  /* PRIVATE FUNCTIONS SIGNALR FUNCTIONS FROM SERVER*/
  private _onConnectionStateChanged(param: ConnectionStateChangedArgs) {
    // this._logHelper.trace('signalR connection State changed:');
    // this._logHelper.trace(param);
    this._fpSignalR.updateConnectionStateFromServer(param);
  }

  private _onFuellingPointStatusChanged(param: FuellingPointInfo) {
    // this._logHelper.trace('signalR fuellingPoint status changed');
    this._fpSignalR.updateFuellingPointFromServer(param);
  }

  private _onFuellingPointTransactionCountChanged(param: FuellingPointTransactionCountChangedArgs) {
    // this._logHelper.trace('signalR fuellingPoint transaction count changed:');
    this._fpSignalR.updateFuellingPointTransactionFromServer(param);
  }

  private _createObservableFromPromise<T>(actionName: string, params?: any): Observable<T> {
    // this._logHelper.trace(`Se va a llamar al método de SignalR ${actionName} con el siguiente objeto ->`);
    // this._logHelper.trace(params);
    return Observable.create((observer: Subscriber<T>) => {
      if (params != undefined) {
        this._hubProxy.invoke(actionName, params).then(
          (response: T) => observer.next(response),
          failResponse => observer.error(failResponse));
      } else {
        this._hubProxy.invoke(actionName).then(
          (response: T) => observer.next(response),
          failResponse => observer.error(failResponse));
      }
    });
  }
}
