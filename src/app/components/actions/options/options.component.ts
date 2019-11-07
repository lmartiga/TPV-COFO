import { FuellingPointsService } from 'app/services/fuelling-points/fuelling-points.service';
import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, Output, Input } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { CashboxClosureInternalService } from 'app/services/cashbox-closure/cashbox-closure-internal.service';
import { CashEntryInternalService } from 'app/services/cash/cash-entry-internal.service';
import { CashOutInternalService } from 'app/services/cash/cash-out-internal.service';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { AuxiliarActionsManagerService } from 'app/services/auxiliar-actions/auxiliar-actions-manager.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { CollectionsInternalService } from 'app/services/collections/collections-internal.service';
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
import { DynamicActionLaunchDisplayItem } from 'app/shared/dynamic-actions/dynamic-action-launch-display-item';
import { InternalActionKeys } from 'app/shared/internal-action-key';
import { DynamicActionType } from 'app/shared/dynamic-actions/dynamic-action-type';
import { DynamicAction } from 'app/shared/dynamic-actions/dynamic-action';
import { TpvMainService } from 'app/services/tpv/tpv-main.service';
import { FuellingPointTestInternalService } from 'app/services/fuelling-points/fuelling-point-test-internal.service';
import { BusinessType } from 'app/shared/business-type.enum';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { FuellingPointSupplyLine } from 'app/shared/fuelling-point/fuelling-point-supply-line';
import { RunawayPaymentInternalService } from 'app/services/payments/runaway-payment-internal.service';
import { TpvStatusCheckerService } from 'app/services/tpv-status-checker.service';
import { EventEmitter } from 'events';
import {
  CashboxClosureInternalServiceOffline
} from 'app/src/custom/services/cashbox-closure-offline-services/cashbox-closure-internal-offline.service';
import { CashOutInternalServiceOffline } from 'app/src/custom/services/cash-offline-services/cash-out-internal-offline.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
// import { SignalRPrintingService } from 'app/services/signalr/signalr-printing.service';
import {
  SendCommandToPrinterResponse
} from 'app/shared/signalr-server-responses/printingModuleHub/send-command-to-printer-response';
import {
  SendCommandToPrinterResponseStatuses
} from 'app/shared/signalr-server-responses/printingModuleHub/send-command-to-printer-response-statuses.enum';
import { LogHelper } from 'app/helpers/log-helper';
import { SignalRTMEService } from 'app/services/signalr/signalr-tme.service';
import { isNullOrUndefined } from 'util';
import { DocumentService } from '../../../services/document/document.service';
import { LanguageService } from 'app/services/language/language.service';
import { HttpService } from 'app/services/http/http.service';
import { BrowserKey } from 'app/shared/BrowserKey';
import { OperatorService } from 'app/services/operator/operator.service';
import { GradesChangePricesInternalService } from 'app/services/grades-change-price/grades-change-prices-internal.service';
import { CashboxClosureService } from 'app/services/cashbox-closure/cashbox-closure.service';
import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';
import { DocumentLine } from 'app/shared/document/document-line';
import { PrintingService } from 'app/services/printing/printing.service';
import { TMEApplicationInitResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-application-init-response-statuses.enum';

@Component({
  selector: 'tpv-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss']
})
export class OptionsComponent implements OnInit, AfterViewInit, OnDestroy {

  @Output() onComplete = new EventEmitter();
  @Input() showSearchResult: boolean;
  @Input() pluOptions: Array<DynamicActionLaunchDisplayItem>;

  CurrentOpcion: string = '';
  /*contadorFinArticulos = 12;
  contadorIniArticulos = 0;
  contadorFinCategoria = 7;
  contadorIniCategoria = 0; */

  contadorFinSubmenu = 11;
  contadorIniSubmenu = 0;
  contadorFinOptions = 7;
  contadorIniOptions = 0;
  contadorOpcionesMenu = 0;

  currentPluOptions: DynamicActionLaunchDisplayItem;

  maxReintentosTME = 0;
  intentoTME = 0;

  private _items: DynamicActionLaunchDisplayItem[];
  private _actions: DynamicAction[];

  private _showCashboxClosureSubscription: Subscription;
  private _showFuellingPointTestSubscription: Subscription;
  clasificatedItems: DynamicActionLaunchDisplayItem[][];
  documents: Array<Document> = [];
  private messageconfirmCloseApp = this.getLiteral('options_components', 'message_options_messageconfirmCloseApp');
  // Literales
  acceptLiteral: string;
  fuellingPointTestNotAllowedHeaderLiteral: string;
  fuellingPointTestNotAllowedDueToNotCompatibleSupplyLineLiteral: string;
  fuellingPointTestNotAllowedDueToNotCompatibleDocumentLiteral: string;
  ExisteArticuloTienda: string;
  mensaje: string;
  time: string;
  printLastTicket: Document;
  private settingsLossesHeaderLiteral = this.getLiteral('options_components', 'settingsLosses_HeaderLiteral');

