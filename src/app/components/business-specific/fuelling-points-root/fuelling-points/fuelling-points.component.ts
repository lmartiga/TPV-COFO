import { Component, OnInit, OnDestroy } from '@angular/core';
import { FuellingPointsService } from 'app/services/fuelling-points/fuelling-points.service';
import { FuellingPointInfo } from 'app/shared/fuelling-point/fuelling-point-info';
import { FuellingPointsInternalService } from 'app/services/fuelling-points/fuelling-points-internal.service';
import { FuellingPointsSignalrUpdatesService } from 'app/services/fuelling-points/fuelling-points-signalr-updates.service';
import { AuxiliarActionsManagerService } from 'app/services/auxiliar-actions/auxiliar-actions-manager.service';
import {
  FuellingPointTransactionCountChangedArgs
} from 'app/shared/fuelling-point/signalR-Response/fuelling-point-transaction-count-changed-args';
import { FuellingPointFormatConfiguration } from 'app/shared/fuelling-point/fuelling-point-format-configuration';
import { Subscription } from 'rxjs/Subscription';
import { PetrolStationMode } from 'app/shared/fuelling-point/petrol-station-mode.enum';

import { SignalRPSSService } from 'app/services/signalr/signalr-pss.service';
// import { DocumentService } from 'app/services/document/document.service';
import { RoundPipe } from 'app/pipes/round.pipe';
import { DocumentLinePromotion } from 'app/shared/document/document-line-promotion';
import { Customer } from 'app/shared/customer/customer';
import { FuellingPointSupplyLineData } from 'app/shared/fuelling-point/fuelling-point-supply-line-data';
import { FuellingPointSupplyLine } from 'app/shared/fuelling-point/fuelling-point-supply-line';
import { CustomerService } from 'app/services/customer/customer.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { CashPaymentService } from 'app/services/payments/cash-payment.service';
import { Operator } from 'app/shared/operator/operator';
import { OperatorInternalService } from 'app/services/operator/operator-internal.service';
import { ServiceModeType } from 'app/shared/fuelling-point/service-mode-type.enum';
import { PromotionsService } from 'app/services/promotions/promotions.service';
import { ResponseStatus } from 'app/shared/response-status.enum';
import { ChangePaymentInternalService } from 'app/services/payments/change-payment-internal.service';
import { Globals } from 'app/services/Globals/Globals';
import { LanguageService } from 'app/services/language/language.service';
import { FuellingPointMainStates } from 'app/shared/fuelling-point/fuelling-point-main-states.enum';
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
import { LockSupplyTransactionStatus } from 'app/shared/hubble-pos-signalr-responses/lock-supply-transaction-status.enum';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';
import { DocumentService } from 'app/services/document/document.service';
import { Guid } from 'app/helpers/guid';
import { DocumentLine } from 'app/shared/document/document-line';
import { SignalRMultiTPVService } from 'app/services/signalr/signalr-multitpv.service';
import { UpdateDocumentVirtualResponse } from 'app/shared/signalr-server-responses/multiTpvHub/update-document-virtual-response';
import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';
import { CreditCardPaymentService } from 'app/services/payments/credit-card-payment.service';
import { LogHelper } from 'app/helpers/log-helper';


@Component({
  selector: 'tpv-fuelling-points',
  templateUrl: './fuelling-points.component.html',
  styleUrls: ['./fuelling-points.component.scss']
})
export class FuellingPointsComponent implements OnInit, OnDestroy {
  // stores the information about fuelling points on the service station
  fpInformation: Array<FuellingPointInfo>;
  fpSupplyTransaction: Array<SuplyTransaction>;
  supplyTransactionsVirtual: Array<SuplyTransaction> = [];
  contador = 0;
  private _subscriptions: Subscription[] = [];
  // private _subscriptionOnFuellingPoint: Subscription = new Subscription();
  value: number = 0;
  btnStopCheckStatus: boolean;
  btnNightCheckStatus: boolean;
  isTicket: boolean;
  fpFormatConfig: FuellingPointFormatConfiguration;
  mapfpAttendValor: Map<number, number>;
  PostIDTPV: number;
  documentFP: Map<number, DocumentLine>;
  isCreditCardPayment: boolean;
  private _pauseRunOnFuellingPointUpdate: boolean;

  public get pauseRunOnFuellingPointUpdate(): boolean {
    return this._pauseRunOnFuellingPointUpdate;
  }

  public set pauseRunOnFuellingPointUpdate(value: boolean) {
    this._pauseRunOnFuellingPointUpdate = value;
  }

  constructor(
    private _fuellingPointsSvc: FuellingPointsService,
    private _internalSvc: FuellingPointsInternalService,
    private _fpSignalR: FuellingPointsSignalrUpdatesService,
    private _auxActionMngr: AuxiliarActionsManagerService,
    private _signalr: SignalRPSSService,
    // private _documentService: DocumentService,
    private _roundPipe: RoundPipe,
    private _cashPaymentService: CashPaymentService,
    private _customerService: CustomerService,
    private _appDataConfig: AppDataConfiguration,
    private _operador: OperatorInternalService,
    private _promotionsService: PromotionsService,
    private _changeDelivered: ChangePaymentInternalService,
    private _languageService: LanguageService,
    private _conf: MinimumNeededConfiguration,
    private _document: DocumentService,
    private _signalrMultitpv: SignalRMultiTPVService,
    private _electronicJournalService: ElectronicJournalService,
    private cardPayment: CreditCardPaymentService,
    private  _logHelper: LogHelper

  ) {
  }


