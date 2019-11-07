import { Component, OnInit, ViewChild, HostBinding, Input } from '@angular/core';
import { FuellingPointInfo } from 'app/shared/fuelling-point/fuelling-point-info';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { FuellingPointsService } from 'app/services/fuelling-points/fuelling-points.service';
import { MdButtonToggleGroup, MdButtonToggle, MdTabChangeEvent } from '@angular/material';
import { FuellingPointsInternalService } from 'app/services/fuelling-points/fuelling-points-internal.service';
import { Grade } from 'app/shared/fuelling-point/grade';
import { FuellingPointAvailableActionType } from 'app/shared/fuelling-point/signalR-Response/fuelling-point-available-action-type';
import { IDictionaryStringKey } from 'app/shared/idictionary';
import { FuellingPointFormatConfiguration } from 'app/shared/fuelling-point/fuelling-point-format-configuration';
import { ServiceModeType } from 'app/shared/fuelling-point/service-mode-type.enum';
import { FuellingPointMainStates } from 'app/shared/fuelling-point/fuelling-point-main-states.enum';
import { FuellingLimit } from 'app/shared/fuelling-point/fuelling-limit';
import { FuellingLimitType } from 'app/shared/fuelling-point/fuelling-limit-type.enum';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Subscription } from 'rxjs/Subscription';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { ChangePaymentInternalService } from 'app/services/payments/change-payment-internal.service';
import { GradePrepay } from 'app/shared/fuelling-point/grade-prepay/grade-prepay';
import { LanguageService } from 'app/services/language/language.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
import { OperatorService } from 'app/services/operator/operator.service';
import { OperatorInternalService } from 'app/services/operator/operator-internal.service';
import { SuplyTransactionType } from 'app/shared/fuelling-point/suply-transaction-type.enum';
import { SignalRMultiTPVService } from 'app/services/signalr/signalr-multitpv.service';
import { isNullOrUndefined } from 'util';
import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';
import { LogHelper } from 'app/helpers/log-helper';

interface ActionButton {
  class: string;
  text: string;
  actionClick: Function;
  identifier: number;
}
@Component({
  selector: 'tpv-fuelling-points-auxiliar-actions',
  templateUrl: './fuelling-points-auxiliar-actions.component.html',
  styleUrls: ['./fuelling-points-auxiliar-actions.component.scss']
})
export class FuellingPointAuxiliarActionsComponent implements OnInit, OnDestroy, IActionFinalizable<boolean> {
  @HostBinding('class') class = 'tpv-fuelling-points-auxiliar';
  @ViewChild('groupMode') modeSelector: MdButtonToggleGroup;
  @ViewChild('groupFuelProducts') fuelProductSelector: MdButtonToggleGroup;
  @Input() fpInformation: Array<FuellingPointInfo>;

  private _onFuellingPointAuxiliarActionsComplete: Subject<boolean> = new Subject();
  private _subscriptions: Subscription[] = [];
  private _posCode: number;

  // sirve para bloquear multiples request (click repetido)
  private _requestPending = false;
  private fuellingPointActive: Array<FuellingPointInfo> = [];
  private fuellingPointOrigen: FuellingPointInfo;
  textFuellingActives: string;
  // cantidad monetaria para input 'otro'
  otherAmmount: number;
  // cantidad volumen para input 'otro'
  otherVolume: number;
  // receives the actions for the fuellingPoint
  availableActions: Array<FuellingPointAvailableActionType>;
  // configuracion de formatos
  formatConfig: FuellingPointFormatConfiguration;
  fuellingPointInfo: FuellingPointInfo;
  headerStopActions: ActionButton;
  fuellingHeaderActions: Array<ActionButton>;
  fuellingBottomActions: Array<ActionButton>;
  FuellingLength: number;
  contadorFinSubmenu = 4;
  contadorIniSubmenu = 0;
  // texto que se muestra para informar de error, o sobre bloqueo del tpv
  textInformation: string;
  canChooseFuel: boolean;
  // operaciones pendientes
  supplyTransactions: Array<SuplyTransaction> = [];
  supplyTransactionsAnulated: Array<SuplyTransaction>;
  supplyTransactionVirtual: Array<SuplyTransaction> = [];
  isSalePrepago: boolean;
  valIntro: number;
  ListadoGradesPrepay: GradePrepay[] = [];
  tabTipo: string;
  limitType?: FuellingLimitType;
  fuellingLimit: FuellingLimit = {
    type: 0,
    value: 0
  };
  btnStopDisabled: boolean = true;
  displayValuePreAut: boolean = true;
  displayValueAttend: boolean = true;
  isEnabledBottom: boolean = false;
  // control de mostrar la tela para bloquear controles y el spinner de cargando
  showLoading: boolean;
  // id tpv
  posIdTpv: number;

  constructor(
    private _fpSvc: FuellingPointsService,
    private _fpInternalSvc: FuellingPointsInternalService,
    private _appDataConfig: AppDataConfiguration,
    private _changeDelivered: ChangePaymentInternalService,
    private _languageService: LanguageService,
    private _statusBarService: StatusBarService,
    private _conf: MinimumNeededConfiguration,
    private _operatorService: OperatorService,
    private _operatorInternalSvc:  OperatorInternalService,
    private _multiTpvSvc: SignalRMultiTPVService,
    private _electronicJournal: ElectronicJournalService,
    private  _logHelper: LogHelper
  ) {
    this.headerStopActions = {actionClick: () => this.stopFuellingPoint(),
                              text: this.getLiteral('fuelling_points_auxiliar_actions_component',
                               'availableActions_FuellingPointAction_Parar').toUpperCase(),
                              class: '', 
                              identifier: FuellingPointAvailableActionType.StopPump};
    const configGradesPrepay = this._appDataConfig.getConfigurationParameterByName('LIST_OF_GRADES_PREPAY', 'GENERAL');
    if (configGradesPrepay != undefined) {
      this.ListadoGradesPrepay = JSON.parse(configGradesPrepay.meaningfulStringValue);
    }
  }

  set fuellingPoint(fuellingPoint: FuellingPointInfo) {
    if (fuellingPoint == undefined) {
      this._logHelper.trace('fuelling point recibido en fp auxiliar actions component es undefined');
      return;
    }
    this.fuellingPointInfo = fuellingPoint;

    this.FuellingLength = this.fuellingPointInfo.availableGradeList.length;
    // retrieve pump info from server
    this._requestAvailableActions();
    // this._requestSupplyTransactions();
    this._requestSupplyTransactionsAnuletd();
  }
  set supplyTransaction (ST: Array<SuplyTransaction>) {
    if (ST == undefined) {
      this._logHelper.trace('fuelling point recibido en fp auxiliar actions component es undefined');
      return;
    }
    const trans = ST.filter(x => x.fuellingPointId == this.fuellingPointInfo.id && !x.isVirtual);
    if (trans) {
        this.supplyTransactions = trans;
    }
    const transVirtual = ST.filter(x => x.fuellingPointId == this.fuellingPointInfo.id && x.isVirtual == true);
    if (transVirtual) {
        this.supplyTransactionVirtual = transVirtual;
    }
  }