  constructor(
    private _elRef: ElementRef,
    private _auxActionsManager: AuxiliarActionsManagerService,
    private _documentInternalService: DocumentInternalService,
    private _cashboxClosureInternalService: CashboxClosureInternalService,
    private _cashEntryInternalService: CashEntryInternalService,
    private _cashOutInternalService: CashOutInternalService,
    private _cashboxClosureInternalServiceOffline: CashboxClosureInternalServiceOffline,
    private _cashOutInternalServiceOffline: CashOutInternalServiceOffline,
    private _statusBarService: StatusBarService,
    private _collectionsInternalService: CollectionsInternalService,
    private _tpvMainService: TpvMainService,
    private _config: MinimumNeededConfiguration,
    private _FuellingPointTestInternalService: FuellingPointTestInternalService,
    private _confirmActionService: ConfirmActionService,
    private _runawayPaymentInternal: RunawayPaymentInternalService,
    public _tipoComponenteCons: TpvStatusCheckerService,
    private _appDataConfiguration: AppDataConfiguration,
    // private _printService: SignalRPrintingService,
    private _printService: PrintingService,
    private _signalRTMEService: SignalRTMEService,
    private _documentService: DocumentService,
    private _confirmActionSvc: ConfirmActionService,
    private _languageService: LanguageService,
    private _http: HttpService,
    private _operatorService: OperatorService,
    private _fpSvc: FuellingPointsService,
    private _gradesChangePricesInternalService: GradesChangePricesInternalService,
    private _cashBoxServices: CashboxClosureService,
    private _electronicJournal: ElectronicJournalService,
    private _logHelper: LogHelper,
  ) {
    this.acceptLiteral = this.getLiteral('common', 'aceptar');
    this.fuellingPointTestNotAllowedHeaderLiteral = this.getLiteral('options_components', 'calibration_not_allowed');
    this.fuellingPointTestNotAllowedDueToNotCompatibleSupplyLineLiteral = this.getLiteral('options_components',
      'ticket_Not_have_PostPay_Supply');
    this.fuellingPointTestNotAllowedDueToNotCompatibleDocumentLiteral
      = this.getLiteral('options_components', 'ticket_only_must_have_PostPay_Supply');
    this.ExisteArticuloTienda = this.getLiteral('options_components', 'exist_article');
  }

  ngOnInit() {
    // se guardan los items que estan destinados a opciones
    this._items = this._config.dynamicActionItemList.filter((item) => {
      return item.location === 'options';
    });


    this._clasifyItems();

    this._actions = this._config.dynamicActionFunctionalityList;

    const maxReintentosTMEConf = this._appDataConfiguration.getConfigurationParameterByName('MAX_REINTENTOS_CONEXION_TME', 'GENERAL');
    if (maxReintentosTMEConf != undefined) {
      this.maxReintentosTME = parseInt(maxReintentosTMEConf.meaningfulStringValue, 0);
    }
    this._cashBoxServices.CierreCajaSubject$.subscribe((dato: Boolean) => {
      if (dato) {
        this.intentoTME = 0;
      }
    });
  }

  ngAfterViewInit() {
    this._elRef.nativeElement.classList.add('tpv-options');
  }

  ngOnDestroy() {
    // Se libera la subscripción de solicitud de datos en la apertura del panel
    this._showCashboxClosureSubscription.unsubscribe();
    this._showFuellingPointTestSubscription.unsubscribe();
  }