  ngOnInit() {
    this.isTicket = false;
    this.isCreditCardPayment = false;
    this.pauseRunOnFuellingPointUpdate = false;
    this.fpFormatConfig = this._internalSvc.formatConfiguration;
    this.PostIDTPV = parseFloat(this._appDataConfig.userConfiguration.PosId.toString().substring(5));

    // retrieving fp info
    this._subscriptions.push(this._fpSignalR.onAllFuellingPoints()
      .subscribe(data => {
        this.fnLoadfpInformationStatus(data).first().subscribe(
          response => {
              if (response) {
                  data = response;
                  data.forEach(e => {
                  this.getOnAllFPTransactionVirtual(e)
                  .first()
                  .subscribe( x => {
                    this._fuellingPointsSvc.requestSuplyTransactions(e.id)
                    .first()
                    .subscribe(resp => {
                      if (resp.length > 0) {
                        if (this.fpSupplyTransaction) {
                          for (let i = 0; i < resp.length; i++) {
                            this.validateTransactionVirtualAndDoms(resp[i]);
                            this.insertOrUpdateSuply(resp[i]);
                          }
                        } else {
                          this.fpSupplyTransaction = resp;
                        }
                        if (this.fpSupplyTransaction) {
                          this._internalSvc.updateAllSuplyTransactionFromComponent(this.fpSupplyTransaction);
                        }
                      }
                      if (this.fpSupplyTransaction) {
                        if (this.fpSupplyTransaction.filter(spt => spt.isVirtual && spt.fuellingPointId == e.id).length > 0) {
                          this._internalSvc.updateSuplyTransactionsVirtual(e.id);
                        }
                      }
                    });
                  });
                });
                  this.fpInformation = data;
				          this.sendSaleModeAttendAllFuellingPoint();
                  this.setfuellingPointInformation();
              }
          }
        );
      }));

    this._subscriptions.push(this._fpSignalR.onFuellingPointTransactionCountChange()
      .subscribe(eventParam => {
        this.sendSaleModeAttend(eventParam.fuellingPointId, eventParam.listSupplyTransaction);
        this.getSupplyTransactionsVirtual(eventParam.listSupplyTransaction, eventParam.fuellingPointId);
      }));

    // *** VERSIÓN RÉPLICA ***
    // this._fuellingPointsSvc.requestAllSuplyTransactionsAnulated()

    // Cargamos los suministros anulados.
    this._subscriptions.push(this.fnGetAllSuppliesAnulatedByShop().subscribe());

    this._changeDelivered.changedPayment$.subscribe(p => {
      this.isTicket = p.isTicket;
    });

    this._subscriptions.push(this._internalSvc.onAllFuellingPointsFromComponent()
      .subscribe(data => {
        this.fpInformation = data;
      }));

    this._subscriptions.push(this._fpSignalR.onFuellingPointUpdate()
      .subscribe(fp => {
        if (this.pauseRunOnFuellingPointUpdate) {
            return;
        }
        this.onFuellingPointUpdate(fp);
        this.setfuellingPointInformation();
    }));

    this._subscriptions.push(this._internalSvc.onUpdateModeOperationSubject()
      .subscribe(data => {
        try {
          if (data) {
            this.pauseRunOnFuellingPointUpdate = true;
            this._updateFuellingPointOperationMode(data);
            if (this.fpInformation) {
              const fp1 = this.fpInformation.find(x => x.id === data.fuellingPointId);
              fp1.isAttend = data.isAttend;
              fp1.isPreAuthorized = data.isPreAuthorized;
              fp1.posIDTPV = parseInt(data.tpv,0);
              fp1.serviceModeType = data.modeType;
              fp1.hasPostPaidTransaction = data.hasPostPaidTransaction;
              fp1.hasPrePaidTransaction = data.hasPrePaidTransaction;
              fp1.oldServiceModeType = data.modeTypeOld;
              fp1.oldHasPostPaidTransaction = data.hasPostPaidTransactionOld;
              fp1.oldHasPrePaidTransaction = data.hasPrePaidTransactionOld;
              /*if (fp1.hasPostPaidTransaction || fp1.hasPrePaidTransaction) {
                fp1.hasTransactions = true;
              }*/
              this.onFuellingPointUpdate(fp1);
              // const paramrequest = {
              //   fuellingPointId: fp1.id,
              //   transactionCount: -1,
              // };
              // // tslint:disable-next-line:max-line-length
              // if ((fp1.serviceModeType === ServiceModeType.PostPaid && fp1.hasPostPaidTransaction) || (fp1.isPreAuthorized)) {
              //   this._fpSignalR.updateFuellingPointTransactionFromServer(paramrequest);
              // }
            }
          }
          this.pauseRunOnFuellingPointUpdate = false;
        } catch (error) {
          this.pauseRunOnFuellingPointUpdate = false;
        }
      }));
    this._subscriptions.push(this._internalSvc.$updateSuplyTransactionsVirtual.subscribe(resp => {
        if (resp > 0) {
          if (!this.fpSupplyTransaction) {
            this.fpSupplyTransaction = [];
          }
          this.getSupplyTransactionsVirtual(this.fpSupplyTransaction.filter(x => !x.isVirtual), resp);
        }
    }));

    this._subscriptions.push(this._internalSvc.fpSuppliesAnulatedRedSubject$
      .subscribe(data => {
        if (data === true) {
          // Invocar al metodo que obtena las transacciones anuladas y repinte el pump
          this.fnGetAllSuppliesAnulatedByShop().subscribe(response => {
              if (response === true) {
                for (let index = 0; index < this.fpInformation.length; index++) {
                  const pump = this.fpInformation[index];
                  this.fpInformation[index] = this.updateReference(pump);
                }
              }
            });
        }
      }));

      this._subscriptions.push(this._internalSvc.fpStopButton$
        .subscribe(data => {
          if ((data === true) && (this.fpInformation)) {
            this.checkStates();
          }
        }));
      this._subscriptions.push(this._signalrMultitpv.multiTPVInsertDocumentVirtual$.subscribe( (response: any) => {
        if (response) {
          this._document.insertDocumentVirtualAttend(response.id,
          response.currentDocu.lines[0].businessSpecificLineInfo.data.supplyTransaction.serviceModeType,
          JSON.stringify( response.currentDocu),
          response.currentDocu.lines[0].businessSpecificLineInfo.data.supplyTransaction.id )
          .subscribe( (respuesta: any) => {
            if (respuesta.documentJson) {
              if (response.tpv == this.PostIDTPV) {
                const currentDocu = JSON.parse(respuesta.documentJson);
                let idTransaction: any;
                if (currentDocu.lines[0].businessSpecificLineInfo.data.supplyTransaction) {
                  idTransaction =  currentDocu.lines[0].businessSpecificLineInfo.data.supplyTransaction.id;
                }
                currentDocu.lines[0].businessSpecificLineInfo =  undefined;
                currentDocu.emissionLocalDateTime = new Date();
                this._promotionsService.cleanLocalTarif(currentDocu); // Pana - Se limpian las tarifas locales si se han aplicado
                this._promotionsService.calculatePromotions(currentDocu, true)
                .subscribe(
                  calculatePromotionsResponse => {
                    if (calculatePromotionsResponse.status === ResponseStatus.success) {
                      const receivedPromotionsList = calculatePromotionsResponse.object;
                      this._setPromotions(receivedPromotionsList, currentDocu);
                    }
                    this._cashPaymentService.sendSaleAutomatic(currentDocu).subscribe(
                      respon => {
                        if (respon) {
                          const req = { fuellingPointId: response.id,
                            idTransaction,
                            type: 'delete'
                          };
                          this._signalrMultitpv.requestNotifyGenericChangesRed('changeTransactionVirtual', JSON.stringify(req))
                          .subscribe( rs => {
                            if (!rs) {
                              this._document.removeDocumentVirtualById(idTransaction).first().subscribe( (result: any) => {
                                if (result.removeSuccess) {
                                  this._internalSvc.updateSuplyTransactionsVirtual(response.id);
                                }
                              });
                            }
                          });
                        }
                      }
                      , error => {
                        this._logHelper.trace('generateticket - Error en SendSaleAutomatic', error);
                      }
                    );
                    return;
                  },
                  error => {
                    this._logHelper.trace('generateticket  - Error calcular', error);
                  }
                );
              }
            }
          });
        }
      }));

      this._subscriptions.push(this._signalrMultitpv.multiTPVDeleteDocumentVirtual$.subscribe( (response: any) => {
        if (response) {
          this._document.removeDocumentVirtualById(response.idTransaction).first().subscribe( (result: any) => {
            if (result) {
              this._internalSvc.updateSuplyTransactionsVirtual(response.fuellingPointId);
              }
          });
        }
      }));
      this._subscriptions.push(this._signalrMultitpv.multiTPVSetDocumentVirtual$.subscribe( (response: UpdateDocumentVirtualResponse) => {
        if (response) {
          this.setDocumentVirtual(response);
        }
      }));

      this._subscriptions.push(this._fuellingPointsSvc.fpVerifyReconexion$
      .subscribe(response => {
        if (this.fpInformation) {
          for (let index = 0; index < this.fpInformation.length; index++) {
            const pump = this.fpInformation[index];
            pump.isOnline = response;
            this.fpInformation[index] = this.updateReference(pump);
          }
        }
        if (this.fpSupplyTransaction) {
          this._signalrMultitpv.requestNotifyGenericChangesRed('MasterReset')
          .subscribe( resp => {
            if (!resp) {
              this._signalrMultitpv.onMasterResetMultiTpv(true);
              this.fpSupplyTransaction = undefined;
            }
          });
        }
      }));

      this._subscriptions.push(this._signalrMultitpv.multiTPVMasterReset$
        .subscribe( response => {
          this.InsertTrasnactionsVirtualOnMasterReset(this.fpSupplyTransaction.filter(x => !x.isVirtual));
        }));
        this._subscriptions.push(this.cardPayment.$isCreditCardPayment
          .subscribe( respuest => {
            this.isCreditCardPayment = respuest;
        }));
  }