  onFinish() {
    return this._onFuellingPointAuxiliarActionsComplete.asObservable();
  }

  forceFinish() {
    this._onFuellingPointAuxiliarActionsComplete.next(false);
  }

  closePumpAuxiliar(response: boolean) {
    this._onFuellingPointAuxiliarActionsComplete.next(response);
  }

  ngOnInit() {
    this.showLoading = false;
    this.limitType = FuellingLimitType.Monetary;
    this.isSalePrepago = false;
    this.formatConfig = this._fpInternalSvc.formatConfiguration;
    this._posCode = this._fpInternalSvc.ownForecourtPOSId;
    this.posIdTpv = parseFloat(this._appDataConfig.userConfiguration.PosId.toString().substring(5));

    // visualizacion de modos atendido y preauthorizado
    if (this._appDataConfig) {
      const displayPreAut = this._appDataConfig.getConfigurationParameterByName('DISPLAY_MODE_PRE-AUTHORIZED', 'GENERAL');
      const displayAtend = this._appDataConfig.getConfigurationParameterByName('DISPLAY_MODE_ATENDIDO', 'GENERAL');
      // visualizar modo preauthorizado
      if (displayPreAut == undefined ) {
        this.displayValuePreAut = true;
      }
      else {
        this.displayValuePreAut = displayPreAut.meaningfulStringValue.toUpperCase() == 'TRUE' ? true : false;
      }
      // visualizar modo atendido
      if (displayAtend == undefined ) {
        this.displayValueAttend = true;
      }
      else {
        this.displayValueAttend = displayAtend.meaningfulStringValue.toUpperCase() == 'TRUE' ? true : false;
      }
    }
    this._subscriptions.push(this._fpInternalSvc.onAllSuplyTransactionFromComponent()
      .subscribe(data => {
       /* const trans = data.filter(x => !x.isVirtual);
        if (trans) {*/
            this.supplyTransaction = data;
        /*}*/
        /*const transVirtual = data.filter(x => x.isVirtual == true);
        if (transVirtual) {
            this.supplyTransactionVirtual = transVirtual;
        }*/
        this._requestSupplyTransactionsAnuletd();
    }));
    this._subscriptions.push(this._fpInternalSvc.onFuellingPointFromComponent()
      .subscribe(response => {
        if (this.fuellingPointInfo.id == response.id) {
          this.fuellingPointInfo = response;
        }
    }));
    this._subscriptions.push(this._changeDelivered.FuellingLimitResponse$.subscribe(d => {
      this.ReturnAceptar(d);
    }));
    this._subscriptions.push(this._fpInternalSvc.clickSuplyTransactionFromComponent().subscribe( response => {
      this._onFuellingPointAuxiliarActionsComplete.next(response);
    }));

    this._subscriptions.push(this._operatorService.escucharOperador().subscribe(
      data => {
        this._multiTpvSvc.requestOperatorChangedRedTPV(this._conf.POSInformation.code, undefined).first()
        .subscribe( response => {
          const bExistOperator = this._operatorService.fnExistOperatorMultiTpv();
          if (bExistOperator == false) {
             this.btnStopDisabled = !bExistOperator;
             this._fpSvc.emergencyStop().first().subscribe();
          }
        });
      }));

    this._subscriptions.push(this._operatorService.escucharOperadorAcept().subscribe(
      data => {
        this._multiTpvSvc.requestOperatorChangedRedTPV(this._conf.POSInformation.code,
          this._operatorInternalSvc.currentOperator.id).first()
        .subscribe( response => {
          const bExistOperator = this._operatorService.fnExistOperatorMultiTpv();
          if (bExistOperator == true) {
            if (this.btnStopDisabled == bExistOperator) {
                this.btnStopDisabled = !bExistOperator; // false
                this._fpSvc.cancelEmergencyStop().first().subscribe();
            }
          }
        });
      }));


      if (this._operatorInternalSvc.currentOperator) {
        this.btnStopDisabled = false;
      } else {
        this.btnStopDisabled = true;
      }
  }