  onClick(item: DynamicActionLaunchDisplayItem, ind: number) {
     // Electronic Journal - buttonInOtherOptionsClicked
     this._electronicJournal.writeAction({
      type: ActionType.buttonInOtherOptionsClicked,
      buttonCaption: item.caption,
    });
    
    const action = this._actions.find((accion) => {
      return item.actionId == accion.id;
    });
    /*
    // TODO: REVISIÓN ESTATUS CONEXION.
    // Comprobación. Estado del tpv es conectado online*/

    switch (action.action) {
      case InternalActionKeys.closeCashbox:
        this.showCashboxClosure();
        break;
      case InternalActionKeys.cashboxEntry:
        this.showCashEntry();
        break;
      case InternalActionKeys.cashboxOut:
        this.showCashOut();
        break;
      case InternalActionKeys.documentCancellation:
        this.cancelDocument();
        break;
      case InternalActionKeys.documentCopy:
        this.copyDocument();
        break;
      case InternalActionKeys.pendingPaymentCollection:
        this.collectDebt();
        break;
      case InternalActionKeys.runawayCollection:
        this.collectRunaway();
        break;
      case InternalActionKeys.runaway:
        this.finishDocumentWithRunaway();
        break;
      case InternalActionKeys.fuellingPointTest:
        this.fuellingPointTest();
        break;
      case InternalActionKeys.openCashDrawer:
        this.openCashDrawer();
        break;
      case InternalActionKeys.anulacionParcial:
        this.AnularParcialDocument();
        break;
      case InternalActionKeys.deudasCliente:
        this.deudasCliente();
        break;
      case InternalActionKeys.abrirCajon:
        this._documentService.btnOpenCashDrawer();
        break;
      case InternalActionKeys.closeApp:
        this.closeApp();
        break;
      case InternalActionKeys.informeVentas:
        this.InformeVentas();
        break;
      case InternalActionKeys.gradesChangePrices:
        this.gradesChangePrices();
        break;
      case InternalActionKeys.copyLastTicket:
        this.copyLastTicket();
        break;
      default:
        if (action.actionType === DynamicActionType.ExternalAction) {
          if (this._tipoComponenteCons.tipoConectado) {
            if (action.action.includes('TPVMerma')) {
              if (this.settingsLosses()) {
                if (this.mostrarMensaje()) {
                  this.openIframe(action.action);
                }
                else {
                  this._confirmActionService.promptActionConfirm(
                    this.mensaje,
                    this.acceptLiteral,
                    undefined,
                    this.settingsLossesHeaderLiteral,
                    ConfirmActionType.Error
                  );
                }
              }
            } else if (action.action.includes('TPVClosingCash') && !this._signalRTMEService.getStatusConnection()
              && this.intentoTME < this.maxReintentosTME) {
              // if (this.tmeConnectionStatus != ConnectionStatus.connected && this.intentoTME < this.maxReintentosTME) {
              this._confirmActionService.promptActionConfirm(
                this.getLiteral('cashbox_closure_component', 'reconnect_TME'),
                this.getLiteral('options_components', 'confirmActionSvc.Yes'),
                this.getLiteral('options_components', 'confirmActionSvc.No'),
                this.getLiteral('options_components', 'confirmActionSvc.Confirm'),
                ConfirmActionType.Question)
                .subscribe(response => {
                  if (response == undefined) {
                    return;
                  }
                  if (response) {
                    this.intentoTME++;
                    Promise.resolve(this._signalRTMEService.startInitializationProcess()).then(responses => {
                      if (responses.status === TMEApplicationInitResponseStatuses.successful) {
                        this._signalRTMEService.setStatusConnection(true);
                      } else if (responses.status === TMEApplicationInitResponseStatuses.genericError) {
                        this._signalRTMEService.setStatusConnection(false);
                      }
                    });
                  } else {
                    this.openIframe(action.action);
                  }
                });
              // }
            } else if (action.action.includes('AfericionesSinRetorno')) {
              const currentDocument = this._documentInternalService.currentDocument;
              if (currentDocument != undefined && currentDocument.lines != undefined) {
                const detalle = currentDocument.lines.filter(x => x.isRemoved != false);
                if (detalle.some(x => x.typeArticle.indexOf('TIEN') != -1) &&
                  detalle.some(x => x.businessSpecificLineInfo != undefined &&
                    x.businessSpecificLineInfo.type == BusinessType.gasStation)) {
                  this._confirmActionService.promptActionConfirm(
                    this.ExisteArticuloTienda,
                    this.acceptLiteral,
                    undefined,
                    this.fuellingPointTestNotAllowedHeaderLiteral,
                    ConfirmActionType.Question
                  ).subscribe(response => {
                    if (response) {
                      if (this.ValidarSuministro(detalle)) {
                        this.openIframe(action.action);
                      }
                    }
                  });
                } else {
                  if (this.ValidarSuministro(detalle)) {
                    this.openIframe(action.action);
                  }
                }

              }
              else {
                this._confirmActionService.promptActionConfirm(
                  this.fuellingPointTestNotAllowedDueToNotCompatibleDocumentLiteral,
                  this.acceptLiteral,
                  undefined,
                  this.fuellingPointTestNotAllowedHeaderLiteral,
                  ConfirmActionType.Error
                );
              }
            }
            else {
              this.openIframe(action.action);
            }
            // ABRE LOS COMPONENTES OFFLINE CUANDO ES UN TIPO EXTERNO
          } else {
            if (action.action.includes('TPVInOutCash') && action.action.includes('SALIDA'.toUpperCase())) {
              this.showCashOutOffline('SALIDA');
            }
            else if (action.action.includes('TPVInOutCash') && action.action.includes('ENTRADA'.toUpperCase())) {
              this.showCashOutOffline('ENTRADA');
            }
            else if (action.action.includes('PVClosingCash')) {
              this.showCashboxClosureOffline();
            } else {
              if (action.action.includes('TPVMerma')) {
                if (this.settingsLosses()) {
                  if (this.mostrarMensaje()) {
                    this.openIframe(action.action);
                  }
                  else {
                    this._confirmActionService.promptActionConfirm(
                      this.mensaje,
                      this.acceptLiteral,
                      undefined,
                      this.settingsLossesHeaderLiteral,
                      ConfirmActionType.Error
                    );
                  }
                }
              } else {
                this.openIframe(action.action);
              }
            }
          }
        }
    }
    jQuery('.Current-Options').css('border-color', '#ffffff');
    jQuery('#CurrentOptions' + ind).css('border-color', '#003b5c');
    jQuery('#CurrentOptions' + ind).css('border-width', '2px');
    jQuery('#CurrentOptions' + ind).css('border-style', 'solid');
  }


