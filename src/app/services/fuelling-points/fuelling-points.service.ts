import { Injectable } from '@angular/core';
import { SignalRPSSService } from 'app/services/signalr/signalr-pss.service';
import { FuellingLimit } from 'app/shared/fuelling-point/fuelling-limit';
import { OperatorInternalService } from 'app/services/operator/operator-internal.service';
import { CustomerInternalService } from 'app/services/customer/customer-internal.service';
import { PreparedPrepaidOperation } from 'app/shared/fuelling-point/prepared-prepaid-operation';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { FuellingPointPrepaidLine } from 'app/shared/fuelling-point/fuelling-point-prepaid-line';
import { FuellingPointsInternalService } from 'app/services/fuelling-points/fuelling-points-internal.service';
import { AutorizeFuellingPointStatus } from 'app/shared/hubble-pos-signalr-responses/autorize-fuelling-point-status.enum';
import { LogHelper } from 'app/helpers/log-helper';
import { CancelLockingFuellingPointStatus } from 'app/shared/hubble-pos-signalr-responses/cancel-locking-fuelling-point-status.enum';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';
import { FinalizeSupplyTransactionStatus } from 'app/shared/hubble-pos-signalr-responses/finalize-supply-transaction-status.enum';
import { FuellingPointSupplyLine } from 'app/shared/fuelling-point/fuelling-point-supply-line';
import { FuellingPointPrepaidLineData } from 'app/shared/fuelling-point/fuelling-point-prepaid-line-data';
import { HubbleDocumentLine } from 'app/shared/hubble-document-line';
import { SeriesType } from 'app/shared/series/series-type';
import { DocumentLine } from 'app/shared/document/document-line';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { LockSupplyTransactionStatus } from 'app/shared/hubble-pos-signalr-responses/lock-supply-transaction-status.enum';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { FormatHelper } from 'app/helpers/format-helper';
import { SuplyTransactionType } from 'app/shared/fuelling-point/suply-transaction-type.enum';
import { SuplyTransactionsStatuses } from 'app/shared/hubble-pos-signalr-responses/suply-transactions-statuses.enum';
import { FuellingPointAvailableActionType } from 'app/shared/fuelling-point/signalR-Response/fuelling-point-available-action-type';
import { AvailableActionsStatuses } from 'app/shared/hubble-pos-signalr-responses/available-actions-statuses.enum';
import { PreparePrepaidOperationStatus } from 'app/shared/hubble-pos-signalr-responses/prepare-prepaid-operation-status.enum';
import { PreparePresetOperationStatus } from 'app/shared/hubble-pos-signalr-responses/prepare-preset-operation-status.enum';
import {
  PrepareFuellingPointForPostpaidOperationStatus
} from 'app/shared/hubble-pos-signalr-responses/prepare-fuelling-point-for-postpaid-operation-status.enum';
import { EmergencyStopFuellingPointStatus } from 'app/shared/hubble-pos-signalr-responses/emergency-stop-fuelling-point-status.enum';
import { CancelEmergencyStopStatus } from 'app/shared/hubble-pos-signalr-responses/cancel-emergency-stop-status.enum';
import { LockedSuplyTransaction } from 'app/shared/fuelling-point/locked-suply-transaction';
import { UnlockSupplyTransactionStatus } from 'app/shared/hubble-pos-signalr-responses/unlock-supply-transaction-status.enum';
import {
  FinalizeSupplyTransactionPartialPrepaidStatus
} from 'app/shared/hubble-pos-signalr-responses/finalize-supply-transaction-partial-prepaid-status.enum';
// import {
// FinalizeSupplyTransactionForFuelTestResponseStatus
// } from 'app/shared/hubble-pos-signalr-responses/finalize-supply-transaction-for-fuel-test-response-status.enum';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { ServiceModeType } from 'app/shared/fuelling-point/service-mode-type.enum';
import { ChangeServiceModeStatus } from 'app/shared/hubble-pos-signalr-responses/change-service-mode-status.enum';
import { PetrolStationMode } from 'app/shared/fuelling-point/petrol-station-mode.enum';
import { ChangePetrolStationModeStatus } from 'app/shared/hubble-pos-signalr-responses/change-petrol-station-mode-status.enum';
import {
  LockPartialSuplyTransactionForRefundingStatus
} from '../../shared/hubble-pos-signalr-responses/lock-partial-suply-transaction-for-refunding-status.enum';
import { MixtPaymentInternalService } from '../payments/mixt-payment-internal.service';
import { PaymentPurpose } from '../../shared/payments/PaymentPurpose.enum';
import { ProvisionalIdToDefinitiveResponse } from 'app/shared/fuelling-point/provisional-id-to-definitive-response';
import { Guid } from 'app/helpers/guid';
import { FuellingPointSupplyLineData } from '../../shared/fuelling-point/fuelling-point-supply-line-data';
import {
  SetDefinitiveDocumentIdForSupplyTransactionsStatus
} from '../../shared/hubble-pos-signalr-responses/set-definitive-document-id-for-supply-transactions-status.enum';
import {
  SetDefinitiveDocumentIdForPrepaidOperationsStatus
} from '../../shared/hubble-pos-signalr-responses/set-definitive-document-id-for-prepaid-operations-status.enum';
import {
  GetTransactionDataForRefundingPrepaidWithoutFuellingStatus
} from '../../shared/hubble-pos-signalr-responses/get-transaction-data-for-refunding-prepaid-without-fuelling-status.enum';
import { FuellingPointCancelAuthorizationLine } from '../../shared/fuelling-point/fuelling-point-cancel-authorization-line';
import {
  CancelAuthorizationFuellingPointStatus
} from '../../shared/hubble-pos-signalr-responses/cancel-authorization-fuelling-point-status.enum';
import { LanguageService } from 'app/services/language/language.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { SignalRMultiTPVService } from 'app/services/signalr/signalr-multitpv.service';
import { HttpService } from 'app/services/http/http.service';
import { GetSupplyTransactionOfFuellingPointResponse } from 'app/shared/hubble-pos-signalr-responses/get-supply-transaction-of-fuelling-point-response';
import { FinalizeSupplyTransactionForFuelTestResponseStatus } from 'app/shared/hubble-pos-signalr-responses/finalize-supply-transaction-for-fuel-test-response-status.enum';
import { FuellingPointModeOperationChangedArgs } from 'app/shared/signalr-server-responses/multiTpvHub/fuelling-point-mode-operation-changed-args';
import { Subject } from 'rxjs/Subject';
import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';