  ngOnDestroy() {
    this._subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Recupera la imagen en base 64 del grado
   * @param idGrade id del grado
   */
  getImgFromGrade(idGrade: number): string {
    return this._fpInternalSvc.getImgFromGrade(idGrade);
  }

  getImgFromGradeByName(idGrade: number): string {
    let path = 'assets/images/grades/';
    try {
      const productReference: string = this._fpInternalSvc.getProductReferenceFromByGradeId(idGrade);
      // tslint:disable-next-line:radix
      const productId = parseInt(productReference.substring(5));
      if (this.ListadoGradesPrepay.length > 0) {
        const grade = this.ListadoGradesPrepay.find(x => x.codGrade == productId);
        if (grade != undefined) {
          return path += grade.nameGrade;
        }
      }
    } catch (error) {
      this._logHelper.trace(error);
      return '';
    }
    return '';
  }

  /**
   * Maneja el evento de introducir una cantidad en el panel, ya sea autorizar o limitar
   * @param quantity cantidad introducida
   */
  btnAmountClick(quantity: number) {
    if (quantity <= 0) {
      return;
    }
    this.fuellingLimit.value = quantity;
    this._changeDelivered.fnFuellingLimit(this.fuellingLimit);
  }

  /**
   * Maneja el evento de introducir un volumen en el panel
   * @param quantity cantidad en volumen introducida
   */
  btnVolumeClick(quantity: number) {
    if (quantity <= 0) { return; }
    this.fuellingLimit.value = quantity;
    this._changeDelivered.fnFuellingLimit(this.fuellingLimit);
  }

  /**
   * Obtiene un json valido para ngClass para establecer estilo de cabecera
  */
  setClassHeader(): IDictionaryStringKey<boolean> {
    return this._fpInternalSvc.getNgClassBackGroundColor(this.fuellingPointInfo);
  }

  /**
   * Obtiene json valido para ngClass para establecer estilo de la operacion en espera
   * @param operation transaccion en espera
   */
  setClassSupplyTransaction(operation: SuplyTransaction, isLockingposId: boolean = false): IDictionaryStringKey<boolean> {
    return this._fpInternalSvc.getNgClassSupplyTransactionBackground(operation, isLockingposId);
  }
  setClassSupplyTransactionVirtual(operation: SuplyTransaction): IDictionaryStringKey<boolean> {
    if (operation.lockingPOSId) {
      return this.buildJsonNgClass('transactionLocked');
    }
    return this._fpInternalSvc.getNgClassSupplyTransactionBackground(operation);;
  }

  /** establece el texto del modo de servicio*/
  textServiceMode(): string {
    switch (this.fuellingPointInfo.serviceModeType) {
      case ServiceModeType.PrePaid:
        return this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_Prepay');
      case ServiceModeType.PostPaid:
        return this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_Pospay');
      case ServiceModeType.AttendPaid:
        return this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_Served');
      case ServiceModeType.PreAuthorized:
        return this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_PreAuthorized');
      default:
        return this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_ModeNotManaged');
    }
  }

  /** establece el tecto segun el estado */
  textStatus(): string {
    // Actualizar botones de acuerdo a service mode y estado del doms
    this.updateButtonsAccordingToDoms();

    if (this.fuellingPointInfo.isStopped) {
      return this.getLiteral('fuelling_points_auxiliar_actions_component', 'headerStatus_FuellingPointAction_Stopped');
    }
    if (this.fuellingPointInfo.isInErrorState) {
      this.textInformation = this.getLiteral('fuelling_points_auxiliar_actions_component',
        'panelMessage_fuellingPointAction_FullingPointNotAvailable_DueToError');
      return this._languageService.getLiteral('fuelling_points_auxiliar_actions_component', 'headerStatus_FuellingPointAction_Error');
    }
    if (!this.fuellingPointInfo.hasFreeBuffer) {
      return this.getLiteral('fuelling_points_auxiliar_actions_component', 'headerStatus_FuellingPointAction_Completed');
    }
    if (!this.fuellingPointInfo.isOnline) {
      return this.getLiteral('fuelling_points_auxiliar_actions_component', 'headerStatus_FuellingPointAction_Offline');
    }
    if (this.fuellingPointInfo.mainState == FuellingPointMainStates.Unavailable) {
      this.textInformation = this.getLiteral('fuelling_points_auxiliar_actions_component',
        'panelMessage_fuellingPointAction_FullingPointNotAvailable');
      return this.getLiteral('fuelling_points_auxiliar_actions_component', 'headerStatus_FuellingPointAction_NotAvailable');
    }
    return undefined;
  }

  updateButtonsAccordingToDoms() {
    if (!this.fuellingPointInfo.isStopped) {
      if ( this.headerStopActions.identifier !=  FuellingPointAvailableActionType.StopPump) {
        this.headerStopActions = {
          actionClick: () => this.stopFuellingPoint(),
          text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'availableActions_FuellingPointAction_Parar'),
          class: ` col-xs-12`,
          identifier: FuellingPointAvailableActionType.StopPump
        };
      }
    }
    if (this.fuellingPointInfo.isStopped) {
      if ( this.headerStopActions.identifier !=  FuellingPointAvailableActionType.ResumePump) {
        this.headerStopActions = {
          actionClick: () => this.resumeFuellingPoint(),
          text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'availableActions_FuellingPointAction_Resume'),
          class: ` col-xs-12`,
          identifier: FuellingPointAvailableActionType.ResumePump
        };
      }
    }
    const serviceMode = this.validateServiceModeMissing(this.fuellingPointInfo.serviceModeType);
    if (serviceMode) {
      if (this.fuellingPointInfo.serviceModeType == ServiceModeType.PostPaid) {
        this.fuellingHeaderActions = [];
        this.addActionHeaderPostPaid();
      }
      if (this.fuellingPointInfo.serviceModeType == ServiceModeType.PrePaid) {
        this.fuellingHeaderActions = [];
        this.addActionHeaderPrepaid();
      }
      if (this.fuellingPointInfo.serviceModeType == ServiceModeType.AttendPaid) {
        this.fuellingHeaderActions = [];
        this.addActionHeaderAttendPaid();
      }
      if (this.fuellingPointInfo.serviceModeType == ServiceModeType.PreAuthorized) {
        this.fuellingHeaderActions = [];
        this.addActionHeaderPreAuthorized();
      }
      if (this.availableActions.find(x => x == FuellingPointAvailableActionType.CancelPrepay) != undefined) {
        if (this._posCode == this.fuellingPointInfo.lockingPOSId) {
          this.addActionHeader({
            actionClick: () => this.getListTransferSalePrepay(this.fuellingPointInfo.id),
            text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'availableActions_FuellingPointAction_Transfer'),
            class: ` col-xs-${12 / 2}`,
            identifier: 99
          });
        }
      }
    }
  }

  /**
   * Hace que un boton MdButtonToggle pueda ser deseleccionable
   * @param param boton pulsado
   */
  onClickButtonToggle(param: MdButtonToggle) {
    if (this.isPermitedChangedMode(this.fuellingPointInfo, ServiceModeType.PrePaid)) {
    // Se agrega validación en caso este levantada la manguera
    if (this.fuellingPointInfo.mainState == FuellingPointMainStates.Calling || this.fuellingPointInfo.mainState == FuellingPointMainStates.Starting) {
      this._statusBarService.publishMessage(this.getLiteral('fuelling_points_auxiliar_actions_component',
       'fuelling_Point_raised-hose_NotCompletedPrepay'));
      return;
    }
      this.isSalePrepago = true;
      if (param == param.buttonToggleGroup.selected) {
        // quita la seleccion
        param.buttonToggleGroup.selected = undefined;
        this.isSalePrepago = false;
      }
    } else {
      this._statusBarService.publishMessage(this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_NotPermited'));
    }
  }

  /**
   * Maneja el evento click en una operacion en espera
   * @param transaction operacion en espera
   */
  onClickSupplyTransaction(transaction: SuplyTransaction) {
    if (this._requestPending) {
      return;
    }
    this._requestPending = true;
    this.showLoading = true;
    // Electronic Journal - fuelTransactionSelected
    this._electronicJournal.writeAction({
      type: ActionType.fuelTransactionSelected,
      fuellingPointCode: this.fuellingPointInfo.id.toString(),
      amount: transaction.money.toString(),
      quantity: transaction.volume.toString(),
    });

    this._fpSvc.manageSupplyTransaccion(transaction)
    .first().subscribe(response => {
      this._requestPending = false;
      this.showLoading = false;
      if (!response) {
        this._statusBarService.publishMessage(this.getLiteral('fuelling_points_auxiliar_actions_component', 'fuelNotMatchConfigured'));
        return;
      }
      else {
        this.supplyTransactions.filter(x => x.id == transaction.id).forEach( r => {
          r.lockingPOSId = this._posCode;
        });
          this.validarCierreComponent(response);
      }
    });
  }

  /**
   * Maneja el evento click en una operacion en espera para transacciones virtuales
   * @param transaction operacion en espera
   */
  onClickSupplyTransactionVirtual(transaction: SuplyTransaction) {
    if (this._requestPending || transaction.lockingPOSId) {
      return;
    }
    this._requestPending = true;
    transaction.isVirtual = true;
    const request = { transacctionId: transaction.id,
      posIdTpv: this.posIdTpv,
      type: 'update'
    };

    this._multiTpvSvc.requestNotifyGenericChangesRed('changeTransactionVirtual', JSON.stringify(request))
    .subscribe(respuesta => {
      if (!respuesta) {
        this._multiTpvSvc.setDocumentVirtualMultiTpv(request);
      }
    });
    this._fpSvc.manageSupplyTransaccionVirtual(transaction).subscribe( res => {
      if (res) {
        this._requestPending = false;
        this.supplyTransactionVirtual.filter(x => x.id == transaction.id).forEach( r => {
          r.lockingPOSId = this.posIdTpv;
        });
        this.validarCierreComponent(true);
      }
    });
  }
  /**
   * Maneja el evento click en una operacion en espera para la anulación
   * @param transaction operacion en espera
   */
  onClickSupplyTransactionAnulated(transaction: SuplyTransaction, estado: any) {

    if (this._requestPending) {
      return;
    }

    if (this._fpSvc.getIdCustomer == undefined) {
      this._statusBarService.publishMessage(this.getLiteral('fuelling_points_auxiliar_actions_component', 'transactionAnulated_enterCustomer'));
      return;
    }

    this.ValidarBloquearSumiAnul(transaction).first().subscribe(responseValidar => {

    if (responseValidar == true) {
      if (estado.transactionLocked == undefined || estado.transactionLocked != true) {
        this._requestPending = true;
        this._fpSvc.manageSupplyTransaccionAnulated(transaction)
          .first().subscribe(response => {
            this._requestPending = false;
            this.supplyTransactionsAnulated.filter(x => x.id == transaction.id).forEach( r => {
              r.lockingPOSId = this._posCode;
            });
            this.validarCierreComponent(response, 0);
          });
        }
      } else {
        this._statusBarService.publishMessage(this.getLiteral('fuelling_points_auxiliar_actions_component', 'ValidarBloquearSumiAnul_supplyBlocked'));
      }

    });

  }


  private ValidarBloquearSumiAnul(transaction: SuplyTransaction): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      this._fpSvc.GetAllSuppliesAnulatedByShop()
        .first().subscribe(response => {
          if (!this.supplyTransactionsAnulated.find(x => x.id == transaction.id).enticket) {
            if (response != undefined && response.length > 0) {
              this._logHelper.trace('Transacciones pendientes');
              this._logHelper.trace(response);
              this.supplyTransactionsAnulated = response.filter(a => a.fuellingPointId == this.fuellingPointInfo.id);
              this.EstadoSumiAnulColor(this.supplyTransactionsAnulated);

              let valido: boolean = false;
              this.supplyTransactionsAnulated.forEach(supply => {
                if (supply.id == transaction.id && supply.enticket == false) {
                  valido = true;
                }
              });

              if (valido) {
                const listaIdSumiAnul: number[] = [];
                listaIdSumiAnul.push(transaction.id);
                if (this.supplyTransactionsAnulated.find(x => x.id == transaction.id)) {
                  this.supplyTransactionsAnulated.find(x => x.id == transaction.id).enticket = true;
                }

                this._fpSvc.UpdateSupplyAnulatedEnTicket(listaIdSumiAnul, true)
                  .first().subscribe(responseUpdate => {
                    if (responseUpdate != undefined && responseUpdate == true) {
                      observer.next(true);
                    }
                  });
              }
              else {
                observer.next(false);
              }
            }
          }
        },
          error => {
            this.supplyTransactionsAnulated = undefined;
            observer.next(false);
          }
        );
    });

  }


  /** 'Abre' el surtidor para la siguiente operacion en postPago*/
  /*private prepareNextOperationPostPay() {
    this._fpSvc.prepareForPostpaidOperation(this.fuellingPointInfo.id)
      .first().subscribe(response => {
        this._onFuellingPointAuxiliarActionsComplete.next(response);
      });
  }*/

  /** Cancela la 'apertura' para la siguiente operacion en postPago (vuelve a prepago)*/
  /*
  private cancelNextPostPay() {
    this._fpSvc.cancelLockingOfFuellingPoint(this.fuellingPointInfo.id)
      .first().subscribe(response => {
        this._onFuellingPointAuxiliarActionsComplete.next(response);
      });
  }
  */

  /** Parada de emergencia del surtidor*/
  private stopFuellingPoint() {
    this._fpSvc.manageRequestEmergencyStop(true, this.fuellingPointInfo.id)
      .first().subscribe(response => {
        if (response) {
         // this._onFuellingPointAuxiliarActionsComplete.next(response);
        }
      },
        error => this._onFuellingPointAuxiliarActionsComplete.next(false));
  }

  /** Cancelacion de parada de emergencia*/
  private resumeFuellingPoint() {
    this._fpSvc.manageRequestEmergencyStop(false, this.fuellingPointInfo.id)
      .first().subscribe(response => {
        if (response) {
         // this._onFuellingPointAuxiliarActionsComplete.next(response);
        }
      },
        error => { this._onFuellingPointAuxiliarActionsComplete.next(false); });
  }

  /** Cambia el modo de servicio post/pre pago*/
  private changeMode(targetMode: ServiceModeType) {
    if (this.fuellingPointInfo.limitValue == undefined
      || this.fuellingPointInfo.limitValue == 0
      || this.fuellingPointInfo.serviceModeType != ServiceModeType.PrePaid) {
      // this.fuellingPointInfo.serviceModeType = targetMode;
      if (this.isPermitedChangedMode(this.fuellingPointInfo, targetMode)) {

        this._fpSvc.requestChangeServiceModeMultiTPV(targetMode, this.fuellingPointInfo.id,
          this._conf.POSInformation.code, false, false,
          this.fuellingPointInfo.serviceModeType,
          this.fuellingPointInfo.hasPostPaidTransaction,
          this.fuellingPointInfo.hasPrePaidTransaction
        )
          .first().subscribe(responsemultiTpv => {
            this._fpSvc.requestChangeServiceMode(targetMode, this.fuellingPointInfo.id)
              .first().subscribe(response => {
                this._fpInternalSvc.updateSuplyTransactionsVirtual(this.fuellingPointInfo.id);
              });
          });
        this.fuellingPointInfo.serviceModeType = targetMode;
      } else {
        this._statusBarService.publishMessage(this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_NotPermited'));
      }

    }
  }

  /** Transferencia de ventas prepago a otro surtidor*/
  private getListTransferSalePrepay(id: number) {
    const currentFp: Array<FuellingPointInfo> = this.fpInformation;
    this.fuellingPointActive = [];
    this.textInformation = '';
    this.supplyTransactions = [];

    if (currentFp != undefined) {
      const currentGradeId = currentFp.find(x => x.id == id).limitGradeId;
      currentFp.forEach(fp => {
        if (fp.id == id) {
          this.fuellingPointOrigen = fp;
        } else {
          if (fp.mainState == FuellingPointMainStates.Idle || fp.mainState == FuellingPointMainStates.Starting) {
            if (fp.availableGradeList.find(x => x.id == currentGradeId)) {
              this.fuellingPointActive.push(fp);
            }
          }
        }
      });
      if (this.fuellingPointActive.length == 0) {
        this.textInformation = 'No se encontraron surtidores disponibles para transferir';
      } else {
        this.textFuellingActives = 'Surtidores disponibles';

        this.fuellingPointActive.forEach(element => {
          element.limitProductUnitaryPrice = this.fuellingPointOrigen.limitProductUnitaryPrice;
          element.limitProductReference = this.fuellingPointOrigen.limitProductReference;
          element.limitGradeId = this.fuellingPointOrigen.limitGradeId;
          element.limitType = this.fuellingPointOrigen.limitType;
          element.limitValue = this.fuellingPointOrigen.limitValue;
          element.idfpTransferOrigen = this.fuellingPointOrigen.id;
        });
      }

    }

  }
  /**
   * Establece las acciones para el surtidor
   * @param actions Array con acciones disponibles para el surtidor
   */
  private onAvailableActions(actions: FuellingPointAvailableActionType[]) {
    this.availableActions = actions;
   /* if (actions.find(x => x == FuellingPointAvailableActionType.ChangeOperationModeToPrepaid) != undefined) {
      this.addActionHeader({
        actionClick: () => this.changeMode(ServiceModeType.PrePaid),
        text: 'Cambiar',
        class: ''
      });
    }
    if (actions.find(x => x == FuellingPointAvailableActionType.ChangeOperationModeToPostpaid) != undefined) {
      this.addActionHeader({
        actionClick: () => this.changeMode(ServiceModeType.PostPaid),
        text: 'Cambiar',
        class: ''
      });
    }*/
    if (this.fuellingPointInfo.serviceModeType == ServiceModeType.PrePaid) {
      this.addActionHeaderPrepaid();
    }
    if (this.fuellingPointInfo.serviceModeType == ServiceModeType.PostPaid) {
      this.addActionHeaderPostPaid();
    }
    if (this.fuellingPointInfo.serviceModeType == ServiceModeType.AttendPaid) {
      this.addActionHeaderAttendPaid();
    }
    if (this.fuellingPointInfo.serviceModeType == ServiceModeType.PreAuthorized) {
      this.addActionHeaderPreAuthorized();
    }
    // tslint:disable-next-line:max-line-length
    /*if (actions.find(x => x == FuellingPointAvailableActionType.ServiceModePostPayment) != undefined && this.fuellingPointInfo.serviceModeType != ServiceModeType.PreAuthorized && this.fuellingPointInfo.serviceModeType != ServiceModeType.AttendPaid) {
      this.addActionHeader({
        actionClick: () => this.prepareNextOperationPostPay(),
        text: 'Abrir',
        class: ''
      });
    }*/
    // tslint:disable-next-line:max-line-length
    /*
    if (actions.find(x => x == FuellingPointAvailableActionType.ServiceModePrePayment) != undefined && this.fuellingPointInfo.serviceModeType != ServiceModeType.PreAuthorized && this.fuellingPointInfo.serviceModeType != ServiceModeType.AttendPaid) {
      this.addActionHeader({
        actionClick: () => this.cancelNextPostPay(),
        text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'availableActions_FuellingPointAction_BackToPrepay'),
        class: 'longTextButton',
        identifier: FuellingPointAvailableActionType.ServiceModePrePayment
      });
    }
    */
    
    if (actions.find(x => x == FuellingPointAvailableActionType.CancelPrepay) != undefined) {
      if (this._posCode == this.fuellingPointInfo.lockingPOSId) {
        this.addActionHeader({
          actionClick: () => this.getListTransferSalePrepay(this.fuellingPointInfo.id),
          text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'availableActions_FuellingPointAction_Transfer'),
          class: ` col-xs-${12 / 2}`,
          identifier: 99
        });
      }
    }
    if (actions.find(x => x == FuellingPointAvailableActionType.UndoPreset) != undefined) {
      if (this._posCode == this.fuellingPointInfo.lockingPOSId) {
        this.textInformation = this.getLiteral('fuelling_points_auxiliar_actions_component',
          'panelMessage_fuellingPointAction_FullingPointAuthorizedByThisPOS');
      } else {
        const lockingPOSId = this._fpInternalSvc.getPOSId(this.fuellingPointInfo.lockingPOSId);
        this.textInformation = lockingPOSId == undefined ? 'Este surtidor está autorizado por un TPV desconocido'
          : + ' ' +
          this.getLiteral('fuelling_points_auxiliar_actions_component',
            'panelMessage_fuellingPointAction_FullingPointAuthorizedByKnownPOS') + lockingPOSId;
      }
      this.addActionBottom({
        actionClick: () => this.undoPreset(),
        class: '',
        text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'bottomButton_FuellingPointAction_CancelAutorizhation'),
        identifier: FuellingPointAvailableActionType.UndoPreset
      });
    }
    if (actions.find(x => x == FuellingPointAvailableActionType.CancelPrepay) != undefined) {
      if (this._posCode == this.fuellingPointInfo.lockingPOSId) {
        this.textInformation = this.getLiteral('fuelling_points_auxiliar_actions_component',
          'panelMessage_fuellingPointAction_FullingPointAuthorizedByThisPOS');
      } else {
        const lockingPOSId = this._fpInternalSvc.getPOSId(this.fuellingPointInfo.lockingPOSId);
        this.textInformation = lockingPOSId == undefined ? 'Este surtidor está autorizado por un TPV desconocido'
          : + ' ' +
          this.getLiteral('fuelling_points_auxiliar_actions_component',
            'panelMessage_fuellingPointAction_FullingPointAuthorizedByKnownPOS') + lockingPOSId;
      }
      this.addActionBottom({
        actionClick: () => this.cancelPrepay(),
        class: '',
        text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'bottomButton_FuellingPointAction_CancelAutorizhation'),
        identifier: FuellingPointAvailableActionType.CancelPrepay
      });
    }
    if (actions.find(x => x == FuellingPointAvailableActionType.UnlockFuellingPoint) != undefined) {
      if (this._posCode == this.fuellingPointInfo.lockingPOSId) {
        this.textInformation = this.getLiteral('fuelling_points_auxiliar_actions_component',
          'panelMessage_fuellingPointAction_FullingPointLockedByThisPOS');
      } else {
        const lockingPOSId = this._fpInternalSvc.getPOSId(this.fuellingPointInfo.lockingPOSId);
        this.textInformation = lockingPOSId == undefined ? 'Este surtidor se encuentra bloqueado por un TPV desconocido'
          : + ' ' +
          this.getLiteral('fuelling_points_auxiliar_actions_component', 'panelMessage_fuellingPointAction_FullingPointLockByOtherPOS') + lockingPOSId;

        // this.addActionBottom({
        //   actionClick: () => this.unlockFuellingPoint(),
        //   class: '',
        //   text: 'Desbloquear surtidor'
        // });

      }
    }
    this.canChooseFuel = actions.find(x => x == FuellingPointAvailableActionType.ChooseFuel) != undefined;
  }
  addActionHeaderPrepaid() {
    if (this.displayValueAttend) {
      this.addActionHeader({
        actionClick: () => this.changeMode(ServiceModeType.AttendPaid),
        text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_Served'),
        class: ` col-xs-${12 / 2}`,
        identifier: ServiceModeType.AttendPaid
      });
    }
    this.addActionHeader({
        actionClick: () => this.changeMode(ServiceModeType.PostPaid),
        text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_Pospay'),
        class: ` col-xs-${12 / 2}`,
        identifier: ServiceModeType.PostPaid
    });
    if (this.displayValuePreAut) {
      this.addActionHeader({
        actionClick: () => this.changeMode(ServiceModeType.PreAuthorized),
        text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_PreAuthorized'),
        class: ` col-xs-${12 / 2}`,
        identifier: ServiceModeType.PreAuthorized
      });
    }
  }

  addActionHeaderPostPaid() {
    this.addActionHeader({
      actionClick: () => this.changeMode(ServiceModeType.PrePaid),
      text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_Prepay'),
      class: ` col-xs-${12 / 2}`,
      identifier: ServiceModeType.PrePaid
    });
    if (this.displayValueAttend) {
      this.addActionHeader({
          actionClick: () => this.changeMode(ServiceModeType.AttendPaid),
          text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_Served'),
          class: ` col-xs-${12 / 2}`,
          identifier: ServiceModeType.AttendPaid
      });
    }
    if (this.displayValuePreAut) {
      this.addActionHeader({
        actionClick: () => this.changeMode(ServiceModeType.PreAuthorized),
        text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_PreAuthorized'),
        class: ` col-xs-${12 / 2}`,
        identifier: ServiceModeType.PreAuthorized
      });
    }
  }

  addActionHeaderAttendPaid() {
    this.addActionHeader({
      actionClick: () => this.changeMode(ServiceModeType.PostPaid),
      text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_Pospay'),
      class: ` col-xs-${12 / 2}`,
      identifier: ServiceModeType.PostPaid
    });
    this.addActionHeader({
        actionClick: () => this.changeMode(ServiceModeType.PrePaid),
        text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_Prepay'),
        class: ` col-xs-${12 / 2}`,
        identifier: ServiceModeType.PrePaid
    });
    if (this.displayValuePreAut) {
      this.addActionHeader({
        actionClick: () => this.changeMode(ServiceModeType.PreAuthorized),
        text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_PreAuthorized'),
        class: ` col-xs-${12 / 2}`,
        identifier: ServiceModeType.PreAuthorized
      });
    }
  }

  addActionHeaderPreAuthorized() {
    this.addActionHeader({
      actionClick: () => this.changeMode(ServiceModeType.PostPaid),
      text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_Pospay'),
      class: ` col-xs-${12 / 2}`,
      identifier: ServiceModeType.PostPaid
    });
    this.addActionHeader({
        actionClick: () => this.changeMode(ServiceModeType.PrePaid),
        text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_Prepay'),
        class: ` col-xs-${12 / 2}`,
        identifier: ServiceModeType.PrePaid
    });
    if (this.displayValueAttend) {
      this.addActionHeader({
        actionClick: () => this.changeMode(ServiceModeType.AttendPaid),
        text: this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_Served'),
        class: ` col-xs-${12 / 2}`,
        identifier: ServiceModeType.AttendPaid
      });
    }
  }
  /** service mode missing */
  private validateServiceModeMissing(currentMode: ServiceModeType): boolean {
    const headerAction = this.fuellingHeaderActions.filter(x => x.identifier == currentMode);
    return headerAction.length > 0 ? true : false;
  }

  /** Cancela un preset hecho en el surtidor*/
  private undoPreset() {

    this._fpSvc.manageRequestCancelPreset(this.fuellingPointInfo.id)
      .first().subscribe(response => {
        this._onFuellingPointAuxiliarActionsComplete.next(response);
      },
        error => {
          this._onFuellingPointAuxiliarActionsComplete.next(false);
        });
  }
  /** Cancela un prepago hecho en el surtidor*/
  private cancelPrepay() {
    this.showLoading = true;
        this._fpSvc.manageRequestCancelPrepay(this.fuellingPointInfo.id)
          .first().subscribe(response => {
            if (response === true) {
              this._fpSvc.requestChangeServiceModeMultiTPV(this.fuellingPointInfo.oldServiceModeType, this.fuellingPointInfo.id,
                this._conf.POSInformation.code, this.fuellingPointInfo.oldHasPostPaidTransaction, this.fuellingPointInfo.oldHasPrePaidTransaction,
                this.fuellingPointInfo.serviceModeType, this.fuellingPointInfo.hasPostPaidTransaction, this.fuellingPointInfo.hasPrePaidTransaction)
                .first().subscribe();
            }
            this.showLoading = false;
            this._onFuellingPointAuxiliarActionsComplete.next(response);
          },
            error => {
              this._onFuellingPointAuxiliarActionsComplete.next(false);
              this.showLoading = false;
            });
  }

  validarCierreComponent(response: any, tipo: number = 1) {

    if (tipo == 0) {
      let transAnul = 0;
      if (this.supplyTransactionsAnulated) {
        transAnul = this.supplyTransactionsAnulated.filter(x => x.lockingPOSId == undefined).length;
      }
      if (transAnul == 0) {
        this._onFuellingPointAuxiliarActionsComplete.next(response);
      }
    } else {
      let trans = 0;
      let transVir = 0;

      if (this.supplyTransactions) {
        trans = this.supplyTransactions.filter(x => x.lockingPOSId == undefined).length;
      }
      if (this.supplyTransactionVirtual) {
        transVir = this.supplyTransactionVirtual.filter(x => x.lockingPOSId == undefined).length;
      }

      if (trans == 0 && transVir == 0) {
        this._onFuellingPointAuxiliarActionsComplete.next(response);
      }
    }
  }

  setClassButtonNew(val: string): IDictionaryStringKey<boolean> {
    const texto = val.toUpperCase();
    if (texto == 'POSPAGO') { return this.buildJsonNgClass('mat-free'); }
    else if (texto == 'PREPAGO' || texto == 'VOLVER A PREPAGO') { return this.buildJsonNgClass('mat-prepay'); }
    else if (texto == 'ATENDIDO') { return this.buildJsonNgClass('mat-atend'); }
    else if (texto == 'PRE AUTORIZADO') { return this.buildJsonNgClass('mat-preauthorized'); }
    else if (texto == 'TRANSFERIR') { return this.buildJsonNgClass('mat-transfer'); }
    else if (texto == 'REANUDAR' || texto == 'PARAR') { return this.buildJsonNgClass('mat-stop'); }
    else if (texto == 'ABRIR') { return this.buildJsonNgClass('mat-abrir'); }
    else { return this.buildJsonNgClass('mat-default'); }
  }

  setClassButtonMinimal(val: string): IDictionaryStringKey<boolean> {
    if (val != '') {
      const texto = val.toUpperCase();
      if (texto == 'PARAR' || texto == 'REANUDAR') {
        return this.buildJsonNgClass('mat-stop');
      }
    }
    return this.buildJsonNgClass('mat-normal');
  }

  private buildJsonNgClass(key: string, check = true): IDictionaryStringKey<boolean> {
    const ret: IDictionaryStringKey<boolean> = {};
    ret[key] = check;
    return ret;
  }

  /** Cancela una reserva del surtidor*/
  // private unlockFuellingPoint() {
  //   this._fpSvc.cancelLockingOfFuellingPoint(this.fuellingPointInfo.id)
  //     .first().subscribe(response => {
  //       this._onFuellingPointAuxiliarActionsComplete.next(response);
  //     });
  // }

  /** indica si se ha seleccionado el modo autorizar */
  private isAutorizeModeSelected(): boolean {
    switch (this.modeSelector.value) {
      case 'authorize':
        return true;
      case 'prepay':
        return false;
      default:
        this._logHelper.trace('Se ha modificado el valor del selector de modo ilegalmente');
        return undefined;
    }
  }

  /**
   * Introduce una accion en la cabecera
   * @param actionHeader action a introducir
   */
  private addActionHeader(actionHeader: ActionButton) {
    if (this.fuellingHeaderActions == undefined) {
      this.fuellingHeaderActions = [];
    }
    this.fuellingHeaderActions.push(actionHeader);
  }

  /**
   * Introduce una accion en el pie
   * @param actionHeader action a introducir
   */
  private addActionBottom(actionBottom: ActionButton) {
    if (this.fuellingBottomActions == undefined) {
      this.fuellingBottomActions = [];
    }
    this.fuellingBottomActions.push(actionBottom);
  }

  /**
   * Prepara una operacion en prepago y la introduce en el ticket
   * @param limit limite del prepago
   * @param product grado seleccionado
   */
  private requestPreparePrepaidOperation(limit: FuellingLimit, product: Grade) {
    if (this._requestPending || limit.value == undefined) {
      return;
    }
    this._requestPending = true;
    this._fpSvc.requestChangeServiceModeMultiTPV(ServiceModeType.PrePaid, this.fuellingPointInfo.id,
      this._conf.POSInformation.code, false, true,
      this.fuellingPointInfo.hasPostPaidTransaction ? this.fuellingPointInfo.oldServiceModeType : this.fuellingPointInfo.serviceModeType,
      // tslint:disable-next-line: max-line-length
      this.fuellingPointInfo.hasPostPaidTransaction ? this.fuellingPointInfo.oldHasPostPaidTransaction : this.fuellingPointInfo.hasPostPaidTransaction,
      this.fuellingPointInfo.hasPostPaidTransaction ? this.fuellingPointInfo.oldHasPrePaidTransaction : this.fuellingPointInfo.hasPrePaidTransaction)
      .first().subscribe(responseMulti => {
        this._fpSvc.preparePrepaidOperation(this.fuellingPointInfo.id, product.id, limit)
          .first()
          .subscribe(response => {
            this._logHelper.trace('Venta PREPAGO preparada');
            this._logHelper.trace(response);
            this._requestPending = false;
            this._fpSvc.managePrepaidOperationPrepared(response);
            this._onFuellingPointAuxiliarActionsComplete.next(true);
          },
            error => {
              this._requestPending = false;
              this._fpSvc.requestChangeServiceModeMultiTPV(this.fuellingPointInfo.oldServiceModeType, this.fuellingPointInfo.id,
                this._conf.POSInformation.code, this.fuellingPointInfo.oldHasPostPaidTransaction, this.fuellingPointInfo.oldHasPrePaidTransaction,
                this.fuellingPointInfo.serviceModeType, this.fuellingPointInfo.hasPostPaidTransaction, this.fuellingPointInfo.hasPrePaidTransaction)
                .first().subscribe(responseMultiTPV => { });
              this._statusBarService.publishMessage('Error al Preparar Venta Prepago');
              this._onFuellingPointAuxiliarActionsComplete.next(false);
            });
      });
  }

  /**
   * Prepara una operacion Preset
   * @param limit limite del preset
   * @param product grado seleccionado
   */
  private requestPreparePreset(limit: FuellingLimit, product: Grade) {
    if (this._requestPending) {
      return;
    }
    this._requestPending = true;
    this._fpSvc.preparePresetOperation(this.fuellingPointInfo.id, product.id, limit)
      .first().subscribe(response => {
        this._requestPending = false;
        this._onFuellingPointAuxiliarActionsComplete.next(response);
      },
        error => {
          this._requestPending = false;
          this._onFuellingPointAuxiliarActionsComplete.next(false);
        });
  }

  /** Inicia una peticion para recuperar las acciones disponibles en el surtidor*/
  private _requestAvailableActions() {
    this._fpSvc.requestAvailableActions(this.fuellingPointInfo.id)
      .first().subscribe(response => {
        this._logHelper.trace('available actions received:');
        this._logHelper.trace(response);
        this.onAvailableActions(response);
      },
        error => { this._onFuellingPointAuxiliarActionsComplete.next(false); });

  }

  /** Inicia una peticion para recuperar las operaciones pendientes del surtidor*/
 /* private _requestSupplyTransactions() {
    this._fpSvc.requestSuplyTransactions(this.fuellingPointInfo.id)
      .first().subscribe(response => {
        if (response != undefined && response.length > 0) {
          this._logHelper.trace('Transacciones pendientes');
          this._logHelper.trace(response);
          this.supplyTransactions = response;
        }
      },
        error => this.supplyTransactions = undefined);
  }*/

  /** Inicia una peticion para recuperar las operaciones pendientes del surtidor*/
  private _requestSupplyTransactionsAnuletd() {
    // ***VERSIÓN RÉPLICA ***
    // this._fpSvc.requestSuplyTransactionsAnulated(this.fuellingPointInfo.id)

    this._fpSvc.GetAllSuppliesAnulatedByShop()
      .first().subscribe(response => {
        if (response != undefined && response.length > 0) {
          this._logHelper.trace('Transacciones pendientes');
          this._logHelper.trace(response);
          this.supplyTransactionsAnulated = response.filter(a => a.fuellingPointId == this.fuellingPointInfo.id);
          this.EstadoSumiAnulColor(this.supplyTransactionsAnulated);
        }
      },
        error => this.supplyTransactionsAnulated = undefined);
  }

  EstadoSumiAnulColor(listaSumiAnul: SuplyTransaction[]) {

    listaSumiAnul.forEach(sumiAnul => {
      if (sumiAnul.enticket == true) {
        // Lo ponemos como transacción bloqueada.
        sumiAnul.type = 1;
      }
    });

  }

  ReturnAceptar(val: FuellingLimit) {
    const product: Grade = this.fuelProductSelector.value;
    const limit: FuellingLimit = {
      type: val.type,
      value: val.value
    };
    const isAutorizeModeSelected = this.isAutorizeModeSelected();
    if (isAutorizeModeSelected == undefined) {
      return;
    }
    isAutorizeModeSelected ?
      this.requestPreparePreset(limit, product) :
      this.requestPreparePrepaidOperation(limit, product);
  }
  customerSelectionPageSelected(ev: MdTabChangeEvent) {
    if (ev.index == 0) {
      this.fuellingLimit.type = FuellingLimitType.Monetary;
      this.fuellingLimit.value = 0;
    }
    if (ev.index == 1) {
      this.fuellingLimit.type = FuellingLimitType.Volume;
      this.fuellingLimit.value = 0;
    }
    this._changeDelivered.fnFuellingLimit(this.fuellingLimit);

  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

  isblockPointsDisabled(nIdentif: number): boolean {
    let blockMode: number = 1;
    let listMode: string = '';

    const configblockMode = this._appDataConfig.getConfigurationParameterByName('BLOCKED_MODE_DOMS', 'TPV');
    const listblockMode = this._appDataConfig.getConfigurationParameterByName('LIST_OF_MODE', 'TPV');

    if (configblockMode != undefined) {
      blockMode = parseInt(configblockMode.meaningfulStringValue);
    }
    if (listblockMode != undefined) {
      listMode = listblockMode.meaningfulStringValue.toString();
    }

    if (blockMode == 1) {
      if (listMode.indexOf(nIdentif.toString()) >= 0) {
        jQuery('#doms' + nIdentif).css('color', '#222222');
        return true;
      }
      else {
        jQuery('#doms' + nIdentif).css('color', '#FFFFFF');
        return false;
      }
    } else {
      jQuery('#doms' + nIdentif).css('color', '#FFFFFF');
      return false;
    }
  }
  isPermitedChangedMode(fuellingPointInfo: FuellingPointInfo, targetMode: ServiceModeType): boolean {
    let isPermited: boolean = true;
    if (this._fpInternalSvc.fpListInternal) {
      const fpCurrent: FuellingPointInfo = this._fpInternalSvc.fpListInternal.find(x => x.id == this.fuellingPointInfo.id);
      if (fpCurrent) {
        if (fpCurrent.mainState == FuellingPointMainStates.Fuelling) {
          return false;
        }
      }
    }

    if ((fuellingPointInfo.hasPostPaidTransaction === true) && (fuellingPointInfo.isPreAuthorized)) {
      if (targetMode == ServiceModeType.PrePaid) {
        return true;
      }
      isPermited = false;
    }
    // (fuellingPointInfo.serviceModeType === ServiceModeType.PreAuthorized )
    return isPermited;
  }

  cantidadCurrentOptions() {
    return isNullOrUndefined(this.fuellingPointInfo) ? 0 : this.fuellingPointInfo.availableGradeList.length;

  }
  actualiza_Menu(tipo: string) {
    if (tipo == '+') {
      if (this.contadorFinSubmenu <= this.cantidadCurrentOptions()) {
        this.contadorIniSubmenu = this.contadorFinSubmenu;
        this.contadorFinSubmenu = this.contadorFinSubmenu + 4;
      }
    } else {
      if (this.contadorIniSubmenu == 4) {
        this.contadorIniSubmenu = 0;
        this.contadorFinSubmenu = this.contadorFinSubmenu - 4;
      } else {
        this.contadorIniSubmenu = this.contadorIniSubmenu - 4;
        this.contadorFinSubmenu = this.contadorFinSubmenu - 4;
      }
    }
  }
  ListFuelling() {
    return isNullOrUndefined(this.fuellingPointInfo) ? undefined :
      this.fuellingPointInfo.availableGradeList.slice(this.contadorIniSubmenu, this.contadorFinSubmenu);
  }

  fnVerifyLiteralSupply(): string {
    let strLiteral: string = '';
    if (this.supplyTransactions) {
      if (this.supplyTransactions.length > 0 || this.supplyTransactionVirtual.length > 0) {
        // tslint:disable-next-line: max-line-length
        const stDevolucion = this.supplyTransactions.find( X => X.type === SuplyTransactionType.PrepaidParcialLockedByOwnPOS || X.type === SuplyTransactionType.PrepaidParcialLockedByOtherPOS);
        // tslint:disable-next-line: max-line-length
        const stPendient = this.supplyTransactions.find( X => X.type !== SuplyTransactionType.PrepaidParcialLockedByOwnPOS &&  X.type !== SuplyTransactionType.PrepaidParcialLockedByOtherPOS );
        // tslint:disable-next-line: max-line-length
        const stPendientVirtual = this.supplyTransactionVirtual.find( X => X.type !== SuplyTransactionType.PrepaidParcialLockedByOwnPOS &&  X.type !== SuplyTransactionType.PrepaidParcialLockedByOtherPOS );
        if (stDevolucion && (stPendient || stPendientVirtual)) {
          // tslint:disable-next-line: max-line-length
          strLiteral = this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_PendientReturn') + '/' + this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_PendentofPay');
        }
        else if (stPendient || stPendientVirtual) {
          strLiteral = this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_PendentofPay');
        }
        else if (stDevolucion) {
          strLiteral = this.getLiteral('fuelling_points_auxiliar_actions_component', 'header_FuellingPointAction_PendientReturn');
        }
      }
      else {
        strLiteral = '';
      }
    }
    else {
      strLiteral = '';
    }
    return strLiteral;
  }

}