  ValidarSuministro(detalle: DocumentLine[]): boolean {
    let result = false;
    if (detalle.some(x => x.businessSpecificLineInfo != undefined &&
      x.businessSpecificLineInfo.type == BusinessType.gasStation)) {
      const rspt = detalle.find(y => y.businessSpecificLineInfo != undefined && y.businessSpecificLineInfo.type == BusinessType.gasStation);//currentDocument.lines[0].businessSpecificLineInfo;
      const businessSpecificLine = rspt.businessSpecificLineInfo;
      if (businessSpecificLine instanceof FuellingPointSupplyLine) {
        result = true;
      } else {
        this._confirmActionService.promptActionConfirm(
          this.fuellingPointTestNotAllowedDueToNotCompatibleSupplyLineLiteral,
          this.acceptLiteral,
          undefined,
          this.fuellingPointTestNotAllowedHeaderLiteral,
          ConfirmActionType.Error
        );
        result = false;
      }
    } else {
      this._confirmActionService.promptActionConfirm(
        this.fuellingPointTestNotAllowedDueToNotCompatibleDocumentLiteral,
        this.acceptLiteral,
        undefined,
        this.fuellingPointTestNotAllowedHeaderLiteral,
        ConfirmActionType.Error
      );
      result = false;
    }
    return result;
  }

  fuellingPointTest() {
    const currentDocument = this._documentInternalService.currentDocument;

    if (currentDocument != undefined &&
      currentDocument.lines != undefined &&
      currentDocument.lines.length == 1 &&
      currentDocument.lines[0].businessSpecificLineInfo != undefined &&
      currentDocument.lines[0].businessSpecificLineInfo.type == BusinessType.gasStation) {

      const businessSpecificLine = currentDocument.lines[0].businessSpecificLineInfo;
      if (businessSpecificLine instanceof FuellingPointSupplyLine) {
        const supplyLine = businessSpecificLine as FuellingPointSupplyLine;
        this._showFuellingPointTestSubscription = this._FuellingPointTestInternalService.showTestFuellingPoint(supplyLine.supplyTransaction)
          .first()
          .subscribe(
            isSupplyTransactionDispatched => {
              if (isSupplyTransactionDispatched == true) {
                // Limpiamos el documento. En este punto el suministro ya ha sido consumido, así que lo vaciamos manualmente.
                currentDocument.lines.splice(0, 1);
                currentDocument.totalAmountWithTax = 0;
                this._tpvMainService.setPluVisible(true);
              } else {
                // DO NOTHING
              }
              // this._logHelper.trace(isSupplyTransactionDispatched);
            },
            err => {
              this._logHelper.trace(err);
            },
            () => {
            });
      } else {
        this._confirmActionService.promptActionConfirm(
          this.fuellingPointTestNotAllowedDueToNotCompatibleSupplyLineLiteral,
          this.acceptLiteral,
          undefined,
          this.fuellingPointTestNotAllowedHeaderLiteral,
          ConfirmActionType.Error
        );
      }
    } else {
      this._confirmActionService.promptActionConfirm(
        this.fuellingPointTestNotAllowedDueToNotCompatibleDocumentLiteral,
        this.acceptLiteral,
        undefined,
        this.fuellingPointTestNotAllowedHeaderLiteral,
        ConfirmActionType.Error
      );
    }
  }

  collectRunaway() {
    this._collectionsInternalService.collectRunaway()
      .first()
      .subscribe(
        success => {
          this._logHelper.trace(success);
          if (success) {
            this._tpvMainService.setPluVisible(true);
          }
        },
        err => {
          this._logHelper.trace(err);
        },
        () => {
        });
  }

  collectDebt() {
    this._collectionsInternalService.collectPendingDocument()
      .first()
      .subscribe(
        success => {
          this._logHelper.trace(success);
          if (success) {
            this._tpvMainService.setPluVisible(true);
          }
        },
        err => {
          this._logHelper.trace(err);
        },
        () => {
        });
  }

  deudasCliente() {
    this._auxActionsManager.deudasClienteDocument()
      .first()
      .subscribe(
        success => {
          this._logHelper.trace(success);
          if (success) {
            this._tpvMainService.setPluVisible(true);
          }
        },
        err => {
          this._logHelper.trace(err);
        },
        () => {
        });
  }