  TransformPostPaidWithTransactionToPreAuthorized(id: number, contTransact: number,
    listSupplyTransaction: SuplyTransaction[]): Observable<FuellingPointInfo> {
    // tslint:disable-next-line: no-unsafe-any
    return Observable.create((observer: Subscriber<FuellingPointInfo>) => {
      const displayPreAut = this._appDataConfig.getConfigurationParameterByName('DISPLAY_MODE_PRE-AUTHORIZED', 'GENERAL');
      let displayValuePreAut: boolean;
      if (displayPreAut == undefined) {
        displayValuePreAut = true;
      }
      else {
        displayValuePreAut = displayPreAut.meaningfulStringValue.toUpperCase() == 'TRUE' ? true : false;
      }
      if (displayValuePreAut) {
        if (this.fpInformation != undefined) {
          const e: FuellingPointInfo = this.fpInformation.find(X => X.id === id);
          if (contTransact > 0) {
            e.hasTransactions = true;
          } else {
            e.hasTransactions = false;
          }
          if (e) {
            if (e.posIDTPV === this.PostIDTPV) {
              if ( (e.hasTransactions && // tiene transaciones
                e.serviceModeType == ServiceModeType.PostPaid && // el modo es postpago
                !e.hasPostPaidTransaction && // tiene transaciones postpago
                !e.isAttend  // no es atendido
                // e.oldServiceModeType != ServiceModeType.PrePaid //el anterior modo es prepago
                && !e.hasPrePaidTransaction && e.mainState == FuellingPointMainStates.Idle)
                || (e.hasTransactions && e.isPreAuthorized && e.mainState == FuellingPointMainStates.Idle)
              ) {
                if (e.serviceModeType == ServiceModeType.PostPaid) {
                  e.oldHasPostPaidTransaction = e.hasPostPaidTransaction,
                  e.hasPostPaidTransaction = true;
                }
                this._fuellingPointsSvc.requestChangeServiceModeMultiTPV(ServiceModeType.PreAuthorized, id,
                  this._conf.POSInformation.code, e.hasPostPaidTransaction, e.hasPrePaidTransaction,
                  e.serviceModeType,
                  e.oldHasPostPaidTransaction,
                  e.oldHasPrePaidTransaction)
                  .first().subscribe(response => {
                    this._signalr.requestChangeServiceMode(ServiceModeType.PreAuthorized, e.id, '')
                      .first().subscribe();
                  });
              } else if (contTransact == 0 && e.hasPostPaidTransaction && e.isPreAuthorized) {
                e.oldHasPostPaidTransaction = e.hasPostPaidTransaction;
                e.hasPostPaidTransaction = false;
                this._fuellingPointsSvc.requestChangeServiceModeMultiTPV(ServiceModeType.PostPaid, id, this._conf.POSInformation.code,
                  e.hasPostPaidTransaction, e.hasPrePaidTransaction,
                  e.serviceModeType,
                  e.oldHasPostPaidTransaction,
                  e.oldHasPrePaidTransaction)
                  .first().subscribe(response => {
                    this._signalr.requestChangeServiceMode(ServiceModeType.PostPaid, e.id, '')
                      .first().subscribe();
                  });
              }
              else if (e.hasTransactions && e.hasPrePaidTransaction && !e.isAttend) {
                // tslint:disable-next-line: max-line-length
                const existPrepaid = listSupplyTransaction.find(x=> (x.fuellingPointId == e.id) && (x.money!=undefined) && (x.fuellingLimitValue!=undefined));
                if (!existPrepaid) {
                  return;
                }
                e.oldHasPrePaidTransaction = e.hasPrePaidTransaction;
                e.hasPrePaidTransaction = false;
                const trxPrepaidInCompleted = listSupplyTransaction.find(x => x.fuellingPointId == e.id
                  && ( (x.fuellingLimitType === 0) ? (x.money != x.fuellingLimitValue) : ( x.money != (x.fuellingLimitValue * x.gradeUnitPrice)) )
                  );
                if (!trxPrepaidInCompleted) {
                  this._fuellingPointsSvc.requestChangeServiceModeMultiTPV(e.oldServiceModeType, id, this._conf.POSInformation.code,
                    e.hasPostPaidTransaction, e.hasPrePaidTransaction,
                    e.serviceModeType,
                    e.oldHasPostPaidTransaction,
                    e.oldHasPrePaidTransaction)
                  .first().subscribe(
                    response => {
                      this._signalr.requestChangeServiceMode(e.oldServiceModeType, e.id, '')
                        .first().subscribe();
                    }
                  );
                } else {
                  if (e.oldServiceModeType == ServiceModeType.PostPaid) {
                                          e.isPreAuthorized = true;
                                          e.hasPostPaidTransaction = true;
                                          this._fuellingPointsSvc.requestChangeServiceModeMultiTPV(ServiceModeType.PreAuthorized, id,
                                            this._conf.POSInformation.code, e.hasPostPaidTransaction, e.hasPrePaidTransaction,
                                            e.serviceModeType,
                                            e.oldHasPostPaidTransaction,
                                            e.oldHasPrePaidTransaction)
                                            .first().subscribe(response => {
                                              this._signalr.requestChangeServiceMode(ServiceModeType.PreAuthorized, e.id, '')
                                                .first().subscribe();
                                            });
                                        } else {
                                            // tslint:disable-next-line:max-line-length
                                            this._fuellingPointsSvc.requestChangeServiceModeMultiTPV(e.oldServiceModeType, id, this._conf.POSInformation.code,
                                              e.hasPostPaidTransaction, e.hasPrePaidTransaction,
                                              e.serviceModeType,
                                              e.oldHasPostPaidTransaction,
                                              e.oldHasPrePaidTransaction)
                                            .first().subscribe(
                                              response => {
                                                this._signalr.requestChangeServiceMode(e.oldServiceModeType, e.id, '')
                                                  .first().subscribe();
                                              }
                                            );
                                        }
                }
              }
              observer.next(e);
             }
           else { observer.next(undefined); }
          }
          else {
            observer.next(undefined);
          }
        }
        else { observer.next(undefined); }
      }
    });
  }
  transformPostPaidToPreauthorizedOnAllFuellingPoint(e: any, contTransact: number) {
    if (contTransact > 0) {
      e.hasTransactions = true;
    } else {
      if (!e.hasTransactions) {
        e.hasTransactions = false;
      }
    }
    if ((e.hasTransactions && e.serviceModeType == ServiceModeType.PostPaid &&
        !e.hasPostPaidTransaction && !e.isAttend && !e.hasPrePaidTransaction) ||
        (e.hasTransactions && e.isPreAuthorized)) {

        if (e.serviceModeType == ServiceModeType.PostPaid) {
            e.oldHasPostPaidTransaction = e.hasPostPaidTransaction;
            e.hasPostPaidTransaction = true;
        }
        e.isPreAuthorized = true;

        this._fuellingPointsSvc.requestChangeServiceModeMultiTPV(ServiceModeType.PreAuthorized, e.id, this._conf.POSInformation.code,
        e.hasPostPaidTransaction, e.hasPrePaidTransaction, e.serviceModeType, e.oldHasPostPaidTransaction, e.oldHasPrePaidTransaction)
        .first()
        .subscribe(responseMultiTpv => {
          this._signalr.requestChangeServiceMode(ServiceModeType.PreAuthorized, e.id, '')
          .first().subscribe();
        });
    } else if (!e.hasTransactions && e.hasPostPaidTransaction && e.isPreAuthorized) {
        e.oldHasPostPaidTransaction = e.hasPostPaidTransaction;
        e.hasPostPaidTransaction = false;
        e.isPreAuthorized = false;

        this._fuellingPointsSvc.requestChangeServiceModeMultiTPV(ServiceModeType.PostPaid, e.id, this._conf.POSInformation.code,
        e.hasPostPaidTransaction, e.hasPrePaidTransaction, e.serviceModeType, e.oldHasPostPaidTransaction, e.oldHasPrePaidTransaction)
        .first()
        .subscribe(responseMultiTpv => {
            this._signalr.requestChangeServiceMode(ServiceModeType.PostPaid, e.id, '')
              .first()
              .subscribe();
          });
     } /*else if (!e.hasTransactions && e.hasPrePaidTransaction && !e.isAttend ) {
        e.oldHasPrePaidTransaction = e.hasPrePaidTransaction,
        e.hasPrePaidTransaction = false;
        this._fuellingPointsSvc.requestChangeServiceModeMultiTPV(e.oldServiceModeType, e.id, this._conf.POSInformation.code,
          e.hasPostPaidTransaction, e.hasPrePaidTransaction,
          e.serviceModeType,
          e.oldHasPostPaidTransaction,
          e.oldHasPrePaidTransaction)
          .first().subscribe(
            response => {
              this._signalr.requestChangeServiceMode(e.oldServiceModeType, e.id, '')
                .first().subscribe();
            }
          );
    }*/
  }