@Injectable()
export class FuellingPointsService {

  private _fpVerifyReconexion: Subject<boolean> = new Subject<boolean>();
  fpVerifyReconexion$ = this._fpVerifyReconexion.asObservable();

  constructor(
    private _pssSvc: SignalRPSSService,
    private _operatorInternalSvc: OperatorInternalService,
    private _customerInternalSvc: CustomerInternalService,
    private _docInternalSvc: DocumentInternalService,
    private _fpInternalSvc: FuellingPointsInternalService,
    private _statusBarSvc: StatusBarService,
    private _confirmActionSvc: ConfirmActionService,
    private _mixtPaymentInternalSvc: MixtPaymentInternalService,
    private _languageService: LanguageService,
    private _appDataSvc: AppDataConfiguration,
    private _multiTpvSvc: SignalRMultiTPVService,
    private _http: HttpService,
    private _electronicJournal: ElectronicJournalService,
    private _logHelper : LogHelper,
  ) {
  }


  /********************************************************************
   ***** request signalR to Server ************************************
   ********************************************************************/
  /**
   * Recupera las operaciones en espera
   * @param fpId indica el surtidor o todos si undefined
   */
  requestSuplyTransactions(fpId?: number): Observable<SuplyTransaction[]> {
    return Observable.create((observer: Subscriber<SuplyTransaction[]>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.getSuplyTransactions(operatorId, fpId)
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

  requestSuplyTransactionsAnulated(fpId?: number): Observable<SuplyTransaction[]> {
    return Observable.create((observer: Subscriber<SuplyTransaction[]>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.getSuplyTransactionsAnulated(operatorId, fpId)
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
      const idTienda = this._appDataSvc.shop.id;

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


  UpdateSupplyAnulatedEnTicket(listaIdSumiAnul: number[], enTicket: boolean): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const idTienda = this._appDataSvc.shop.id;

      this._pssSvc.UpdateSupplyAnulatedEnTicket(listaIdSumiAnul, idTienda, enTicket)
        .first().subscribe(response => {
          if (response.status != SuplyTransactionsStatuses.Successful) {
            this._logError(response.status, response.message);
            observer.next(false);
            return;
          }
          observer.next(true);
        },
          error => {
            this._logError(undefined, error);
            observer.next(false);
          });
    });
  }


  /**
   * Recupera las acciones permitidas para el surtidor
   * @param fpId id del surtidor
   */
  requestAvailableActions(fpId: number): Observable<FuellingPointAvailableActionType[]> {
    return Observable.create((observer: Subscriber<FuellingPointAvailableActionType[]>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.getAvailableActions(operatorId, fpId)
        .first().subscribe(response => {
          if (response.status != AvailableActionsStatuses.Successful) {
            this._logError(response.status, response.message);
            observer.error();
            return;
          }
          observer.next(response.fuellingPointAvailableActionsList);
        },
          error => {
            this._logError(undefined, error);
            observer.error();
          });
    });
  }
  /**
   * Prepara una operacion de Prepago y devuelve informacion a introducir en linea
   * @param fuellingPointId id del surtidor
   * @param gradeId id del grado
   * @param fuellingLimit limite
   * @param kilometers kilometros
   */
  preparePrepaidOperation(
    fuellingPointId: number,
    gradeId: number,
    fuellingLimit: FuellingLimit,
    kilometers?: number): Observable<PreparedPrepaidOperation> {
    return Observable.create((observer: Subscriber<PreparedPrepaidOperation>) => {
      const customerId: string = this._getIdCustomer();
      const operatorId: string = this._getIdOperator();
      this._pssSvc.preparePrepaidOperation(customerId, operatorId, fuellingPointId, gradeId, fuellingLimit, kilometers)
        .first().subscribe(response => {
          if (response.status != PreparePrepaidOperationStatus.Successful) {
            if (operatorId != undefined) {
              this._logError(response.status, response.message);
            } else {
              this._logErrorOperator(response.status, response.message);
            }
            observer.error(response.message);
            return;
          }
          const ret: PreparedPrepaidOperation = {
            gradeId: gradeId,
            fuelingPointId: fuellingPointId,
            correspondingVolume: response.correspondingVolume,
            discountedAmount: response.discountedAmount,
            discountPercentage: response.discountPercentage,
            finalAmount: response.finalAmount,
            productReference: response.productReference,
            taxPercentage: response.taxPercentage,
            unitaryPricePreDiscount: response.unitaryPricePreDiscount,
            typeArticle: response.typeArticle,
            isConsigna: response.isConsigna
          };
          observer.next(ret);
        },
          error => {
            this._logError(undefined, error);
            observer.error();
          });
    });

  }
  /**
   * Realiza una operacion de preset en el surtidor.
   * @param fuellingPointId id del surtidor
   * @param gradeId id del grado
   * @param fuellingLimit limite
   * @param presetValue
   */
  preparePresetOperation(
    fuellingPointId: number,
    gradeId: number,
    fuellingLimit: FuellingLimit,
    presetValue?: number): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const customerId: string = this._getIdCustomer();
      const operatorId: string = this._getIdOperator();
      this._pssSvc.preparePresetOperation(customerId, operatorId, fuellingPointId, gradeId, fuellingLimit, presetValue)
        .first().subscribe(response => {
          if (response.status != PreparePresetOperationStatus.Successful) {
            this._logError(response.status, response.message);
            observer.next(false);
            return;
          }
          observer.next(true);
          this._publishMsgStatusBar();
        },
          error => {
            this._logError(undefined, error);
            observer.next(false);
          });
    });

  }
  /**
   * Establece en postpago la siguiente operacion del surtidor
   * @param fuellingPointId id del surtidor
   * @param gradeId id del grado undefined si cualquiera
   */
  prepareForPostpaidOperation(
    fuellingPointId: number,
    gradeId?: number): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.prepareFuellingPointForPostpaidOperation(operatorId, fuellingPointId, gradeId)
        .first().subscribe(response => {
          if (response.status != PrepareFuellingPointForPostpaidOperationStatus.Successful) {
            this._logError(response.status, response.message);
            observer.next(false);
            return;
          }
          observer.next(true);
          this._publishMsgStatusBar();
        },
          error => {
            this._logError(undefined, error);
            observer.next(false);
          });
    });
  }
  /**
   * Autoriza un surtidor qe estaba en prepago
   * @param fuellingPointId id del surtidor
   * @param seriesType tipo de serie
   * @param lineDetail detalles de la linea
   * @param documentId token provisional
   * @param contactId id del contacto
   * @param kilometers kilometros
   * @param vehicleLicensePlate matricula
   */
  autorizeFuellingPoint(
    fuellingPointId: number,
    seriesType: SeriesType,
    lineDetail: HubbleDocumentLine,
    documentId: string,
    contactId?: string,
    kilometers?: number,
    vehicleLicensePlate?: string): Observable<ProvisionalIdToDefinitiveResponse> {
    return Observable.create((observer: Subscriber<ProvisionalIdToDefinitiveResponse>) => {
      const operatorId: string = this._getIdOperator();
      const customerId: string = this._getIdCustomer();
      const provisionalId = Guid.newGuid();
      this._pssSvc.autorizeFuellingPoint(
        operatorId,
        fuellingPointId,
        customerId,
        provisionalId,
        seriesType,
        lineDetail,
        documentId,
        contactId,
        kilometers,
        vehicleLicensePlate).first().subscribe(response => {
          if (response == undefined || response.status != AutorizeFuellingPointStatus.successful) {
            this._logError(response.status, response.message);
            return observer.next({
              success: false,
              definitiveId: undefined
            });
          }
          observer.next({
            success: true,
            definitiveId: response.provisionalIdToDefinitivePrepaidTransactionIdMapping[provisionalId]
          });
          this._publishMsgStatusBar(this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_FuellingPointAuthorized'));
        },
          error => {
            this._logError(undefined, error);
            observer.next({
              success: false,
              definitiveId: undefined
            });
          });
    });
  }
  /**
   * Cancela el bloqueo de un surtidor
   * @param fuellingPointId id del surtidor
   */
  cancelLockingOfFuellingPoint(fuellingPointId: number): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.cancelLockingOfFuellingPoint(operatorId, fuellingPointId)
        .first().subscribe(response => {
          if (response == undefined || response.status != CancelLockingFuellingPointStatus.Successful) {
            this._logError(response.status, response.message);
            observer.next(false);
            return;
          }
          observer.next(true);
        },
          error => {
            this._logError(undefined, error);
            observer.next(false);
          });
    });
  }
  /**
   * Cancela la autorizacion de un surtidor
   * @param fuellingPointId id del surtidor
   */
  cancelAuthorizationOfFuellingPoint(fuellingPointId: number): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.cancelAuthorizationOfFuellingPoint(operatorId, fuellingPointId)
        .first().subscribe(response => {
          if (response == undefined || response.status != CancelAuthorizationFuellingPointStatus.Successful) {
            this._logError(response.status, response.message);
            observer.next(false);
            return;
          }
          observer.next(true);
        },
          error => {
            this._logError(undefined, error);
            observer.next(false);
          });
    });
  }
  /**
   * Realiza una pticion de parada de mergencia
   * @param fuellingPointId id del surtidor, undefined para todos
   */
  emergencyStop(fuellingPointId?: number): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.emergencyStop(operatorId, fuellingPointId)
        .first().subscribe(response => {
          if (response.status != EmergencyStopFuellingPointStatus.Successful) {
            this._logError(response.status, response.message);
            observer.next(false);
            return;
          }
          observer.next(true);
          this._publishMsgStatusBar(this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_EmergencyStopCompleted'));
        },
          error => {
            this._logError(undefined, error);
            observer.next(false);
          });
    });

  }
  /**
   * Realiza una peticion de cancelacion de parada de emergencia
   * @param fuellingPointId id del surtidor, undefined para todos
   */
  cancelEmergencyStop(fuellingPointId?: number): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.cancelEmergencyStop(operatorId, fuellingPointId)
        .first().subscribe(response => {
          if (response.status != CancelEmergencyStopStatus.Successful) {
            this._logError(response.status, response.message);
            observer.next(false);
            return;
          }
          observer.next(true);
          this._publishMsgStatusBar(this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_ResumptionCompleted'));
        },
          error => {
            this._logError(undefined, error);
            observer.next(false);
          });
    });
  }
  /**
   * bloquea una operacion pendiente
   * @param supplyTransactionId id de la transaccion
   * @param fuellingPointId id del surtidor
   */
  lockSupplyTransaction(supplyTransactionId: number, fuellingPointId: number): Observable<LockedSuplyTransaction> {
    return Observable.create((observer: Subscriber<LockedSuplyTransaction>) => {
      const operatorId: string = this._getIdOperator();
      const customerId: string = this._getIdCustomer();
      this._pssSvc.lockSupplyTransaction(operatorId, customerId, supplyTransactionId, fuellingPointId)
        .first().subscribe(response => {
          if (response.status != LockSupplyTransactionStatus.Successful) {
            if (operatorId != undefined) {
              this._logError(response.status, response.message);
            } else {
              this._logErrorOperator(response.status, response.message);
            }
            observer.error();
            return;
          }
          observer.next({
            productName: response.productName,
            productId: response.productReference,
            correspondingVolume: response.correspondingVolume,
            discountedAmount: response.discountedAmount,
            discountPercentage: response.discountPercentage,
            finalAmount: response.finalAmount,
            taxPercentage: response.taxPercentage,
            unitaryPricePreDiscount: response.unitaryPricePreDiscount,
            typeArticle: response.typeArticle,
            isConsigna: response.isConsigna
          });
        },
          error => {
            this._logError(undefined, error);
            observer.error();
          });
    });

  }

  lockPartialSupplyTransactionForRefunding(
    supplyTransactionId: number,
    fuelingPointId: number): Observable<LockedSuplyTransaction> {
    return Observable.create((observer: Subscriber<LockedSuplyTransaction>) => {
      this._pssSvc.lockPartialSupplyTransactionForRefunding(this._getIdOperator(), supplyTransactionId, fuelingPointId)
        .first().subscribe(response => {
          if (response.status != LockPartialSuplyTransactionForRefundingStatus.successful) {
            this._logError(response.status, response.message);
            observer.error();
            return;
          }
          observer.next({
            productName: response.productName,
            productId: response.productId,
            correspondingVolume: response.correspondingVolume,
            discountedAmount: response.discountedAmount,
            discountPercentage: response.discountPercentage,
            finalAmount: response.finalAmount,
            taxPercentage: response.taxPercentage,
            unitaryPricePreDiscount: response.unitaryPricePreDiscount,
            customerId: response.customerId,
            serieType: response.serieType,
            sourceDocumentId: response.sourceDocumentId,
            typeArticle: response.typeArticle,
            isConsigna: response.isConsigna
          });
        },
          error => {
            this._logError(undefined, error);
            observer.error();
          });
    });
  }
  /**
   * Desbloquea una operacion en espera
   * @param supplyTransactionId id transaccion
   * @param fuellingPointId id surtidor
   */
  unlockSupplyTransaction(supplyTransactionId: number, fuellingPointId: number): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.unlockSupplyTransaction(operatorId, supplyTransactionId, fuellingPointId)
        .first().subscribe(response => {
          if (response.status != UnlockSupplyTransactionStatus.Successful) {
            observer.next(false);
            this._logError(response.status, response.message);
            return;
          }
          observer.next(true);
        },
          error => {
            this._logError(undefined, error);
            observer.next(false);
          });
    });

  }
  /**
   * Termina una operacion en espera
   * @param supplyTransactionId id transsacion
   * @param fuellingPointId id surtidor
   */
  finalizeSupplyTransaction(supplyTransactionId: number,
    fuellingPointId: number,
    possibleDocumentId: string,
    lineNumberInDocument: number,
    contactId?: string,
    vehicleLicensePlate?: string,
    odometerMeasurement?: number): Observable<ProvisionalIdToDefinitiveResponse> {
    return Observable.create((observer: Subscriber<ProvisionalIdToDefinitiveResponse>) => {
      const operatorId: string = this._getIdOperator();
      const customerId: string = this._getIdCustomer();
      const provisionalId = Guid.newGuid();
      this._pssSvc.finalizeSupplyTransaction(operatorId,
        supplyTransactionId,
        fuellingPointId,
        customerId,
        provisionalId,
        possibleDocumentId,
        lineNumberInDocument,
        contactId,
        vehicleLicensePlate,
        odometerMeasurement)
        .first().subscribe(response => {
          if (response.status != FinalizeSupplyTransactionStatus.Successful) {
            this._logError(response.status, response.message);
            return observer.next({
              success: false,
              definitiveId: undefined
            });
          }
          return observer.next({
            success: true,
            definitiveId: response.provisionalSupplyIdToDefinitiveSupplyIdMapping[provisionalId]
          });
        },
          error => {
            this._logError(undefined, error);
            observer.next({
              success: false,
              definitiveId: undefined
            });
          });
    });
  }
  finalizeSupplyTransactionPartialPrepaid(supplyTransactionId: number, fuellingPointId: number): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.finalizeSupplyTransactionPartialPrepaid(operatorId, supplyTransactionId, fuellingPointId)
        .first().subscribe(response => {
          if (response.status != FinalizeSupplyTransactionPartialPrepaidStatus.Successful) {
            observer.next(false);
            this._logError(response.status, response.message);
            return;
          }
          observer.next(true);
        },
          error => {
            this._logError(undefined, error);
            observer.next(false);
          });
    });
  }
  /*finalizeSupplyTransactionCalibration(supplyTransactionId: number, fuellingPointId: number): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.finalizeSupplyTransactionForFuelTest(operatorId, supplyTransactionId, fuellingPointId, deviation, returnTankId, observations)
        .first().subscribe(response => {
          if (response.status != FinalizeSupplyTransactionForFuelTestResponseStatus.Successful) {
            observer.next(false);
            this._logError(response.status, response.message);
            return;
          }
          observer.next(true);
        },
          error => {
            this._logError(undefined, error);
            observer.next(false);
          });
    });
  }*/
  /**
   * Realiza un cambio en el modo de servicio
   * @param targetServiceMode modo servicio a cambiar
   * @param idFuellingPoint id del surtidor
   */
  // tslint:disable-next-line: max-line-length
  requestChangeServiceMode(targetServiceMode: ServiceModeType, idFuellingPoint: number, statubarMessageCustom: string = undefined): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.requestChangeServiceMode(targetServiceMode, idFuellingPoint, operatorId)
        .first().subscribe(response => {
          if (response.status == ChangeServiceModeStatus.Successful) {
            // && response.specificMessage != undefined
            // && response.specificMessage != '') {
            this._statusBarSvc.publishMessage(response.specificMessage);
            this._publishMsgStatusBar(this._languageService.getLiteral('fuelling_point_service', (statubarMessageCustom) ? statubarMessageCustom : 'message_StatusBar_ServiceModeChagnedSuccessfully'));
            observer.next(true);
          }
          else {
            this._logError(response.status, response.message);
            this._publishMsgStatusBar(this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_ServiceModeUnchanged'));
            observer.next(false);
          }

        },
          error => {
            this._logError(undefined, error);
            observer.next(false);
          });
    });
  }
  requestChangePetrolStationMode(targetServiceMode: PetrolStationMode): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.requestChangePetrolStationMode(operatorId, targetServiceMode)
        .first().subscribe(response => {
          if (response.status != ChangePetrolStationModeStatus.Successful) {
            observer.next(false);
            this._logError(response.status, response.message);
            return;
          }
          observer.next(true);
          this._publishMsgStatusBar(this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_ServiceModeChagnedSuccessfully'));
        }, error => {
          this._logError(undefined, error);
          observer.next(false);
        });
    });
  }
  /**
   * Informa a las transacciones el numero de documento definitivo al que quedan relacionadas
   * @param definitiveDocumentId
   * @param idSupplyTransactionList
   */
  setDefinitiveDocumentIdForSupplyTransactions(definitiveDocumentId: string, idSupplyTransactionList: Array<string>): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.setDefinitiveDocumentIdForSupplyTransactions(
        operatorId,
        definitiveDocumentId,
        idSupplyTransactionList)
        .first().subscribe(response => {
          if (response.status != SetDefinitiveDocumentIdForSupplyTransactionsStatus.Successful) {
            this._logError(response.status, response.message);
            return observer.next(false);
          }
          observer.next(true);
        },
          error => {
            this._logError(undefined, error);
            return observer.next(false);
          });
    });
  }
  /**
   * Informa a las transacciones el numero de documento definitivo al que quedan relacionadas
   * @param definitiveDocumentId
   * @param supplyTransactionTokenList
   */
  setDefinitiveDocumentIdForPrepaidOperations(definitiveDocumentId: string, supplyTransactionTokenList: Array<string>): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.setDefinitiveDocumentIdForPrepaidOperations(
        operatorId,
        definitiveDocumentId,
        supplyTransactionTokenList)
        .first().subscribe(response => {
          if (response.status != SetDefinitiveDocumentIdForPrepaidOperationsStatus.Successful) {
            this._logError(response.status, response.message);
            return observer.next(false);
          }
          observer.next(true);
        },
          error => {
            this._logError(undefined, error);
            return observer.next(false);
          });
    });
  }
  /**
   * Prepara la devolucion para una autorizacion
   * @param fuellingPointId identificador del fuelling point del que se quiere cancelar autorizacion
   */
  getTransactionDataForRefundingPrepaidWithoutFuelling(fuellingPointId: number): Observable<LockedSuplyTransaction> {
    return Observable.create((observer: Subscriber<LockedSuplyTransaction>) => {
      const operatorId: string = this._getIdOperator();
      this._pssSvc.getTransactionDataForRefundingPrepaidWithoutFuelling(operatorId, fuellingPointId)
        .first().subscribe(response => {
          if (response.status != GetTransactionDataForRefundingPrepaidWithoutFuellingStatus.Successful) {
            this._logError(response.status, response.message);
            observer.error();
            return;
          }
          observer.next({
            productName: response.productName,
            productId: response.productId,
            correspondingVolume: response.correspondingVolume,
            discountedAmount: response.discountedAmount,
            discountPercentage: response.discountPercentage,
            finalAmount: response.finalAmount,
            taxPercentage: response.taxPercentage,
            unitaryPricePreDiscount: response.unitaryPricePreDiscount,
            customerId: response.customerId,
            serieType: response.serieType,
            sourceDocumentId: response.sourceDocumentId,
            sourceDocumentNumber: response.sourceDocumentNumber,
            isConsigna: response.isConsigna,
            typeArticle: response.typeArticle
          });
        },
          error => {
            this._logError(undefined, error);
            observer.error();
          }
        );
    });
  }

  requestChangeServiceModeMultiTPV(targetServiceMode: ServiceModeType, idFuellingPoint: number, tpv: string,
    hasPostPaidTransaction: boolean, hasPrePaidTransaction: boolean,
    ServiceModeOld: ServiceModeType,
    hasPostPaidTransactionOld: boolean, hasPrePaidTransactionOld: boolean): Observable<boolean> {
    // tslint:disable-next-line: no-unsafe-any
    return Observable.create((observer: Subscriber<boolean>) => {
      const operatorId: string = this._getIdOperator();
      this._multiTpvSvc.requestChangeServiceModeMultiTPV(targetServiceMode, idFuellingPoint, tpv,
        hasPostPaidTransaction, hasPrePaidTransaction,
        ServiceModeOld, hasPostPaidTransactionOld, hasPrePaidTransactionOld,
        operatorId)
        .first().subscribe(response => {
          if (response) {
            if (response.status == ChangeServiceModeStatus.Successful) {
              observer.next(true);
            }
            else {
              this._logError(response.status, response.message);
              observer.next(false);
            }
          } else { observer.next(false); }
        },
          error => {
            this._logError(undefined, error);
            observer.next(false);
          });
    });
  }

  /************************** FUELLING POINTS OPERATIONS ************************************************************************** */
  /********** PREPAID OPERATION   ********************* */
  /**
   * Inserta una linea en documento con la informacion de una operacion de prepago
   */
  managePrepaidOperationPrepared(preparedOperation: PreparedPrepaidOperation) {
    const data: FuellingPointPrepaidLineData = {
      fpSvc: this,
      idFuellingPoint: preparedOperation.fuelingPointId,
      lineDetail: undefined
    };
    const bs = new FuellingPointPrepaidLine(data,this._logHelper);
    const productName = this._fpInternalSvc.getDescriptionFromGrade(preparedOperation.gradeId);
    const line: DocumentLine = {
      productId: preparedOperation.productReference,
      quantity: preparedOperation.correspondingVolume,
      discountPercentage: preparedOperation.discountPercentage,
      description: `S: ${preparedOperation.fuelingPointId} ${productName}`,
      priceWithTax: preparedOperation.unitaryPricePreDiscount,
      discountAmountWithTax: preparedOperation.discountedAmount,
      totalAmountWithTax: preparedOperation.finalAmount,
      taxPercentage: preparedOperation.taxPercentage,
      businessSpecificLineInfo: bs,
      taxAmount: 0,
      originalPriceWithTax: preparedOperation.unitaryPricePreDiscount,
      typeArticle: preparedOperation.typeArticle,
      isConsigna: preparedOperation.isConsigna,
      idCategoria: '',
      nameCategoria: ''
    };
    const lineNumber = this._docInternalSvc.publishLineData(line);

    data.lineDetail = {
      lineNumber: lineNumber,
      productId: preparedOperation.productReference,
      productName: productName,
      quantity: preparedOperation.correspondingVolume,
      unitaryPriceWithTax: preparedOperation.unitaryPricePreDiscount,
      discountPercentage: preparedOperation.discountPercentage,
      discountAmountWithTax: preparedOperation.discountedAmount,
      taxPercentage: preparedOperation.taxPercentage,
      taxAmount: 0,
      totalAmountWithTax: preparedOperation.finalAmount,
    };
    this._publishMsgStatusBar(this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_PrepayAddedToDocument'));
  }
  /**
   * Efectúa las operaciones necesarias para la gestión de la transacción seleccionada
   * @param transaction transaccion en espera
   */
  manageSupplyTransaccion(transaction: SuplyTransaction): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      switch (transaction.type) {
        case SuplyTransactionType.PostpaidNoLocked:
          this.lockSupplyTransaction(transaction.id, transaction.fuellingPointId)
            .first().subscribe(response => {
              this._addLockedTransactionToLine(response, transaction);
              observer.next(true);
            },
              failResponse => {
                observer.next(false);
              });
          break;
        case SuplyTransactionType.PostpaidLockedByOwnPOS:
          this._statusBarSvc.publishMessage(
            this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_TransactionLockedByThisPOS'));
          observer.next(false);
          break;
        case SuplyTransactionType.PrepaidParcialLockedByOwnPOS:
          if (this._documentHasTransaction(transaction)) {
            this._statusBarSvc.publishMessage(
              this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_TransactionAlreadyAdded'));
            observer.next(false);
            return;
          }
          this.lockPartialSupplyTransactionForRefunding(transaction.id, transaction.fuellingPointId)
            .first().subscribe(responseLock => {
              try {
                // Generamos documento rectificativo para la devolucion
                const specificLine: FuellingPointSupplyLine = new FuellingPointSupplyLine({
                  fpSvc: this,
                  supplyTransaction: transaction,
                  lineNumberInDocument: 1
                });
                this._docInternalSvc.createDocumentForRefundObservable(responseLock, specificLine, transaction.fuellingPointId).first().subscribe(document => {
                  // enviamos a pago mixto
                  this._mixtPaymentInternalSvc.requestMixtPaymentSale(document, PaymentPurpose.Refund, false);

                  // Electronic Journal - refundCaptured
                  this._electronicJournal.writeAction({
                    type: ActionType.refundCaptured,
                    selectedDocument: this._docInternalSvc.currentDocumentIndex.toString(),
                    fuellingPointCode: transaction.fuellingPointId.toString(),
                    previousDocument: responseLock.sourceDocumentId,
                    productId: responseLock.productId,
                    amount: responseLock.finalAmount.toString(),
                  });

                  observer.next(true);
                });


              } catch (error) {
                this._logError(undefined, error);
                observer.next(false);
              }

            },
              failResponse => {
                observer.next(false);
              });
          break;
        case SuplyTransactionType.PostpaidLockedByOtherPOS:
        case SuplyTransactionType.PrepaidParcialLockedByOtherPOS:
          this._statusBarSvc.publishMessage(
            this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_TransactionLockedByOtherPOS'));
          observer.next(false);
          break;
        case SuplyTransactionType.PrepaidParcialNotLocked:
        default:
          this._statusBarSvc.publishMessage(this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_InvalidTransaction'));
          observer.next(false);
          return;
      }

    });
  }
  manageSupplyTransaccionVirtual(transaction: SuplyTransaction): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      switch (transaction.type) {
        case SuplyTransactionType.PostpaidNoLocked:
          this._addLockedTransactionToLineVirtual(transaction);
          observer.next(true);
          break;
        case SuplyTransactionType.PostpaidLockedByOwnPOS:
          this._statusBarSvc.publishMessage(
            this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_TransactionLockedByThisPOS'));
          observer.next(false);
          break;
        case SuplyTransactionType.PrepaidParcialLockedByOwnPOS:
          if (this._documentHasTransaction(transaction)) {
            this._statusBarSvc.publishMessage(
              this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_TransactionAlreadyAdded'));
            observer.next(false);
            return;
          }
          // this.lockPartialSupplyTransactionForRefunding(transaction.id, transaction.fuellingPointId)
          //  .first().subscribe();
          break;
        case SuplyTransactionType.PostpaidLockedByOtherPOS:
        case SuplyTransactionType.PrepaidParcialLockedByOtherPOS:
          this._statusBarSvc.publishMessage(
            this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_TransactionLockedByOtherPOS'));
          observer.next(false);
          break;
        case SuplyTransactionType.PrepaidParcialNotLocked:
        default:
          this._statusBarSvc.publishMessage(this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_InvalidTransaction'));
          observer.next(false);
          return;
      }
    });
  }
  /**
   * Efectúa las operaciones necesarias para la gestión de la transacción de anulación seleccionada
   * @param transaction transaccion en espera
   */
  manageSupplyTransaccionAnulated(transaction: SuplyTransaction): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {

      this._addLockedTransactionToLineAnulated(transaction);
      observer.next(true);

    });
  }

  /**
   * Realiza las operaciones para una parada o reanudacion
   * @param isStop indica si es parada o reaundar
   * @param idFuellingPoint id del surtidor
   */
  manageRequestEmergencyStop(isStop: boolean, idFuellingPoint?: number): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const textQuestion = idFuellingPoint != undefined ?
        !isStop ? this._languageService.getLiteral(
          'fuelling_point_service', 'literal_EmergencyStop_ResumeFuellingPoint') :
          this._languageService.getLiteral('fuelling_point_service', 'literal_EmergencyStop_StopFuellingPoint')
        : !isStop ? this._languageService.getLiteral(
          'fuelling_point_service', 'literal_EmergencyStop_ResumeAllFuellingPoints') :
          this._languageService.getLiteral('fuelling_point_service', 'literal_EmergencyStop_StopFuellingPoints');
      this._confirmActionSvc.promptActionConfirm(textQuestion,
        this._languageService.getLiteral('fuelling_point_service', 'bottomButton_EmergencyStop_Accept'),
        this._languageService.getLiteral('fuelling_point_service', 'bottomButton_EmergencyStop_Cancel'))
        .first()
        .subscribe(confirmation => {
          if (confirmation === true) {
            if (isStop) {
              this.emergencyStop(idFuellingPoint)
                .first().subscribe(stopResponse => {
                  observer.next(true);
                });
            } else {
              this.cancelEmergencyStop(idFuellingPoint)
                .first().subscribe(resumeResponse => {
                  observer.next(true);
                });
            }
          } else {
            observer.next(false);
          }
        });
    });
  }

  /**
   * Cancela un prepago hecho a un surtidor
   * @param fuellingPointId identificador del fuelling point
   */
  manageRequestCancelPrepay(fuellingPointId: number): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      this.getTransactionDataForRefundingPrepaidWithoutFuelling(fuellingPointId)
        .first().subscribe(responseGetDataForRefunding => {
          const specificLine = new FuellingPointCancelAuthorizationLine({
            fpSvc: this,
            idFuellingPoint: fuellingPointId
          }, this._logHelper);
          // creamos documento rectificativo
          this._docInternalSvc.createDocumentForRefundObservable(responseGetDataForRefunding, specificLine, fuellingPointId).first().subscribe(document => {
            // enviamos a pago mixto
            //this._mixtPaymentInternalSvc.requestMixtPaymentSale(document, PaymentPurpose.Refund, false);
            this._mixtPaymentInternalSvc.requestMixtPaymentSale(document, PaymentPurpose.Refund, false).subscribe(
              responseMixPaySale => {
                observer.next(responseMixPaySale);
              },
              errorMixPaySale => {
                observer.next(false);
              }
            );
          });
        },
          failResponse => {
            observer.next(false);
          });
    });
  }
  /**
   * Cancela una autorizacion (preset) a un surtidor
   * @param fuellingPointId identificador del surtidor
   */
  manageRequestCancelPreset(fuellingPointId: number): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      this.cancelAuthorizationOfFuellingPoint(fuellingPointId)
        .first().subscribe(responseCancelAuthorization => {
          observer.next(responseCancelAuthorization);
        },
          failResponse => {
            observer.next(false);
          });
    });
  }

  getSupplyTransactionOfFuellingPoint(supplyTransactionId: number,
    fuellingPointId: number): Observable<GetSupplyTransactionOfFuellingPointResponse> {
    return Observable.create((observer: Subscriber<GetSupplyTransactionOfFuellingPointResponse>) => {
      this._pssSvc.getSupplyTransactionOfFuellingPoint(supplyTransactionId, fuellingPointId)
        .first().subscribe((response: GetSupplyTransactionOfFuellingPointResponse) => {
          if (response.status != FinalizeSupplyTransactionForFuelTestResponseStatus.successful) {
            this._logError(response.status, response.message);
            return observer.next(undefined);
          }
          return observer.next(response);
        },
          error => {
            this._logError(undefined, error);
            observer.next(undefined);
          });
    });
  }

  /********** PRIVATE FUNCTIONS   *********************/

  private _getIdOperator(): string {
    const currentOperator = this._operatorInternalSvc.currentOperator;
    return currentOperator == undefined ? undefined : currentOperator.id;
  }
  private _getIdCustomer(): string {
    const currentCustomer = this._customerInternalSvc.currentCustomer;
    return currentCustomer == undefined ? undefined : currentCustomer.id;
  }

  get getIdCustomer(): string {
    const currentCustomer = this._customerInternalSvc.currentCustomer;
    return currentCustomer == undefined ? undefined : currentCustomer.id;
  }
  private _logError(status: number = -1, text: string) {
    this._logHelper.logError(status, text);
  }

  private _logErrorOperator(status: number = -1, text: string) {
    this._logHelper.logError(status, text);
    this._statusBarSvc.publishMessage(FormatHelper.formatOperatorMessage(status));
  }
  private _publishMsgStatusBar(message: string = this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_OperationCompleted')) {
    this._statusBarSvc.publishMessage(message);
  }
  private _addLockedTransactionToLine(lockedTransaction: LockedSuplyTransaction, transaction: SuplyTransaction): number {
    transaction.description = lockedTransaction.productName;
    const supplyLineData: FuellingPointSupplyLineData = {
      fpSvc: this,
      supplyTransaction: transaction,
      lineNumberInDocument: 1
    };
    const specificLine: FuellingPointSupplyLine = new FuellingPointSupplyLine(supplyLineData);
    const line: DocumentLine = {
      productId: lockedTransaction.productId,
      quantity: lockedTransaction.correspondingVolume,
      discountPercentage: lockedTransaction.discountPercentage,
      description: `S: ${transaction.fuellingPointId} ${lockedTransaction.productName}`,
      priceWithTax: lockedTransaction.unitaryPricePreDiscount,
      discountAmountWithTax: lockedTransaction.discountedAmount,
      totalAmountWithTax: lockedTransaction.finalAmount,
      taxPercentage: lockedTransaction.taxPercentage,
      typeArticle: lockedTransaction.typeArticle,
      businessSpecificLineInfo: specificLine,
      taxAmount: 0,
      originalPriceWithTax: lockedTransaction.unitaryPricePreDiscount,
      isConsigna: lockedTransaction.isConsigna,
      idCategoria: '',
      nameCategoria: ''
    };
    this._publishMsgStatusBar(this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_TransactionAddedToDocument'));
    const numberLine = this._docInternalSvc.publishLineData(line);
    supplyLineData.lineNumberInDocument = numberLine;
    return numberLine;
  }

  private _addLockedTransactionToLineAnulated(transaction: SuplyTransaction): number {
    const supplyLineData: FuellingPointSupplyLineData = {
      fpSvc: this,
      supplyTransaction: transaction,
      lineNumberInDocument: 1
    };
    const specificLine: FuellingPointSupplyLine = new FuellingPointSupplyLine(supplyLineData);
    const line: DocumentLine = {
      productId: transaction.gradeReference,
      quantity: transaction.volume,
      discountPercentage: 0,
      description: 'S: ' + transaction.fuellingPointId.toString() + ' ' + transaction.description,
      priceWithTax: transaction.gradeUnitPrice,
      discountAmountWithTax: 0,
      totalAmountWithTax: transaction.money,
      taxPercentage: transaction.iva,
      typeArticle: transaction.typeArticle,
      businessSpecificLineInfo: specificLine,
      taxAmount: 0,
      idCategoria: '',
      nameCategoria: ''
    };
    this._publishMsgStatusBar(this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_TransactionAddedToDocument'));
    const numberLine = this._docInternalSvc.publishLineData(line);
    supplyLineData.lineNumberInDocument = numberLine;
    return numberLine;
  }
  // transaction virtual
  private _addLockedTransactionToLineVirtual(transaction: any): number {
    const supplyLineData: FuellingPointSupplyLineData = {
      fpSvc: this,
      supplyTransaction: transaction,
      lineNumberInDocument: 1
    };
    const specificLine: FuellingPointSupplyLine = new FuellingPointSupplyLine(supplyLineData);
    const line: DocumentLine = {
      productId: transaction.gradeReference,
      quantity: transaction.volume,
      discountPercentage: 0,
      description: `S: ${transaction.fuellingPointId} ${transaction.description}`,
      priceWithTax: transaction.gradeUnitPrice,
      discountAmountWithTax: 0,
      totalAmountWithTax: transaction.money,
      taxPercentage: transaction.taxPercentage,
      typeArticle: transaction.typeArticle,
      businessSpecificLineInfo: specificLine,
      taxAmount: 0,
      priceWithoutTax: transaction.priceWithoutTax,
      // originalPriceWithTax: lockedTransaction.unitaryPricePreDiscount,
      isConsigna: transaction.isConsigna,
      idCategoria: '',
      nameCategoria: ''
    };
    this._publishMsgStatusBar(this._languageService.getLiteral('fuelling_point_service', 'message_StatusBar_TransactionAddedToDocument'));
    const numberLine = this._docInternalSvc.publishLineData(line);
    supplyLineData.lineNumberInDocument = numberLine;
    return numberLine;
  }
  /**
   * Indica si la transacción está actualmente ya introducida en algun documento del tpv
   * @param transaction transaccion a buscar
   */
  private _documentHasTransaction(transaction: SuplyTransaction): boolean {
    return this._docInternalSvc.hasTransaction(transaction);
  }

  //#region Call Web Services COFO

  UpdateFuellingPointOperationMode(idFuellingPoint: number, doms: string,
    isAttend: boolean, isPreAuthorized: boolean,
    tpv: string, hasPostPaidTransaction: boolean,
    hasPrePaidTransaction: boolean, modeType: number,
    hasPostPaidTransactionOld: boolean,
    hasPrePaidTransactionOld: boolean, modeTypeOld: number): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const request = {
        identity: this._appDataSvc.userConfiguration.Identity,
        tpv: tpv,
        fuellingPointId: idFuellingPoint,
        doms: doms,
        isAttend: isAttend,
        isPreAuthorized: isPreAuthorized,
        hasPostPaidTransaction: hasPostPaidTransaction,
        hasPrePaidTransaction: hasPrePaidTransaction,
        modeType: modeType,
        hasPostPaidTransactionOld: hasPostPaidTransactionOld,
        hasPrePaidTransactionOld: hasPrePaidTransactionOld,
        modeTypeOld: modeTypeOld,
      };
      this._http.postJsonObservable(`${this._appDataSvc.apiUrlCofo}/UpdateFuellingPointOperationMode`, request)
        .first().subscribe(response => {
          if (response.status == ChangeServiceModeStatus.Successful) {
            observer.next(true);
          }
          else {
            this._logError(response.status, response.message);
            observer.next(false);
          }
        }, error => {
          this._logError(undefined, error);
          observer.next(false);
        });
    });
  }

  GetAllFuellingPointOperationMode(): Observable<Array<FuellingPointModeOperationChangedArgs>> {
    return Observable.create((observer: Subscriber<boolean>) => {
      this._http.getJsonObservable(`${this._appDataSvc.apiUrlCofo}/GetAllFuellingPointOperationMode`)
        .first().subscribe(response => {
          if (response.status == ChangeServiceModeStatus.Successful) {
            observer.next(response.fpList);
          }
          else {
            this._logError(response.status, response.message);
            observer.next(undefined);
          }
        }, error => {
          this._logError(undefined, error);
          observer.next(undefined);
        });
    });
  }

  fnFpVerifyReconexion(value: boolean) {
    this._fpVerifyReconexion.next(value);
  }

  //#endregion
}