  finishDocumentWithRunaway() {
    const currentDocument = this._documentInternalService.currentDocument;

    if (currentDocument != undefined &&
      currentDocument.lines != undefined &&
      currentDocument.lines.length > 0) {

      this._auxActionsManager.requestRunawaySale(currentDocument)
        .first()
        .subscribe(
          (success: boolean) => {
            if (success) {
              this._runawayPaymentInternal.paymentFinalized(true);
              this._tpvMainService.setPluVisible(true);
            } else {
              this._runawayPaymentInternal.paymentFinalized(false);
              this._tpvMainService.setPluVisible(true);
            }
          },
          err => this._logHelper.trace(err));
    } else {
      this._statusBarService.publishMessage(this.getLiteral('options_components', 'message_options_Componentes_SuministLeak'));
    }
  }

  showCashboxClosure() {
    // Las comprobaciones se efectuarán dentro, así que los mensajes de error se emitirán desde dentro.
    // La navegación de la interfaz ante el cierre del panel solicitado se gestiona aquí.
    this._showCashboxClosureSubscription =
      this._cashboxClosureInternalService.showCashboxClosure()
        .first()
        .subscribe(
          success => {
            if (success == true) {
              const mustResetOperator: boolean = true;
              this._documentInternalService.deleteDocumentData(mustResetOperator);
            } else {
              // DO NOTHING
            }
            this._logHelper.trace(success);
          },
          err => {
            this._logHelper.trace(err);
          },
          () => {
          });
  }

  showCashboxClosureOffline() {
    // Las comprobaciones se efectuarán dentro, así que los mensajes de error se emitirán desde dentro.
    // La navegación de la interfaz ante el cierre del panel solicitado se gestiona aquí.
    this._showCashboxClosureSubscription =
      this._cashboxClosureInternalServiceOffline.showCashboxClosureOffline()
        .first()
        .subscribe(
          success => {
            if (success == true) {
              const mustResetOperator: boolean = true;
              this._documentInternalService.deleteDocumentData(mustResetOperator);
            } else {
              // DO NOTHING
            }
            this._logHelper.trace(success);
          },
          err => {
            this._logHelper.trace(err);
          },
          () => {
          });
  }

  /*showCashEntry() {
    // Las comprobaciones se efectuarán dentro, así que los mensajes de error se emitirán desde dentro.
    // La navegación de la interfaz ante el cierre del panel solicitado se gestiona aquí.
    this._cashEntryInternalService.showCashEntry()
    .first()
    .subscribe(
      success => {
        if (success == true) {
          this._tpvMainService.setPluVisible(true);
        }
      },
      err => {
        this._logHelper.trace(err);
      },
      () => {
      });
  }*/

  showCashEntry() {
    // Las comprobaciones se efectuarán dentro, así que los mensajes de error se emitirán desde dentro.
    // La navegación de la interfaz ante el cierre del panel solicitado se gestiona aquí.
    this._cashEntryInternalService.showCashEntry()
      .first()
      .subscribe(
        success => {
          if (success == true) {
            const mustResetOperator: boolean = true;
            this._documentInternalService.deleteDocumentData(mustResetOperator);
          } else {
            // DO NOTHING
          }
          this._logHelper.trace(success);
        },
        err => {
          this._logHelper.trace(err);
        },
        () => {
        });
  }

  // Las comprobaciones se efectuarán dentro, así que los mensajes de error se emitirán desde dentro.
  // La navegación de la interfaz ante el cierre del panel solicitado se gestiona aquí.
  showCashOut() {
    this._cashOutInternalService.showCashOut()
      .first()
      .subscribe(
        success => {
          if (success == true) {
            this._tpvMainService.setPluVisible(true);
          }
        },
        err => {
          this._logHelper.trace(err);
        },
        () => {
        });
  }




  // Las comprobaciones se efectuarán dentro, así que los mensajes de error se emitirán desde dentro.
  // La navegación de la interfaz ante el cierre del panel solicitado se gestiona aquí.
  showCashOutOffline(type: string) {
    this._cashOutInternalServiceOffline.showCashOutOffline(type)
      .first()
      .subscribe(
        success => {
          if (success == true) {
            // DO NOTHING
          } else {
            // DO NOTHING
          }
          this._logHelper.trace(success);
        },
        err => {
          this._logHelper.trace(err);
        },
        () => {
        });
  }

  cancelDocument() {
    this._auxActionsManager.requestDocumentCancellation()
      .first()
      .subscribe(
        success => {
          this._logHelper.trace(success);
          if (success) {
            this._tpvMainService.setPluVisible(true);
          }
        },
        err => {
          this._logHelper.trace(err);
        },
        () => {
        });
  }

  AnularParcialDocument() {
    this._auxActionsManager.requestDocumentCancellationParcial()
      .first()
      .subscribe(
        success => {
          this._logHelper.trace(success);
          if (success) {
            this._tpvMainService.setPluVisible(true);
          }
        },
        err => {
          this._logHelper.trace(err);
        },
        () => {
        });
  }