  setFpSuplyTransactionTransactionCountChange(suplyTransaction: Array<SuplyTransaction>, fpid: number) {
    if (this.fpSupplyTransaction) {
      if (this.fpSupplyTransaction.length > 0) {
        const supplys = this.fpSupplyTransaction.filter(x => x.fuellingPointId == fpid);
        if (suplyTransaction) {
          for (let i = 0; i < suplyTransaction.length; i++) {
            if (suplyTransaction.length >= supplys.length) {
              this.insertOrUpdateSuply(suplyTransaction[i]);
            }
          }
          this.deleteSupply(suplyTransaction, fpid);
        }
      } else {
        this.fpSupplyTransaction = suplyTransaction;
      }
    } else {
      this.fpSupplyTransaction = suplyTransaction;
    }
  }
  insertOrUpdateSuply(suplyTransaction: SuplyTransaction) {
    let contador: number = 0;
    for (let n = 0; n < this.fpSupplyTransaction.length; n++) {
      if (this.fpSupplyTransaction[n].id == suplyTransaction.id) {
        this.fpSupplyTransaction[n] = this.updateReference(suplyTransaction);
      } else {
        contador++;
      }
    }
    if (contador == this.fpSupplyTransaction.length) {
      this.fpSupplyTransaction.push(suplyTransaction);
      return;
    }
  }
  deleteSupply(suplyTransaction: Array<SuplyTransaction>, idfp: number) {
    const filteredSupplyTransact = this.fpSupplyTransaction.filter( s => !suplyTransaction.find( t => s.id === t.id));
    filteredSupplyTransact.filter(x => x.fuellingPointId == idfp).forEach( p => {
      const indice = this.fpSupplyTransaction.findIndex(s => s.id == p.id);
      this.fpSupplyTransaction.splice(indice, 1);
    });
  }
  insertSupplyVirtual(currentTransactionDoms: Array<SuplyTransaction>, documento: string, lockingposid: number) {
    try {
      if (!currentTransactionDoms) {
        currentTransactionDoms = [];
      }
      const documentVirtual: any = JSON.parse(documento);
      if (documentVirtual) {
        if (documentVirtual.lines) {
          if (documentVirtual.lines[0].businessSpecificLineInfo) {
            if (documentVirtual.lines[0].businessSpecificLineInfo.data) {
              if (documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction) {
                // tslint:disable-next-line:max-line-length
                documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction.description = documentVirtual.lines[0].description;
                documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction.taxPercentage = documentVirtual.lines[0].taxPercentage;
                documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction.priceWithoutTax = documentVirtual.lines[0].priceWithoutTax;
                documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction.isConsigna = documentVirtual.lines[0].isConsigna;
                documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction.isVirtual = true;
                documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction.typeArticle = documentVirtual.lines[0].typeArticle;
                documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction.originalPriceWithTax = documentVirtual.lines[0].typeArticle;
                const currentSupp: any = documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction;
                if (lockingposid > 0) {
                  currentSupp.lockingPOSId = lockingposid;
                }
                currentTransactionDoms.push(currentSupp);
                for (let i = 0; i < currentTransactionDoms.length; i++) {
                  if (this.fpSupplyTransaction) {
                    this.insertOrUpdateSuply(currentTransactionDoms[i]);
                  } else {
                    this.fpSupplyTransaction = currentTransactionDoms;
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      this._logHelper.trace(error);
    }
  }

  setFpSuplyTransactionsVirtualCountChange(suplyTransaction: Array<SuplyTransaction>, fpid: number) {
    if (suplyTransaction) {
      suplyTransaction.forEach(s => {
        s.isVirtual = true;
      });
    }
    if (this.supplyTransactionsVirtual) {
      if (this.supplyTransactionsVirtual.length > 0) {
        if (suplyTransaction) {
          if (suplyTransaction.length == 0) {
            for (let x = 0; x < this.supplyTransactionsVirtual.length; x++) {
              if (this.supplyTransactionsVirtual[x].fuellingPointId == fpid) {
                this.supplyTransactionsVirtual.splice(x, 1);
              }
            }
            return;
          }
          const val = this.supplyTransactionsVirtual.filter(x => x.fuellingPointId == fpid).length;
          for (let i = 0; i < suplyTransaction.length; i++) {
            if (suplyTransaction.length >= val) {
              this.insertOrUpdatesupplyTransactionsVirtual(suplyTransaction, i);
            }
          }
          this.deletesupplyTransactionsVirtual(suplyTransaction, fpid);
        }
      } else {
        this.supplyTransactionsVirtual = suplyTransaction;
      }
    } else {
      this.supplyTransactionsVirtual = suplyTransaction;
    }
  }
  insertOrUpdatesupplyTransactionsVirtual(suplyTransaction: Array<SuplyTransaction>, i: number) {
    let contador: number = 0;
    for (let n = 0; n < this.supplyTransactionsVirtual.length; n++) {
      if (this.supplyTransactionsVirtual[n].id == suplyTransaction[i].id) {
        this.supplyTransactionsVirtual[n] = this.updateReference(suplyTransaction[i]);
      } else {
        contador++;
      }
    }
    if (contador == this.supplyTransactionsVirtual.length) {
      this.supplyTransactionsVirtual.push(suplyTransaction[i]);
      return;
    }
  }
  deletesupplyTransactionsVirtual(suplyTransaction: Array<SuplyTransaction>, idfp: number) {
      // tslint:disable-next-line:max-line-length
      const filteredSupplyTransaction = this.supplyTransactionsVirtual.filter( s => !suplyTransaction.find( t => s.id === t.id));
      filteredSupplyTransaction.filter(x => x.fuellingPointId == idfp).forEach( p => {
        const indice = this.supplyTransactionsVirtual.findIndex(s => s.id == p.id);
        this.supplyTransactionsVirtual.splice(indice, 1);
      });

  }

  getSupplyTransactionsVirtual(currentDomsList: Array<SuplyTransaction>, fpId: number) {
    this._document.getDocumentsVirtuals(fpId).subscribe(response => {
      if (response) {
        try {
            for (let i = 0; i < response.length; i++) {
              const documentVirtual: any = JSON.parse(response[i].document);
              if (documentVirtual) {
                if (documentVirtual.lines) {
                  if (documentVirtual.lines[0].businessSpecificLineInfo) {
                    if (documentVirtual.lines[0].businessSpecificLineInfo.data) {
                      if (documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction) {
                        documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction.description = documentVirtual.lines[0].description;
                        // tslint:disable-next-line:max-line-length
                        documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction.taxPercentage = documentVirtual.lines[0].taxPercentage;
                        // tslint:disable-next-line:max-line-length
                        documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction.priceWithoutTax = documentVirtual.lines[0].priceWithoutTax;
                        documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction.isConsigna = documentVirtual.lines[0].isConsigna;
                        documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction.typeArticle = documentVirtual.lines[0].typeArticle;
                        // tslint:disable-next-line:max-line-length
                        documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction.originalPriceWithTax = documentVirtual.lines[0].typeArticle;
                        documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction.isVirtual = true;
                        if (!currentDomsList) {
                          currentDomsList = [];
                        }
                        currentDomsList.push(documentVirtual.lines[0].businessSpecificLineInfo.data.supplyTransaction);
                      }
                    }
                  }
                }
              }
            }
            if (currentDomsList) {
              this.setFpSuplyTransactionTransactionCountChange(currentDomsList, fpId);
              this._internalSvc.updateAllSuplyTransactionFromComponent(this.fpSupplyTransaction);
            } else {
              this._internalSvc.updateAllSuplyTransactionFromComponent(this.fpSupplyTransaction);
            }
            let listSuppTrans: any = [];
            if (this.fpSupplyTransaction) {
              listSuppTrans = this.fpSupplyTransaction.filter(x => x.fuellingPointId == fpId);
            }
            this.TransformPostPaidWithTransactionToPreAuthorized(fpId,
              listSuppTrans.length, listSuppTrans).first().subscribe(resp => {
              if (resp) {
                const evParam: FuellingPointTransactionCountChangedArgs = {fuellingPointId: fpId, transactionCount: currentDomsList.length};
                this.onFuellingPointTransactionCountChange(evParam, resp);
              }
            });
        } catch (error) {
          this._logHelper.trace(error);
        }
      }
    });
  }
  ngOnDestroy(): void {
    this._subscriptions.forEach(s => s.unsubscribe());
  }

  fuellingPointSelected(fp: FuellingPointInfo) {
    // Electronic Journal - FuellingPointSelected
    this._electronicJournalService.writeAction({
      type: ActionType.fuellingPointSelected,
      fuellingPointCode: fp.id.toString(),
    });
    // tslint:disable-next-line:max-line-length
    this._auxActionMngr.requestFuellingPointOperations(fp, this.fpInformation, this.fpSupplyTransaction);
  }

  btnStopClick(isStop: boolean) {
    this._fuellingPointsSvc.manageRequestEmergencyStop(isStop)
      .first().subscribe((result => {
        if (result == true) {
          // Electronic Journal - emergencyStop
          this._electronicJournalService.writeAction({
            type: ActionType.emergencyStop,
            genericDetail: isStop == true ? 'All pumps stopped' : 'All pumps resumed',
          });
        }
      }));
  }

  private validateTransactionVirtualAndDoms(fpSupp: SuplyTransaction): boolean {
    const indice = this.fpSupplyTransaction.findIndex( x => x.id == fpSupp.id && x.isVirtual);

    if (indice >= 0) {
      this._document.removeDocumentVirtualById(this.fpSupplyTransaction[indice].id).first().subscribe( (result: any) => {
      });
    }
    return indice >= 0;
  }

  getOnAllFPTransactionVirtual(fp: FuellingPointInfo): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      this._document.getDocumentsVirtuals(fp.id)
      .first()
      .subscribe(response => {
        if (response) {
            for (let i = 0; i < response.length; i++) {
              if (this.PostIDTPV == response[i].lockingposid) {
                const request = { transacctionId: response[i].idTransaction,
                  posIdTpv: 0,
                  type: 'update'
                };
                this._signalrMultitpv.requestNotifyGenericChangesRed('changeTransactionVirtual', JSON.stringify(request)).subscribe();
                response[i].lockingposid = 0;
              }
              if (this.fpSupplyTransaction) {
                // tslint:disable-next-line:max-line-length
                this.insertSupplyVirtual(this.fpSupplyTransaction.filter(x => !x.isVirtual), response[i].document, response[i].lockingposid);
              } else {
                this.insertSupplyVirtual([], response[i].document, response[i].lockingposid);
              }
            }
            let contST: number;
            if (this.fpSupplyTransaction) {
              contST = this.fpSupplyTransaction.filter(x => x.fuellingPointId == fp.id).length;
              this._internalSvc.updateAllSuplyTransactionFromComponent(this.fpSupplyTransaction);
            } else {
              contST = 0;
            }

            if (fp.posIDTPV === this.PostIDTPV) {
              this.transformPostPaidToPreauthorizedOnAllFuellingPoint(fp, contST);
            }
            observer.next(true);
          }
        });
    });
  }

  btnNigthClick(isNight: boolean) {
    this._fuellingPointsSvc.requestChangePetrolStationMode(
      isNight ? PetrolStationMode.Night : PetrolStationMode.Default)
      .first().subscribe(response => {
        // si el cambio es ok, cambiamos el estado del boton.
        if (response) {
          this.btnNightCheckStatus = !this.btnNightCheckStatus;
        }
      });
  }

  btnTransactionsClick() {
    // Electronic Journal - showPendingTransactionsPanel
    this._electronicJournalService.writeAction({
      type: ActionType.showPendingTransactionsPanel,
    });
    this._auxActionMngr.requestWaitingOperations();
  }
  assignValueIsVirtual() {
    if (this.supplyTransactionsVirtual) {
      this.supplyTransactionsVirtual.forEach( x => {
        x.isVirtual = true;
      });
    }
  }
  createRange(index: number, positionNumber: number): Array<boolean> {
    let elements: number = 0;
    if (index == 0) {
      elements = positionNumber;
    } else {
      elements = positionNumber - this.fpInformation[index - 1].positionNumber;
    }

    const ret = new Array<boolean>(elements - 1);
    return ret;
  }

  private onFuellingPointUpdate(fp: FuellingPointInfo) {
    if (this.fpInformation == undefined) {
      return;
    }
    for (let index = 0; index < this.fpInformation.length; index++) {
      const pump = this.fpInformation[index];
      if (pump.id != fp.id) {
        continue;
      }

      fp.hasTransactions = pump.hasTransactions; // salvamos estado anterior, se modifica por otra parte
      fp.hasPostPaidTransaction = pump.hasPostPaidTransaction; // Salvamos el estado de postpago con transacciones
      // fp.hasPrePaidTransaction = pump.hasPrePaidTransaction;
      // angular change detection will trigger and update the pump bounded
      this.fpInformation[index] = this.updateReference(fp);
      this.checkStates();
      break;
    }
  }
  private sendSaleModeAttendAllFuellingPoint() {
    if (this.fpSupplyTransaction) {
      this.fpSupplyTransaction.forEach( rs => {
        const listSupp = this.fpSupplyTransaction.filter( x => x.fuellingPointId == rs.id && !x.isVirtual);
        if (listSupp) {
          this.sendSaleModeAttend(rs.fuellingPointId, listSupp);
        }
      });
    }
  }
  private sendSaleModeAttend(idfp: number, listSupp: Array<SuplyTransaction>) {
    if (this.fpInformation) {
      const fp = this.fpInformation.find(x => x.id == idfp).isAttend;
      if (fp) {
        if (this.PostIDTPV == this.fpInformation.find(x => x.id == idfp).posIDTPV) {
          this.ObtenerCombustible(idfp, listSupp);
        }
      }
    }
  }

  private ObtenerCombustible(id: number, supplyTransaction: Array<SuplyTransaction>) {
    try {
        if (supplyTransaction.length == 0) {
          return;
        }
        if (supplyTransaction[0].fuellingLimitValue > 0) {
          this._logHelper.trace('transaccion prepago.');
        } else {
          if (!supplyTransaction[0].lockingPOSId) {
            this.insertDocumentsVirtual(id, supplyTransaction[0]);
          }
        }
    } catch (error) {
      this._logHelper.trace(error);
    }
  }
  InsertTrasnactionsVirtualOnMasterReset(supplyTransaction: Array<SuplyTransaction>) {
    try {
      if (supplyTransaction.length == 0) {
        return;
      }
      supplyTransaction.forEach(e => {
        if (e.fuellingLimitValue > 0) {
          this._logHelper.trace('transaccion prepago.');
        } else {
          if (!e.lockingPOSId) {
            this.insertDocumentsVirtual(e.fuellingPointId, e, true);
          }
        }
      });
    } catch (error) {
      this._logHelper.trace(error);
    }
  }

  insertDocumentsVirtual(id: number, transaccion: SuplyTransaction, isMasterReset: Boolean = false) {
    const operator: Operator = this._operador.currentOperator == undefined ? undefined : this._operador.currentOperator;
    const currentDocument: any = {
      currencyId: this._appDataConfig.baseCurrency.id,
      customer: undefined,
      emissionLocalDateTime: undefined,
      isatend: this.getLiteral('fuelling_points_component', 'header_FuellingPointAction_Served'),
      lines: [] ,
      operator: operator,
      plate: undefined,
      series: undefined,
      showAlertInsertCustomer: false,
      showAlertInsertOperator: false,
      totalAmountWithTax: 0,
      usedDefaultOperator: false
    };

    this._customerService.getCustomerById(this._appDataConfig.unknownCustomerId)
      .subscribe((customer: Customer) => {
        currentDocument.customer = customer;
        try {
          if (!isMasterReset) {
            this._signalr.lockSupplyTransaction(operator.id,
              customer.id, transaccion.id, transaccion.fuellingPointId).subscribe((respn) => {
                if (respn.status === LockSupplyTransactionStatus.Successful || isMasterReset) {
                    const supplyLineData: FuellingPointSupplyLineData = {
                      fpSvc: undefined,
                      supplyTransaction: transaccion,
                      lineNumberInDocument: 1
                    };
                    const specificLine: FuellingPointSupplyLine = new FuellingPointSupplyLine(supplyLineData);
                    const line: DocumentLine[] = [{
                      businessSpecificLineInfo: specificLine,
                      description: 'S: ' + transaccion.fuellingPointId + ' ' + respn.productName,
                      discountAmountWithTax: respn.discountedAmount,
                      discountPercentage: respn.discountPercentage,
                      originalPriceWithTax: respn.unitaryPricePreDiscount,
                      priceWithTax: respn.unitaryPricePreDiscount,
                      productId: respn.productReference,
                      quantity: respn.correspondingVolume,
                      taxAmount: 0,
                      taxPercentage: respn.taxPercentage,
                      totalAmountWithTax: respn.finalAmount,
                      typeArticle: respn.typeArticle,
                      appliedPromotionList: [],
                      priceWithoutTax: this._roundPipe.transformInBaseCurrency(respn.unitaryPricePreDiscount / (1 + (respn.taxPercentage / 100))),
                      isConsigna: respn.isConsigna,
                      idCategoria: '',
                      nameCategoria: ''
                    }];
                    currentDocument.lines = line;
                    this.GenerarTicket(id, currentDocument);
                }
              });
          } else {
            this._customerService._getProductForSale(transaccion.gradeReference, transaccion.volume, customer)
            .subscribe( (respn: any) => {
              if (respn) {
                  const supplyLineData: FuellingPointSupplyLineData = {
                    fpSvc: undefined, // this._fuellingPointsSvc,
                    supplyTransaction: transaccion,
                    lineNumberInDocument: 1
                  };
                  const specificLine: FuellingPointSupplyLine = new FuellingPointSupplyLine(supplyLineData);
                  const line: DocumentLine[] = [{
                    businessSpecificLineInfo: specificLine,
                    description: 'S: ' + transaccion.fuellingPointId + ' ' + respn.productName,
                    discountAmountWithTax: respn.discountedAmount,
                    discountPercentage: respn.discountPercentage,
                    originalPriceWithTax: respn.unitaryPricePreDiscount,
                    priceWithTax: respn.unitaryPricePreDiscount,
                    productId: respn.productReference,
                    quantity: respn.correspondingVolume,
                    taxAmount: 0,
                    taxPercentage: respn.taxPercentage,
                    totalAmountWithTax: respn.finalAmount,
                    typeArticle: respn.typeArticle,
                    appliedPromotionList: [],
                    priceWithoutTax: this._roundPipe.transformInBaseCurrency(respn.unitaryPricePreDiscount / (1 + (respn.taxPercentage / 100))),
                    isConsigna: respn.isConsigna,
                    idCategoria: '',
                    nameCategoria: ''
                  }];
                  currentDocument.lines = line;
                  this.GenerarTicket(id, currentDocument, isMasterReset);
              }
            });
          }
        } catch (error) {
          this._logHelper.trace(' generateticket - Error en la función lockSupplyTransaction', error);
        }
      }, error => {
        this._logHelper.trace('generateticket - Error en la función getCustomerById', error);
      });
  }

  private onFuellingPointTransactionCountChange(param: FuellingPointTransactionCountChangedArgs, fp: FuellingPointInfo) {
    if (param == undefined) {
      return;
    }
    if (this.fpInformation == undefined) {
      return;
    }

    for (let index = 0; index < this.fpInformation.length; index++) {
      const pump = this.fpInformation[index];
      if (pump.id != param.fuellingPointId) {
        continue;
      }
      if (param.transactionCount != -1) {
        pump.hasTransactions = param.transactionCount > 0;
      }
      if (fp) {
        if (pump.id === fp.id) {
          pump.hasPostPaidTransaction = fp.hasPostPaidTransaction;
          pump.hasPrePaidTransaction = fp.hasPrePaidTransaction;
        }
      }
      // angular change detection will trigger and update the pump bounded
      this.fpInformation[index] = this.updateReference(pump);
      break;
    }
  }

  // should be called after a update in the fpInformation
  private checkStates() {
    let allStoped = true;
    for (let i = 0; i < this.fpInformation.length; i++) {
      const pivote = this.fpInformation[i];
      allStoped = allStoped && pivote.isStopped;
    }
    //this.btnStopCheckStatus = (allStoped) ? (this._operador.fnExistOperatorMultiTpv() ? false : allStoped ) : allStoped ;
    this.btnStopCheckStatus = allStoped;
    this._changeDelivered.fnEstadoParar(this.btnStopCheckStatus);
  }

  // angular change detection for arrays only check reference to fire onChange
  private updateReference<T>(object: T): T {
    return JSON.parse(JSON.stringify(object));
  }


  GenerarTicket(id: number = 0, currentDocu: any, isMasterReset: Boolean = false) {
    const request = { id,
                    currentDocu,
                    idTransaction: currentDocu.lines[0].businessSpecificLineInfo.supplyTransaction.id,
                    tpv: this.PostIDTPV,
                    type: 'insert'
                    };

    this._signalrMultitpv.requestNotifyGenericChangesRed('changeTransactionVirtual', JSON.stringify(request)).subscribe(
      resp => {
        if (resp === undefined) {
          this._document.insertDocumentVirtualAttend(id, currentDocu.lines[0].businessSpecificLineInfo.supplyTransaction.serviceModeType,
          JSON.stringify( currentDocu), currentDocu.lines[0].businessSpecificLineInfo.supplyTransaction.id )
          .subscribe( (respuesta: any) => {
            if (respuesta.documentJson && !isMasterReset) {
              currentDocu.isatend = this.getLiteral('fuelling_points_component', 'header_FuellingPointAction_Served');
              currentDocu = JSON.parse(respuesta.documentJson);
              let idTransaction: any;
              if (currentDocu.lines[0].businessSpecificLineInfo.data.supplyTransaction) {
                idTransaction =  currentDocu.lines[0].businessSpecificLineInfo.data.supplyTransaction.id;
              }
              currentDocu.lines[0].businessSpecificLineInfo =  undefined;
              currentDocu.emissionLocalDateTime = new Date();
              this._promotionsService.cleanLocalTarif(currentDocu); // Pana - Se limpian las tarifas locales si se han aplicado
              this._promotionsService.calculatePromotions(currentDocu, true)
              .subscribe(
                calculatePromotionsResponse => {
                  if (calculatePromotionsResponse.status === ResponseStatus.success) {
                    const receivedPromotionsList = calculatePromotionsResponse.object;
                    this._setPromotions(receivedPromotionsList, currentDocu);
                  }
                  this._cashPaymentService.sendSaleAutomatic(currentDocu).subscribe(
                    respon => {
                      if (respon) {
                        const req = { fuellingPointId: id.toString(),
                          idTransaction,
                          type: 'delete'
                        };
                        this._signalrMultitpv.requestNotifyGenericChangesRed('changeTransactionVirtual', JSON.stringify(req))
                        .subscribe( rs => {
                          if (!rs) {
                            this._document.removeDocumentVirtualById(idTransaction).first().subscribe( (result :any) => {
                              if (result.removeSuccess) {
                                this._internalSvc.updateSuplyTransactionsVirtual(id);
                              }
                            });
                          }
                        });
                      }
                    }
                    , error => {
                      this._logHelper.trace('generateticket - Error en SendSaleAutomatic', error);
                    }
                  );
                  return;
                },
                error => {
                  this._logHelper.trace('generateticket  - Error calcular', error);
                }
              );
            }
          });
        }
      }
    );
      this._signalr.finalizeSupplyTransaction(currentDocu.operator.id,
        currentDocu.lines[0].businessSpecificLineInfo.supplyTransaction.id,
        currentDocu.lines[0].businessSpecificLineInfo.supplyTransaction.fuellingPointId,
        currentDocu.customer.id,
        Guid.newGuid(),
        '123',
        1
    ) .first().subscribe(resp => {
    });
  }
  private _setPromotions(receivedPromotionList: Array<DocumentLinePromotion>, currentDocument: any) {
    let totalDiscountByPromotions: number = 0;
    this._clearPromotions(currentDocument);
    receivedPromotionList.forEach(promotion => {
      if (!currentDocument.lines[promotion.referredLineNumber - 1].appliedPromotionList) {
        currentDocument.lines[promotion.referredLineNumber - 1].appliedPromotionList = [];
      }
      currentDocument.lines[promotion.referredLineNumber - 1].appliedPromotionList.push(promotion);
      totalDiscountByPromotions += promotion.discountAmountWithTax;
    });
    //(`Total descuento aplicado al documento con las promociones: ${totalDiscountByPromotions.toString()}`);
    currentDocument.totalAmountWithTax = this._roundPipe.transformInBaseCurrency(
      currentDocument.totalAmountWithTax - totalDiscountByPromotions
    );
  }
  private _clearPromotions(currentDocument: any) {
    let calculatedTotalAmountWithTax: number = 0;
    if (currentDocument && currentDocument.lines) {
      currentDocument.lines.forEach((line: any) => {
        if (line.appliedPromotionList) {
          line.appliedPromotionList = [];
        }
        if (line.appliedPromotionListHTML) {
          line.appliedPromotionListHTML = [];
        }
        calculatedTotalAmountWithTax += line.totalAmountWithTax;
      });
      currentDocument.totalAmountWithTax = this._roundPipe.transformInBaseCurrency(calculatedTotalAmountWithTax);
    }
  }
  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

  setfuellingPointInformation() {
    this._internalSvc.fpListInternal = this.fpInformation;
  }

  deleteTransactionVirtual( item: SuplyTransaction) {
    const i = this.fpSupplyTransaction.indexOf( item );
    this.fpSupplyTransaction.splice( i, 1 );
  }

  private setDocumentVirtual(response: any) {
    this._document.setDocumentsVirtuals(response.transacctionId, response.posIdTpv).subscribe( respu => {
      if (respu) {
        this.fpSupplyTransaction.filter( x => x.id == response.transacctionId && x.isVirtual).forEach( resp => {
          if (response.posIdTpv != 0) {
            resp.lockingPOSId = response.posIdTpv;
          } else {
            resp.lockingPOSId = undefined;
          }
        });
        this._internalSvc.updateAllSuplyTransactionFromComponent(this.fpSupplyTransaction);
      }
    });
  }
  private _updateFuellingPointOperationMode(param: any) {
    let errorMessage: string = '';
    // tslint:disable-next-line: max-line-length
    this._fuellingPointsSvc.UpdateFuellingPointOperationMode(param.fuellingPointId, param.doms, param.isAttend, param.isPreAuthorized, param.tpv, param.hasPostPaidTransaction, param.hasPrePaidTransaction, param.modeType,param.hasPostPaidTransactionOld, param.hasPrePaidTransactionOld, param.modeTypeOld)
      .first()
      .subscribe(
        (response) => {
          if (!response) {
            errorMessage = 'No se pudo actualizar el modo operacion del fuellingpoint con id'
              + param.fuellingPointId + 'en la base local.';
            throw new Error(errorMessage);
          }
        },
        (error) => {
          errorMessage = 'Error al intentar actualizar modo operacion del fuellingpoint con id'
            + param.fuellingPointId + 'en la base local. ->' + error;
          throw new Error(errorMessage);
        }
      );
  }

  private fnGetAllSuppliesAnulatedByShop(): Observable<boolean> {
      return Observable.create((observer: Subscriber<boolean>) => {
        this._fuellingPointsSvc.GetAllSuppliesAnulatedByShop()
        .first().subscribe(response => {
          Globals.Delete();
          if (response != undefined && response.length > 0) {
            response.forEach(x => {
              const point = Globals.Get().find(s => s.id === x.fuellingPointId);
              if (point !== undefined && point !== null) {
                Globals.Put(x.fuellingPointId, true);
              } else {
                Globals.Set(x.fuellingPointId, true);
              }
            });
          };
          observer.next(true);
        }, error => {
          observer.next(false);
        }
        );
      });
  }

fnLoadfpInformationStatus(fpList: Array<FuellingPointInfo>): Observable<Array<FuellingPointInfo>> {
  // tslint:disable-next-line: no-unsafe-any
  return Observable.create((observer: Subscriber<Array<FuellingPointInfo>>) => {
    this._fuellingPointsSvc.GetAllFuellingPointOperationMode()
      .first()
      .subscribe(
        (response) => {
          if (!response ) {
            observer.next(undefined);
          } else {
              if (fpList) {
                for (let index = 0; index < fpList.length; index++) {
                  const fp1 = response.find(x => x.fuellingPointId === fpList[index].id);
                  if (fp1) {
                    fpList[index].isAttend = fp1.isAttend;
                    fpList[index].isPreAuthorized = fp1.isPreAuthorized;
                    fpList[index].posIDTPV = parseInt(fp1.tpv, 0);
                    fpList[index].serviceModeType = fp1.modeType;
                    fpList[index].hasPostPaidTransaction = fp1.hasPostPaidTransaction;
                    fpList[index].hasPrePaidTransaction = fp1.hasPrePaidTransaction;
                    fpList[index].oldServiceModeType = fp1.modeTypeOld;
                    fpList[index].oldHasPostPaidTransaction = fp1.hasPostPaidTransactionOld;
                    fpList[index].oldHasPrePaidTransaction = fp1.hasPrePaidTransactionOld;
                  }
                }
                observer.next(fpList);
              }
          }
        },
        (error) => {
          observer.next(undefined);
        }
      );
  });
}

}