  InformeVentas() {
    this._auxActionsManager.requestInformeVentas()
      .first()
      .subscribe(
        success => {
          this._logHelper.trace(success);
          if (success) {
            this._tpvMainService.setPluVisible(true);
          }
        },
        err => {
          this._logHelper.trace(err);
        },
        () => {
        });
  }

  copyDocument() {
    this._auxActionsManager.requestDocumentCopy()
      .first()
      .subscribe(
        success => {
          this._logHelper.trace(success);
          if (success) {
            this._tpvMainService.setPluVisible(true);
          }
        },
        err => {
          this._logHelper.trace(err);
        },
        () => {
        });
  }

  // abro el componente del iframe
  openIframe(pagina: string) {
    this._auxActionsManager.requestIframe(pagina).first()
      .subscribe(
        success => {
          this._logHelper.trace(success);
          if (success) {
            this._tpvMainService.setPluVisible(true);
          }
        },
        err => {
          this._logHelper.trace(err);
        },
        () => {
        });
  }
  /**
   *
   * @description Clasifica los items en categorias, los items que tienen la misma categoria apareceran juntos.
   * @private
   * @memberof OptionsComponent
   */
  private _clasifyItems() {
    this.clasificatedItems = [];
    const tam = this._items.length;
    for (let i = 0; i < tam; i++) {
      if (i == 0) {
        this.clasificatedItems.push([this._items[i]]);
      } else {
        let equals = false;
        for (let j = 0; j < this.clasificatedItems.length; j++) {
          if (this.clasificatedItems[j][0].sublocation == this._items[i].sublocation) {
            this.clasificatedItems[j].push(this._items[i]);
            equals = true;
          }
        }
        if (!equals) {
          this.clasificatedItems.push([this._items[i]]);
        }
      }
    }
    // ordeno los items por orden alfabetico dentro del submenu
    this.clasificatedItems = this.clasificatedItems.map((arrayOfItems) => {
      return arrayOfItems.sort((a, b) => {
        if (a.caption < b.caption) {
          return -1;
        }
        if (a.caption > b.caption) {
          return 1;
        }
        return 0;
      });
    });
    // ordeno los items por orden dentro del submenu
    this.clasificatedItems = this.clasificatedItems.map((arrayOfItems) => {
      return arrayOfItems.sort((a, b) => {
        if (a.order < b.order) {
          return -1;
        }
        if (a.order > b.order) {
          return 1;
        }
        return 0;
      });
    });

    this.clasificatedItems = this.clasificatedItems.sort((a, b) => {
      if (a[0].sublocation < b[0].sublocation) {
        return -1;
      }
      if (a[0].sublocation > b[0].sublocation) {
        return 1;
      }
      return 0;
    });

    // this.pluOptions = this.clasificatedItems;
  }
  moverItems(Valor: string) {
    const tabla = document.getElementsByClassName('mat-tab-body-content ng-trigger ng-trigger-translateTab')[2];
    if (Valor == 'A') {
      tabla.scrollTop = tabla.scrollTop - 50;
    }
    else {
      tabla.scrollTop = tabla.scrollTop + 50;
    }
  }

  openCashDrawer() {
    if (this._appDataConfiguration.printerPosCommands != undefined) {
      if (this._appDataConfiguration.printerPosCommands.openDrawer != undefined) {
        this._printService.sendCommandToPrinter(
          this._appDataConfiguration.printerPosCommands.openDrawer, this._appDataConfiguration.defaultPosPrinterName)
          .first()
          .subscribe(
            (sendCommandToPrinterResponse: SendCommandToPrinterResponse) => {
              if (sendCommandToPrinterResponse.status == SendCommandToPrinterResponseStatuses.successful) {
                this._statusBarService.publishMessage(this.getLiteral('options_components', 'message_options_Componentes_DrawerOpened'));
              } else {
                this._statusBarService.publishMessage(this.getLiteral('options_components', 'message_options_Componentes_ErrorOpeningDrawer'));
              }
            },
            error => {
              this._logHelper.logError(undefined, error);
            });
      } else {
        this._logHelper.trace('Open cash drawer commad undefined: ' + this._appDataConfiguration.printerPosCommands.openDrawer);
      }
    } else {
      this._logHelper.trace('Printer pos command undefined: ' + this._appDataConfiguration.printerPosCommands);
    }
  }

  mustBeEnabled(idButton: string): boolean {
    if (idButton === 'TME') {
      return !this._signalRTMEService.getStatusConnection();
    }
    else { return false; }
  }

  cantidadCurrentOptions(): number {
    return isNullOrUndefined(this.pluOptions) ? 0 : this.pluOptions.length;
  }

  /*contadorFinSubmenu
  contadorIniSubmenu
  contadorFinOptions
  contadorIniOptions */

  actualizarOpciones_submenu(tipo: string) {
    if (tipo == '+') {
      if (this.contadorFinSubmenu <= this.cantidadCurrentOptions()) {
        this.contadorIniSubmenu = this.contadorFinSubmenu;
        this.contadorFinSubmenu = this.contadorFinSubmenu + 10;
      }
    } else {
      if (this.contadorIniSubmenu == 11) {
        this.contadorIniSubmenu = 0;
        this.contadorFinSubmenu = this.contadorFinSubmenu - 10;
      } else {
        this.contadorIniSubmenu = this.contadorIniSubmenu - 10;
        this.contadorFinSubmenu = this.contadorFinSubmenu - 10;
      }
    }
  }

  actualizarOpciones_Cat(tipo: string) {
    if (tipo == '+') {
      if (this.contadorFinOptions <= this.clasificatedItems.length) {
        this.contadorIniOptions = this.contadorFinOptions;
        this.contadorFinOptions = this.contadorFinOptions + 6;
        this.contadorOpcionesMenu += 7;
      }
    } else {
      if (this.contadorIniOptions == 7) {
        this.contadorIniOptions = 0;
        this.contadorFinOptions = this.contadorFinOptions - 6;
        this.contadorOpcionesMenu = 0;
      } else {
        this.contadorIniOptions = this.contadorIniOptions - 6;
        this.contadorFinOptions = this.contadorFinOptions - 6;
        this.contadorOpcionesMenu -= 7;
      }
    }
  }

  setOptionsItem(index: any = 0) {
    index = index + this.contadorOpcionesMenu;

    this.contadorFinSubmenu = 11;
    this.contadorIniSubmenu = 0;

    // this.clasificatedItems
    if (index != '' || this.clasificatedItems.length > 0) {
      this.pluOptions = this.clasificatedItems[index];
      this.CurrentOpcion = this.pluOptions[0].sublocation;
      jQuery('.Rectangle-Copy-13-operations').css('background-color', '#0d859b');
      jQuery('#operations-' + index).css('background-color', '#003b5c');
    }
  }

  listaroptions() {
    if (this.pluOptions != undefined) {
      for (let index = 0; index < this.pluOptions.length; index++) {
        this.pluOptions[index].caption = this.quitarespacios(this.pluOptions[index].caption);
        const cadin = this.pluOptions[index].caption.substr(0, 1);
        const cadfin = this.pluOptions[index].caption.substr(1, undefined);
        this.pluOptions[index].caption = cadin.toUpperCase() + cadfin.toLowerCase();
      }
    }

    return isNullOrUndefined(this.pluOptions) ? undefined :
      this.pluOptions.slice(this.contadorIniSubmenu, this.contadorFinSubmenu);
  }
  quitarespacios(cadena: string) {
    if (cadena != undefined) {
      const espacio = cadena.substr(0, 1);
      if (espacio == ' ') {
        cadena = cadena.substr(1, undefined);
        this.quitarespacios(cadena);
      }
      return cadena;
    }
    return cadena;
  }
  listarItems() {
    return isNullOrUndefined(this.clasificatedItems) ? undefined :
      this.clasificatedItems.slice(this.contadorIniOptions, this.contadorFinOptions);
  }
  cantidadCurrentItems(): number {
    return isNullOrUndefined(this.clasificatedItems) ? 0 : this.clasificatedItems.length;
  }

  closeApp() {
    /*const win = window.open('about:blank', '_self', '', true);
    alert(win);
    win.close();*/
    // window.location.href = '/closekiosk'; //Instalar la extension 'Close Kiosk' de Google Chrome

    this._confirmActionSvc.promptActionConfirm(
      this.messageconfirmCloseApp,
      this.getLiteral('options_components', 'confirmActionSvc.Yes'),
      this.getLiteral('options_components', 'confirmActionSvc.No'),
      this.getLiteral('options_components', 'confirmActionSvc.Confirm'),
      ConfirmActionType.Question)
      .subscribe(response => {
        if (response === undefined) { }
        else if (response) {
          this.closeApplication();
        } else { }
      });
  }

  closeApplication() {

    this._operatorService.limpiadoOperador('').first()
      .subscribe(response => {
        const listAnulated: number[] = [];
        this._documentInternalService.currentDocumentList.forEach(x => {

          x.lines.filter(y => y.businessSpecificLineInfo !== undefined && y.businessSpecificLineInfo.supplyTransaction !== undefined
            && y.businessSpecificLineInfo.supplyTransaction.anulated !== undefined
            && y.businessSpecificLineInfo.supplyTransaction.anulated).forEach(w => {
              listAnulated.push(w.businessSpecificLineInfo.supplyTransaction.id);
            });
        });
        this._fpSvc.UpdateSupplyAnulatedEnTicket(listAnulated, false).first()
          .subscribe(response => {
            const version = this.detectIE();

            if (version === false) {
              if (navigator.userAgent.toLowerCase().indexOf(BrowserKey.chrome.toString()) > -1) {
                this._logHelper.trace('Navegador: El navegador que se está utilizando es Chrome');
                //  var win = window.open('about:blank','_self','true');
                this.cerrarAplication(BrowserKey.chrome.toString());
                // win.close();
                // window.location.href = '/closekiosk'; //Instalar la extension 'Close Kiosk' de Google Chrome
              }
              else if (navigator.userAgent.toLowerCase().indexOf(BrowserKey.firefox.toString()) > -1) {
                this._logHelper.trace('Navegador: El navegador que se está utilizando es Firefox');
                // const win = window.open('about:blank','_self','true');
                // win.close();
                this.cerrarAplication(BrowserKey.firefox.toString());
              }
            } else if (version >= 12) {
              this._logHelper.trace('Navegador: El navegador que se está utilizando es Edge ' + version);
              /* window.open('', '_parent', '');
                const ventana = window.self;
                ventana.opener = window.self;
                ventana.close();*/
              this.cerrarAplication(BrowserKey.Edge.toString());
            } else {
              this._logHelper.trace('Navegador: El navegador que se está utilizando es IE ' + version);
              /* window.open('', '_parent', '');
                const ventana = window.self;
                ventana.opener = window.self;
                ventana.close();*/
              this.cerrarAplication(BrowserKey.IE.toString());
            }
          });
      });
  }
  cerrarAplication(CurrentBrowser: string) {
    const maxReintentosTMEConf = this._appDataConfiguration.getConfigurationParameterByName('TIMER_TO_HUBBLEPOSSERVICE', 'GENERAL');
    if (maxReintentosTMEConf != undefined) {
      this.time = maxReintentosTMEConf.meaningfulStringValue;
    }
    else {
      this.time = '5000';
    }
    const request = { Browser: CurrentBrowser, Time: this.time };
    this._http.postJsonObservable(`${this._appDataConfiguration.apiUrl}/CloseProcessAplication`, request)
      .subscribe(response => { });
  }

  detectIE() {
    const ua = window.navigator.userAgent;

    const msie = ua.indexOf('MSIE ');
    if (msie > 0) {
      // IE 10 or older => return version number
      return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    const trident = ua.indexOf('Trident/');
    if (trident > 0) {
      // IE 11 => return version number
      const rv = ua.indexOf('rv:');
      return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    const edge = ua.indexOf('Edge/');
    if (edge > 0) {
      // Edge (IE 12+) => return version number
      return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

  settingsLosses(): boolean {
    const currentDocument = this._documentInternalService.currentDocument;

    if (currentDocument != undefined &&
      currentDocument.lines != undefined &&
      currentDocument.lines.length > 0) {
      if (currentDocument.totalAmountWithTax == 0) {
        this._statusBarService.publishMessage(this.getLiteral('options_components', 'message_options_totalAmountWithTax'));
        return false;
      }
      return true;
    } else {
      this._statusBarService.publishMessage(this.getLiteral('options_components', 'message_options_status_bar_settingsLosses'));
      return false;
    }
  }

  mostrarMensaje(): boolean {
    try {
      const parm = this._appDataConfiguration.getConfigurationParameterByName('TYPE_ARTICLE_LEAKS', 'TPV');
      if (parm == undefined) {
        return true;
      }
      const currentDocument = this._documentInternalService.currentDocument;

      if (parm.meaningfulStringValue == 'COMBU') {
        this.mensaje = this.getLiteral('options_components', 'message_options_settingsLosses');
      }
      return currentDocument.lines.filter(x => x.typeArticle.indexOf(parm.meaningfulStringValue) < 0).length >= 1;

    } catch (error) {
      this._logHelper.trace('Excepcion MostrarMensaje() - ' + error);
      return true;
    }
  }

  gradesChangePrices() {
    this._gradesChangePricesInternalService.gradesChangePrices()
      .first().subscribe(
        (success: boolean) => {
          // nothing
        },
        err => {
          this._logHelper.trace(err);
        },
        () => {
        });
  }

  copyLastTicket() {
    this._showFuellingPointTestSubscription =  this._documentService.agetCopyLastTicket()
       .first()
       .subscribe(
         isSupplyTransactionDispatched => {
           if (isSupplyTransactionDispatched == true) {
             // Limpiamos el documento. En este punto el suministro ya ha sido consumido, así que lo vaciamos manualmente.
             //currentDocument.lines.splice(0, 1);
             //currentDocument.totalAmountWithTax = 0;
             this._tpvMainService.setPluVisible(true);
           } else {
             // DO NOTHING
             //this._statusBarService.publishMessage(this.getLiteral('options_components', 'message_options_status_bar_settingsLosses'));
             this._statusBarService.publishMessage('No hay ticket diponible para imprimir');
           }
           this._logHelper.trace(isSupplyTransactionDispatched);
         },
         err => {
           this._logHelper.trace(err);
         },
         () => {
         });

  }

}


