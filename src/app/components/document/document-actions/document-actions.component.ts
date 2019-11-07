import { PaymentMethodType } from './../../../shared/payments/payment-method-type.enum';
import { Component, OnInit, Input, HostBinding, EventEmitter, Output } from '@angular/core';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Subscription } from 'rxjs/Subscription';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
import { RoundPipe } from 'app/pipes/round.pipe';
import { AuxiliarActionsManagerService } from 'app/services/auxiliar-actions/auxiliar-actions-manager.service';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { DocumentService } from 'app/services/document/document.service';
import { CashPaymentService } from 'app/services/payments/cash-payment.service';
import { MixtPaymentInternalService } from 'app/services/payments/mixt-payment-internal.service';
import { TpvMainService } from 'app/services/tpv/tpv-main.service';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { Document } from 'app/shared/document/document';
import { DynamicActionLaunchDisplayItem } from 'app/shared/dynamic-actions/dynamic-action-launch-display-item';
import { PaymentPurpose } from 'app/shared/payments/PaymentPurpose.enum';
import { DocumentLinePromotion } from 'app/shared/document/document-line-promotion';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { LoyaltyActionType } from 'app/shared/loyalty/loyalty-action-type.enum';
import { LoyaltyAttributionInformation } from 'app/shared/loyalty/loyalty-attribution-information';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { RunawayPaymentInternalService } from 'app/services/payments/runaway-payment-internal.service';
import { CustomerInternalService } from 'app/services/customer/customer-internal.service';
import { Observable } from 'rxjs/Observable';
import { CustomerSelectedResult } from 'app/shared/customer/customer-selected-result';
import { Subscriber } from 'rxjs/Subscriber';
import { DispatchNoteService } from '../../../services/payments/dispatch-note.service';
import { CustomerDocumentType } from 'app/shared/customer/customer-document-type.enum';
// import { SignalRPrintingService } from 'app/services/signalr/signalr-printing.service';
import {
  SendCommandToPrinterResponse
} from 'app/shared/signalr-server-responses/printingModuleHub/send-command-to-printer-response';
import {
  SendCommandToPrinterResponseStatuses
} from 'app/shared/signalr-server-responses/printingModuleHub/send-command-to-printer-response-statuses.enum';
import { LogHelper } from 'app/helpers/log-helper';
import { PromotionsService } from 'app/services/promotions/promotions.service';
import { ResponseStatus } from 'app/shared/response-status.enum';
import { FuellingPointFormatConfiguration } from 'app/shared/fuelling-point/fuelling-point-format-configuration';
import { Currency } from 'app/shared/currency/currency';
import { ChangePaymentInternalService } from 'app/services/payments/change-payment-internal.service';
import { changedPayment } from 'app/shared/payments/changed-payment';
import { buttonStatus } from 'app/shared/button-status.enum';
import { endSaleType } from 'app/shared/endSaleType';
import { GenericHelper } from 'app/helpers/generic-helper';
import { SignalRTMEService } from 'app/services/signalr/signalr-tme.service';
// Cajon Y Visor
import { SignalROPOSService } from 'app/services/signalr/signalr-opos.service';
import { OPOSWriteDisplayResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/opos-writedisplay-response-statuses.enum';
import { OPOSOpenCashDrawerResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/opos-opencashdrawer-response-statuses.enum';
// import { DocumentLine } from 'app/shared/document/document-line';
import { LanguageService } from 'app/services/language/language.service';
import { PluService } from 'app/services/plu/plu.service';
import { FormatHelper } from 'app/helpers/format-helper';
import { CurrencyPriorityType } from 'app/shared/currency/currency-priority-type.enum';
// import { FormatHelper } from 'app/helpers/format-helper';
import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';
import { PrintingService } from 'app/services/printing/printing.service';
import { TMEApplicationInitResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-application-init-response-statuses.enum';

@Component({
  selector: 'tpv-document-actions',
  templateUrl: './document-actions.component.html',
  styleUrls: ['./document-actions.component.scss'],
})
export class DocumentActionsComponent implements OnInit, OnDestroy {
  @HostBinding('class') class = 'document-actions';
  @Input() currentDocument: Document;
  @Input() currentChanged: changedPayment;
  @Input() formatConfig: FuellingPointFormatConfiguration;
  // @Input() dispatchNoteMandatory: boolean;
  @Output() saleFinished: EventEmitter<boolean> = new EventEmitter();
  @Output() promotionsCalculated: EventEmitter<boolean> = new EventEmitter();
  buttonTicketActionDeliveryLiteral: string;
  buttonTicketActionExactLiteral: string;
  buttonTicketActionCardLiteral: string;
  buttonTicketActionMixLiteral: string;
  buttonTicketActionLoyaltyLiteral: string;
  buttonTicketActionBoxLiteral: string;
  buttonTicketActionCashLiteral: string;
  buttonTicketActionCashOrExactLiteral: string;
  private _actionItem: DynamicActionLaunchDisplayItem;
  private _subscriptions: Subscription[] = [];
  messajeErrorMultiplePrepago: string = this.getLiteral('document_actions_component', 'literal_messageErrorMultiplePrepago');
  baseCurrency: Currency;
  isButtonEnable: boolean = false;
  /**
   * Indica si hay una operacion lanzada e impide repetir peticiones
   */
  private _requesting: boolean = false;
  // DECLARACION DE LITERALES - Quitado de Pana para no saltar la pantalla de Aceptar
  /*private promotionsConfirmHeaderLiteral = 'Confirmar pago exacto';
  private promotionsConfirmTextLiteral1 = 'El importe total del documento tras aplicar promociones es ';
  private promotionsConfirmTextLiteral2 = '¿desea continuar?';
  private promotionsConfirmAcceptLiteral = 'Aceptar';
  private promotionsConfirmCancelLiteral = 'Cancelar';*/
  private balanceErrorHeaderLiteral = this.getLiteral('common', 'error');
  private balanceErrorTextLiteral = this.getLiteral('document_actions_component', 'balanceErrorTextLiteral');
  private balanceErrorAceptLiteral = this.getLiteral('document_actions_component', 'confirmActionSvc.promptActionConfirm');
  private messajeconfirmAction = this.getLiteral('document_actions_component', 'confirmActionSvc.messajeconfirmAction');
  private messajeDocumentCancel = this.getLiteral('document_actions_component', 'confirmActionSvc.messajeDocumentCancel');

  constructor(
    private _cashPaymentService: CashPaymentService,
    private _confirmActionSvc: ConfirmActionService,
    private _auxActionsManager: AuxiliarActionsManagerService,
    private _mixtPaymentInternalSvc: MixtPaymentInternalService,
    private _tpvMainService: TpvMainService,
    private _config: MinimumNeededConfiguration,
    private _documentService: DocumentService,
    private _roundPipe: RoundPipe,
    private _appDataConfiguration: AppDataConfiguration,
    private _documentInternalService: DocumentInternalService,
    private _statusBarService: StatusBarService,
    private _runawayPaymentInternal: RunawayPaymentInternalService,
    private customerInternalSvc: CustomerInternalService,
    private _appDataSvc: AppDataConfiguration,
    private confirmActionSvc: ConfirmActionService,
    private dispatchNoteSvc: DispatchNoteService,
    // private _printService: SignalRPrintingService,
    private _printService: PrintingService,
    private _changedPaymnetInternalSvc: ChangePaymentInternalService,
    private _promotionsSvc: PromotionsService,
    private _appDataConfig: AppDataConfiguration,
    private _signalRTMEService: SignalRTMEService,
    private _signalROPOSService: SignalROPOSService,
    private _languageService: LanguageService,
    private _pluService: PluService,
    private _electronicJournal: ElectronicJournalService,
    private _documentInternalSvc: DocumentInternalService,
    private _logHelper: LogHelper,
  ) {
    this.buttonTicketActionDeliveryLiteral = this.getLiteral('document_actions_component', 'button_TicketActions_Delivery');
    this.buttonTicketActionExactLiteral = this.getLiteral('document_actions_component', 'button_TicketActions_Exact');
    this.buttonTicketActionCardLiteral = this.getLiteral('document_actions_component', 'button_TicketActions_Card');
    this.buttonTicketActionMixLiteral = this.getLiteral('document_actions_component', 'button_TicketActions_Mix');
    this.buttonTicketActionLoyaltyLiteral = this.getLiteral('document_actions_component', 'button_TicketActions_Loyalty');
    this.buttonTicketActionBoxLiteral = this.getLiteral('document_actions_component', 'button_TicketActions_Box');
    this.buttonTicketActionCashLiteral = this.getLiteral('document_actions_component', 'button_TicketActions_Cash');
  }

  ngOnInit() {
    this.baseCurrency = this._appDataConfiguration.baseCurrency;
    this._actionItem = this._config.dynamicActionItemList.find((item) => {
      return item.location === 'loyalty';
    });
    /*
    this._subscriptions.push(this._changedPaymnetInternalSvc.timerTicket$
      .subscribe((response: boolean) => {
        if (response) {
          this.sendPrint();
        }
      }));
      */
    this._subscriptions.push(this._changedPaymnetInternalSvc.PaymentFinalized$.subscribe(d => {
      this.onPaymentFinalized(d);
    }));
    this._subscriptions.push(this._runawayPaymentInternal.onPaymentFinalized()
      .subscribe((response: boolean) => this.onPaymentFinalized(response)));
    this._documentInternalService.onPreviewPromotions().subscribe(() => this._previewPromotions());
    this._subscriptions.push(this._changedPaymnetInternalSvc._buttonDisable$.subscribe(response => {
      if (response == buttonStatus.ENABLED) {
        this.isButtonEnable = true;
      } else if (response == buttonStatus.DISABLED) {
        this.isButtonEnable = false;
      } else if (response == buttonStatus.OPTIONADITIONALCHARGED) {
        this.fnCharged(true);
      }
    }));

    this._subscriptions.push(this._changedPaymnetInternalSvc.responseFidelizacion$
      .subscribe((response: boolean) => {
        if (response) {
          // Efectivo fidelización SI (tarjeta)
          this.requestEndSale(endSaleType.creditCard, true);
        } else {
          this.requestEndSale(endSaleType.cash);
        }
      }));

    this._subscriptions.push(this._changedPaymnetInternalSvc.changedPaymentFail$.subscribe(response => {
      if (response) {
        this.currentChanged = response;
      }
    }));

    this._subscriptions.push(this._changedPaymnetInternalSvc.changedPaymentFail$.subscribe(response => {
      if (response) {
        if (this.currentDocument != undefined && this.currentDocument.paymentDetails != undefined) {
          this.currentDocument.paymentDetails = undefined;
        }
      }
    }));

    this._subscriptions.push(this._documentService.currentDocument$
      .subscribe((response: Document) => {
        if (response != undefined) {
          this.currentDocument = response;
        }
      }));

    this._subscriptions.push(this._changedPaymnetInternalSvc.document$.subscribe(d => {
      this.currentDocument = d;
    }));

  }

  ngOnDestroy(): void {
    this._subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Controla evento de click en los distintos botones para finalizar venta
   * @param type Indica el boton que se ha pulsado para finalizar la venta, es decir el tipo de finalización
   * (ie: efectivo, tarjeta, mixto, entrega..)
   */
  requestEndSale(type: endSaleType, tarjeta: boolean = true) {
    if (!this._signalRTMEService.getStatusConnection()) {
      Promise.resolve(this._signalRTMEService.startInitializationProcess()).then(response => {
        if (response.status === TMEApplicationInitResponseStatuses.successful) {
          this._signalRTMEService.setStatusConnection(true);
        } else if (response.status === TMEApplicationInitResponseStatuses.genericError) {
          this._signalRTMEService.setStatusConnection(false);
        }
      });
    }

    if (this._requesting ||
      this.currentDocument == undefined ||
      this.currentDocument.lines == undefined ||
      this.currentDocument.lines.length <= 0 ||
      this.currentDocument.totalAmountWithTax == 0) {
      if (this.currentDocument.totalAmountWithTax == 0) {
        this._statusBarService.publishMessage(this.messajeDocumentCancel);
      }
      return;
    }
    // Se agrega el valor del cambio, para pago en efectivo + fidelizacion con tarjeta
    if (type == endSaleType.creditCard && tarjeta === true) {
      this.currentDocument.cambio = this.currentChanged.totalChange;
    }

    if (this.currentDocument.totalAmountWithTax < 9998) {
      this._pluService.canSearchWithBarcode = false; // Pana - Para no poder buscar con el lector
      if (!GenericHelper._hasMoreOnePrepaid(this.currentDocument.lines)) {
        this.currentChanged.paymentType = this.currentChanged.paymentType !== endSaleType.localcredit ?
          type : this.currentChanged.paymentType;
        this._requesting = true;
        const isBalanceCustomer = this.currentDocument.customer != undefined
          && this.currentDocument.customer.cardInformation != undefined
          && !isNaN(this.currentDocument.customer.cardInformation.balance)
          && this.currentDocument.customer.cardInformation.balance != undefined;
        // this._clearPromotions();
        // this._promotionsSvc.cleanLocalTarif(this.currentDocument); // Pana - Se limpian las tarifas locales si se han aplicado
        this._promotionsSvc.calculatePromotionsWithoutClear(this.currentDocument)
          .first()
          .subscribe(
            calculatePromotionsResponse => {
              let promotionsApplied = false;
              if (calculatePromotionsResponse.status === ResponseStatus.success) {
                const receivedPromotionsList = calculatePromotionsResponse.object;
                promotionsApplied = receivedPromotionsList != undefined && receivedPromotionsList.length > 0;
                this._setGlobalPromo(receivedPromotionsList);
              }

              if (isBalanceCustomer) { // si el cliente es de saldo
                const hasEnoughBalance = this.currentDocument.customer.cardInformation.balance >= this.currentDocument.totalAmountWithTax;
                if (hasEnoughBalance) {
                  this.choosePaymentType(type, promotionsApplied, tarjeta);
                } else {
                  this.confirmActionSvc
                    .promptActionConfirm(
                      this.balanceErrorTextLiteral,
                      this.balanceErrorAceptLiteral,
                      undefined,
                      this.balanceErrorHeaderLiteral,
                      ConfirmActionType.Error)
                    .first().subscribe(_ => {
                      this.onPaymentFinalized(false);
                    });
                }
                this._requesting = false;
                return;
              }
              // si el importe supera el maximo para cliente desconocido, obligamos a seleccionar cliente
              if ((this.customerInternalSvc.isUnknownCustomer(this.currentDocument.customer.id)
                && this.currentDocument.totalAmountWithTax > this._appDataSvc.maxAmountForUnkownCustomer)) {
                this.confirmActionSvc.promptActionConfirm(this.getLiteral('document_actions_component',
                  'confirmActionSvc.promptActionLimit'),
                  this.getLiteral('common', 'aceptar'),
                  undefined, this.getLiteral('document_actions_component', 'confirmActionSvc.promptActionInformation'),
                  ConfirmActionType.Information)
                  .first().subscribe(confirmResponse => {
                    if (!confirmResponse) {
                      this.onPaymentFinalized(false);
                      return;
                    }
                    this.requestCustomer(false)
                      .first().subscribe(customerResult => {
                        if (customerResult == undefined || customerResult.customer == undefined) {
                          this.onPaymentFinalized(false);
                          return;
                        }
                        this.currentDocument.customer = customerResult.customer;
                        this.currentDocument.plate = customerResult.plate;
                        this.choosePaymentType(type, promotionsApplied, tarjeta);
                      });
                  });
              } else {
                this.choosePaymentType(type, promotionsApplied, tarjeta);
              }
            },
            err => {
              this._logHelper.trace(err);
              this.onPaymentFinalized(false);
            });
      }
      else {
        this._confirmActionSvc.promptActionConfirm(
          this.messajeErrorMultiplePrepago,
          this.getLiteral('document_actions_component', 'literal_confirmActionSvcAccept'), undefined,
          this.getLiteral('document_actions_component', 'literal_confirmActionSvcMessageInfo'),
          ConfirmActionType.Error);
      }
    } else { // importe mayor a 9998
      this.confirmActionSvc.promptActionConfirm(
        this.getLiteral('document_actions_component', 'literal_messageAmountExceeds'),
        this.getLiteral('common', 'aceptar'), undefined,
        this.getLiteral('document_actions_component', 'confirmActionSvc.promptActionInformation'), ConfirmActionType.Information)
        .first().subscribe(confirmResponse => {
          return;
        });
    }
  }

  private _setGlobalPromo(receivedPromotionList: DocumentLinePromotion[]) {
    this._logHelper.trace(`Se aplicarán las siguientes PROMOCIONES:`);
    this._logHelper.trace(receivedPromotionList.toString());
    const promoGlobal = receivedPromotionList.filter(p => p.referredLineNumber < 0).length > 0 ?
      receivedPromotionList.filter(p => p.referredLineNumber < 0)[0] : undefined;
    if (promoGlobal != undefined) {
      // Guardamos la promo de ticket como un nuevo medio de pago
      const promoPM = this._appDataConfig.getPaymentMethodByType(PaymentMethodType.promotion);
      const baseCurrency: Currency = this._appDataConfig.currencyList.find(c => c.priorityType == CurrencyPriorityType.base);
      this.currentDocument.paymentDetails = [{
        paymentMethodId: promoPM.id,
        paymentDateTime: FormatHelper.formatToUTCDateFromLocalDate(new Date()),
        currencyId: baseCurrency.id,
        changeFactorFromBase: 1,
        primaryCurrencyTakenAmount: promoGlobal.discountAmountWithTax,
        primaryCurrencyGivenAmount: 0,
        method: promoPM
      }];
    }
    this.promotionsCalculated.emit(true);
  }

  loyalty() {
    // Electronic Journal - button loyalty (Custom message)
    this._electronicJournal.writeAction({
      type: ActionType.customMessage,
      buttonCaption: this.buttonTicketActionLoyaltyLiteral,
      genericDetail: 'requested'
    });

    if (!this._requesting &&
      this.currentDocument != undefined &&
      this.currentDocument.lines != undefined &&
      this.currentDocument.lines.length > 0) {
      this._requesting = true;
      // this._logHelper.trace('Loyalty. Current Document->');
      // this._logHelper.trace(this.currentDocument);
      this.currentDocument.emissionLocalDateTime = new Date();
      this._promotionsSvc.cleanLocalTarif(this.currentDocument); // Pana - Se limpian las tarifas locales si se han aplicado
      this._promotionsSvc.calculatePromotions(this.currentDocument).subscribe(
        calculatePromotionsResponse => {
          this._requesting = false;
          if (calculatePromotionsResponse.status === ResponseStatus.success) {
            const receivedPromotionsList = calculatePromotionsResponse.object;
            this._setPromotions(receivedPromotionsList);

            this._auxActionsManager.requestLoyaltyOperation(
              this.currentDocument.totalAmountWithTax,
              this.currentDocument.currencyId).subscribe(
                (response: LoyaltyAttributionInformation) => {
                  if (response != undefined) {
                    let loyaltyDiscountToApply: number = 0;

                    // Solamente si es redención insertamos la línea con el descuento a aplicar
                    if (response.actionType === LoyaltyActionType.redemption) {
                      loyaltyDiscountToApply = (-1 * response.benefitAmount);

                      // this._logHelper.trace('LoyaltyActionType is redemption');
                      // this._logHelper.trace('CurrentDocument->');
                      // this._logHelper.trace(this.currentDocument);

                      if (this.currentDocument.loyaltyAttributionInfo == undefined) {
                        // Insertamos la línea con los detalles del descuento por fidelización
                        this._documentInternalService.publishLineData({
                          productId: this._appDataConfiguration.loyaltyProductId,
                          quantity: 1,
                          description: response.benefitName,
                          priceWithTax: 0,
                          discountPercentage: 0,
                          totalAmountWithTax: loyaltyDiscountToApply,
                          taxPercentage: 0,
                          isLoyaltyRedemption: true,
                          originalPriceWithTax: 0,
                          idCategoria: '',
                          nameCategoria: ''
                        });
                      }
                    } else {
                      this._statusBarService.publishMessage(this.getLiteral('document_actions_component', 'loyalty_statusBarService.publishMessage'));
                    }

                    // this._logHelper.trace('LoyaltyAttributionInfo is going to be set in current document');
                    // this._logHelper.trace('CurrentDocument->');
                    // this._logHelper.trace(this.currentDocument);

                    if (this.currentDocument.loyaltyAttributionInfo == undefined) {
                      // Insertamos los datos de fidelización en el documento
                      this._documentInternalService.currentDocument.loyaltyAttributionInfo = {
                        benefitId: response.benefitId,
                        cardNumber: response.cardNumber,
                        benefitName: response.benefitName,
                        currencyId: response.currencyId,
                        actionType: response.actionType,
                        benefitAmount: response.benefitAmount,
                        localDateTime: response.localDateTime,
                        documentTotalAmount: response.documentTotalAmount,
                        amountToRedeem: (-1 * loyaltyDiscountToApply)
                      };
                    }

                    this.requestEndSale(endSaleType.mixtPayment);
                  }
                });
          }
        },
        err => {
          this._logHelper.logError(err);
          this._requesting = false;
        }
      );
    } else {
      this._statusBarService.publishMessage(this.getLiteral('document_actions_component', 'loyalty_statusBarService.publishMessage1'));
      this._logHelper.trace('No se puede verificar la veracidad de las atribuciones con un boleto vacío');
    }
  }

  openCashDrawer() {
    // Electronic Journal - Button openCashDrawer
    this._electronicJournal.writeAction({
      type: ActionType.customMessage,
      buttonCaption: this.buttonTicketActionBoxLiteral,
      genericDetail: 'requested'
    });

    if (!this._requesting &&
      this._appDataConfiguration.printerPosCommands != undefined) {
      if (this._appDataConfiguration.printerPosCommands.openDrawer != undefined) {
        this._requesting = true;
        this._printService.sendCommandToPrinter(
          this._appDataConfiguration.printerPosCommands.openDrawer, this._appDataConfiguration.defaultPosPrinterName)
          .first()
          .subscribe(
            (sendCommandToPrinterResponse: SendCommandToPrinterResponse) => {
              this._requesting = false;
              if (sendCommandToPrinterResponse.status == SendCommandToPrinterResponseStatuses.successful) {
                this._statusBarService.publishMessage(this.getLiteral('document_actions_component', 'openCashDrawer'));
              } else {
                this._statusBarService.publishMessage(this.getLiteral('document_actions_component', 'openCashDrawer1'));
              }
            },
            error => {
              this._logHelper.logError(undefined, error);
              this._requesting = false;
            });
      } else {
        this._logHelper.trace('Open cash drawer commad undefined: ' + this._appDataConfiguration.printerPosCommands.openDrawer);
      }
    } else {
      this._logHelper.trace('Printer pos command undefined: ' + this._appDataConfiguration.printerPosCommands);
    }
  }

  /**
   * Usada en la vista para determinar el estado deshabilitado o no de boton de cierre de venta
   */
  isButtonDisabled(): boolean {
    return this._requesting || this.currentDocument == undefined
      || (this.currentDocument.operator == undefined && this.currentDocument.customer == undefined);
    // this._requesting || comentado para verificar su uso
  }

  sendPrint() {
    this._requesting = true;
    let sendPrintFunc: Observable<boolean>;
    sendPrintFunc = this._documentService.sendPrint([this.currentDocument]);

    this._requesting = false;

    sendPrintFunc
      .first().subscribe(response => {
        this._statusBarService.resetProgress();
        this.onPaymentFinalized(response);
      });
  }

  get dispatchNoteMandatory(): boolean {
    return this.currentDocument != undefined
      && this.currentDocument.customer != undefined
      && this.currentDocument.customer.cardInformation != undefined
      && this.currentDocument.customer.cardInformation.documentTypeId == CustomerDocumentType.deliveryNote;
  }

  private requestCustomer(allowAnonCustomer: boolean): Observable<CustomerSelectedResult> {
    return Observable.create((observer: Subscriber<CustomerSelectedResult>) => {
      this.customerInternalSvc.requestCustomerForInvoice()
        .first().subscribe(customerResult => {
          if (customerResult == undefined || customerResult.customer == undefined) {
            observer.next(customerResult);
            return;
          }
          if (this.customerInternalSvc.isUnknownCustomer(customerResult.customer.id) && !allowAnonCustomer) {
            this.confirmActionSvc.promptActionConfirm(this.getLiteral('document_actions_component',
              'requestCustomer_confirmActionSvc.promptActionConfirm'),
              this.getLiteral('common', 'aceptar'), undefined, this.getLiteral('common', 'error'), ConfirmActionType.Error)
              .first().subscribe(_ => {
                // llamada recursiva para seleccionar cliente
                this.requestCustomer(allowAnonCustomer)
                  .first().subscribe(recursiveResult => {
                    observer.next(recursiveResult);
                  });
              });
            return;
          }
          observer.next(customerResult);
        });
    });
  }

  private choosePaymentType(type: endSaleType, promotionsApplied: boolean, tarjeta: boolean) {
    this._documentInternalService.currentDocument.BarcodeStatus = true;
    const switchFunction = (invoiceMandatory: boolean) => {
      if (invoiceMandatory && this.customerInternalSvc.isUnknownCustomer(this.currentDocument.customer.id)) {
        // una factura no puede ir a cliente contado
        this.confirmActionSvc.promptActionConfirm(this.getLiteral('document_actions_component',
          'choosePaymentType_confirmActionSvc.promptActionConfirm'),
          this.getLiteral('common', 'aceptar'), undefined, this.getLiteral('common', 'error'), ConfirmActionType.Error)
          .first().subscribe(_ => {
            this.onPaymentFinalized(false);
          });
        return;
      }

      // Electronic Journal - paymentPanelSelected
      this._electronicJournal.writeAction({
        type: ActionType.paymentPanelSelected,
        selectedDocument: this._documentInternalSvc.currentDocumentIndex.toString(),
        paymentFlow: type
      });

      switch (type) {
        case endSaleType.cash:
          this.cashPayment(promotionsApplied, invoiceMandatory);
          break;
        case endSaleType.creditCard:
          if (tarjeta) {
            this.creditCardPayment(invoiceMandatory, endSaleType.creditCard);
          } else {
            this.creditCardPayment(invoiceMandatory, endSaleType.mixtPayment);
          }
          break;
        case endSaleType.mixtPayment:
          this.mixtPayment(invoiceMandatory);
          break;
        case endSaleType.dispatchNote:
          this.dispatchNote();
          break;
        default:
          this.onPaymentFinalized(false);
          break;
      }
    };

    // si el importe supera el maximo para factura simple, debe ir con factura
    /* const exceedLimitForTicket = this.currentDocument.totalAmountWithTax > this._appDataSvc.maxAmountForTicketWithoutInvoice;
    const customerInvoiceMandatory = this.currentDocument.customer != undefined
      && this.currentDocument.customer.cardInformation != undefined
      && this.currentDocument.customer.cardInformation.documentTypeId == CustomerDocumentType.invoice;
    const mustInvoice = exceedLimitForTicket
      || customerInvoiceMandatory;
    const isDispatchNote = type == endSaleType.dispatchNote;

    const notifyInvoice = !isDispatchNote && exceedLimitForTicket && !customerInvoiceMandatory;
    // notifica que se emitirá obligatoriamente factura debido al importe
    // si es albaran, o se requiere por cliente factura, no se notifica.
    if (notifyInvoice) {
      this.confirmActionSvc.promptActionConfirm(this.getLiteral('document_actions_component',
        'choosePaymentType_confirmActionSvc.promptActionLimit'),
        this.getLiteral('common', 'aceptar'), undefined, this.getLiteral('document_actions_component',
          'confirmActionSvc.promptActionInformation'), ConfirmActionType.Information)
        .first().subscribe(confirmActionResponse => {
          if (!confirmActionResponse) {
            this.onPaymentFinalized(false);
            return;
          }
          switchFunction(mustInvoice);
        });
    } else {
      switchFunction(mustInvoice);
    }*/

    switchFunction(false);

  }

  // pago en cash
  private cashPayment(promotionsApplied: boolean, invoice: boolean) {
    // if (!promotionsApplied) {

    this._requesting = false;

    // Ponemos bien el cambio por si se ha perdido o cambiado.
    if (this.currentDocument.changeDelivered != undefined && this.currentDocument.cambio == 0) {
      this.currentDocument.cambio = this.currentDocument.changeDelivered;
    }

    // mixto con efectivo
    // credito local (se introduce validacion de >0 por que payment es != undefined)
    if (this.currentDocument.paymentDetails != undefined
      && (this.currentDocument.paymentDetails.length > 0)
      && this.currentDocument.paymentDetails[0].paymentMethodId !== this._appDataConfig.company.id + '10') {
      return this._cashPaymentService.sendSaleMixto(this.currentDocument, invoice);
    } else {
      // cuando no es mixto
      // EFECTIVO
      return this._cashPaymentService.sendSale(this.currentDocument, invoice);
    }
    // }  - Quitado de Pana para no saltar la pantalla de Aceptar 08/03/2019
    /*this.confirmActionSvc.promptActionConfirm(
      `${this.promotionsConfirmTextLiteral1} ${
      this._roundPipe.transformInBaseCurrency(
        this.currentDocument.totalAmountWithTax).toString()
      }` +
      `${this._appDataConfiguration.baseCurrency.symbol} ${this.promotionsConfirmTextLiteral2}`,
      this.promotionsConfirmAcceptLiteral, this.promotionsConfirmCancelLiteral,
      this.promotionsConfirmHeaderLiteral,
      ConfirmActionType.Warning)
      .first()
      .subscribe(
        promptResult => {
          if (promptResult == true) {
            this._cashPaymentService.sendSale(this.currentDocument, invoice);
            this._requesting = false;
          } else {
            this._logHelper.trace('El usuario canceló la acción');
            this._requesting = false;
            this.onPaymentFinalized(false);
          }
        },
        err => {
          this._logHelper.logError(undefined, err);
          this._requesting = false;
          this.onPaymentFinalized(false);
        },
        () => {
          this._requesting = false;
          this._tpvMainService.setPluVisible(true);
        });*/
  }

  private creditCardPayment(invoice: boolean, ventaTipo: endSaleType) {
    this._btnWriteDisplayTicket();
    this._auxActionsManager.requestCreditCardSale(this.currentDocument, invoice, ventaTipo)
      .first()
      .subscribe(
        success => {
          if (success) {
            this.fnCharged(true, endSaleType.creditCard);
          } else {
            this._documentInternalService.currentDocument.BarcodeStatus = false;
          }
          // this.onPaymentFinalized(success);
        },
        err => {
          this._logHelper.logError(undefined, err);
          this.onPaymentFinalized(false);
        },
        () => {
          this._requesting = false;
          this._tpvMainService.setPluVisible(true);
        });
  }

  private mixtPayment(invoiceMandatory: boolean) {
    // this.btnOpenCashDrawer();
    this._btnWriteDisplayTicket();
    if (!GenericHelper._numberLinePrepaid(this.currentDocument.lines)) {
      this._mixtPaymentInternalSvc.requestMixtPaymentSale(this.currentDocument, PaymentPurpose.NewDocument, invoiceMandatory)
        .first()
        .subscribe(
          success => {
            if (success == undefined) { // se ha cancelado el pago mixto
              // eliminamos los datos de fidelización, si existen
              this._documentInternalService.currentDocument.BarcodeStatus = false;
              const loyaltyAttributionLineIndex = this.currentDocument.lines.findIndex(l => l.isLoyaltyRedemption === true);
              if (loyaltyAttributionLineIndex != -1) {
                this._documentInternalService.deleteLine(loyaltyAttributionLineIndex);
              }
              if (this.currentDocument.loyaltyAttributionInfo != undefined) {
                this.currentDocument.loyaltyAttributionInfo = undefined;
                this._statusBarService.publishMessage(this.getLiteral('document_actions_component',
                  'mixtPayment_statusBarService.publishMessage'));
              }
              this._requesting = false;
            }
            else {
              if (success) {
                // Si tiene "tarjeta" u "Otras Bancarias"
                if (GenericHelper._hasPaymentId(this.currentDocument.paymentDetails,
                  this._appDataConfig.company.id + '10')
                  || GenericHelper._hasPaymentId(this.currentDocument.paymentDetails,
                    this._appDataConfig.company.id + '73')) {
                  // Mixto con tarjeta
                  this.creditCardPayment(invoiceMandatory, endSaleType.mixtPayment);
                } else if (GenericHelper._hasPaymentId(this.currentDocument.paymentDetails,
                  this._appDataConfig.company.id + '01')) {
                  // Mixto con efectivo
                  this.fnCharged(false, endSaleType.mixtPayment);
                } else {
                  if (this.currentDocument.paymentDetails[0].paymentMethodId.substring(5) === PaymentMethodType.localcredit.toString()) {
                    this.fnCharged(true, endSaleType.localcredit);
                  } else {
                    this.fnCharged(true, endSaleType.mixtPayment);
                  }
                }
              }
            }
          },
          err => {
            this._logHelper.logError(undefined, err);
            this.onPaymentFinalized(false);
          },
          () => {
            this._requesting = false;
            this._tpvMainService.setPluVisible(true);
            this._pluService.canSearchWithBarcode = true; // Pana - Para poder buscar con el lectors
          });
    }
    else {
      this._confirmActionSvc.promptActionConfirm(
        this.messajeErrorMultiplePrepago,
        this.getLiteral('document_actions_component', 'literal_confirmActionSvcAccept'), undefined,
        this.getLiteral('document_actions_component', 'literal_confirmActionSvcMessageInfo'),
        ConfirmActionType.Error);
    }
  }

  private dispatchNote() {
    this.dispatchNoteSvc.sendDispatchNote(this.currentDocument)
      .first().subscribe(sendDispatchNoteResult => {
        this.onPaymentFinalized(sendDispatchNoteResult);
      });
  }

  private onPaymentFinalized(response: boolean) {
    if (response) {
      this._documentInternalService.currentDocument.BarcodeStatus = false;
      this._verifiedExistSuppliesTranInDocument(this.currentDocument);
      this._transformToEmptyDocument(this.currentDocument);
      this.currentChanged.typeCall = 0;
      this.currentChanged.isTicket = false;
      this.currentChanged.isCharged = false;
      this.currentChanged.ticket = '';
      this.currentChanged.total = 0;
      this.currentChanged.totalChange = 0;
      this.currentChanged.changePend = 0;
      this.currentChanged.customerId = '';
      this.currentChanged.paymentType = 0;
      this.currentChanged.isStop = false;
      this.currentChanged.counterSecond = 0;
      this.currentChanged.isButtonHidden = true;
      this.currentChanged.isEnabledButtom = true;
      this._changedPaymnetInternalSvc.fnChangedPayment(this.currentChanged);
      if (!this._signalRTMEService.getStatusConnection()) {
        Promise.resolve(this._signalRTMEService.startInitializationProcess()).then(response2 => {
          if (response2.status === TMEApplicationInitResponseStatuses.successful) {
            this._signalRTMEService.setStatusConnection(true);
          } else if (response2.status === TMEApplicationInitResponseStatuses.genericError) {
            this._signalRTMEService.setStatusConnection(false);
          }
        });
      }
    }
    this.saleFinished.emit(response);
    this._requesting = false;
    // Electronic Journal - sellCompleted new
    this._electronicJournal.writeAction({
      type: ActionType.sellCompleted,
      selectedDocument: this._documentInternalSvc.currentDocumentIndex.toString(),
      documentNumber: this._documentInternalSvc.currentDocument.documentNumber,
    });
  }

  // Aplica las promociones indicadas al documento actual
  // version agrupando lineas promocionales
  private _setPromotions(receivedPromotionList: Array<DocumentLinePromotion>) {
    this._logHelper.trace(`Se aplicarán las siguientes PROMOCIONES:`);
    this._logHelper.trace(receivedPromotionList.toString());
    let totalDiscountByPromotions: number = 0;
    let isTarifa: boolean = false;
    this._clearPromotions();
    // desglosar lineas de ticket cuando tienen distintas promociones aplicadas
    // NUEVAS PROMOS: Primero, comprobamos si existe promocion de tipo Cantidad Fija por Importe Minimo a aplicar. Estas son las que se refieren
    // a una linea de ticket ficticia ( -1)
    const promoGlobal = receivedPromotionList.filter(p => p.referredLineNumber < 0).length > 0 ?
      receivedPromotionList.filter(p => p.referredLineNumber < 0)[0] : undefined;
    receivedPromotionList = receivedPromotionList.filter(p => p.referredLineNumber > 0);
    // solo descuentos
    receivedPromotionList.filter(p => p.referredLineNumber > 0  && p.description != 'tarifa local').
      forEach(promotion => {
       promotion.timesApplied = this._promotionsSvc.getTimesAppliedWithDiscount(this.currentDocument, promotion);
      });
    receivedPromotionList.forEach(promotion => {
      if (promotion.description != 'tarifa local') {
        for (let i = 0; i < promotion.timesApplied.length; i++) {
          if (promotion.timesApplied[i] > 0) {
            /*
            if (this.currentDocument.lines[i].isPromoted === undefined || !this.currentDocument.lines[i].isPromoted) {
              this.currentDocument.lines[i].isPromoted = true;
            }
            */
           if (this.currentDocument.lines[i].quantity == promotion.timesApplied[i]) {
            this.currentDocument.lines[i].isPromoted = true;
           }
            else {
              const lineAux = this._documentInternalService.cloneDocument(this.currentDocument).lines[promotion.referredLineNumber - 1];
              lineAux.quantity = promotion.timesApplied[i];
              lineAux.totalAmountWithTax = lineAux.priceWithTax * lineAux.quantity;
              this.currentDocument.lines[promotion.referredLineNumber - 1].quantity =
                this.currentDocument.lines[promotion.referredLineNumber - 1].quantity - lineAux.quantity;
              this.currentDocument.lines[promotion.referredLineNumber - 1].totalAmountWithTax =
                this.currentDocument.lines[promotion.referredLineNumber - 1].quantity *
                this.currentDocument.lines[promotion.referredLineNumber - 1].priceWithTax;
              this._documentInternalService.publishLineDataForSetPromotion(lineAux);
              promotion.referredLineNumber = this.currentDocument.lines.length;
              this.currentDocument.lines[promotion.referredLineNumber - 1].isPromoted = true;
              promotion.timesApplied[this.currentDocument.lines.length - 1] = promotion.timesApplied[i];
              promotion.timesApplied[i] = 0;
              promotion.amountPerUnitInTheInPromo[this.currentDocument.lines.length - 1] = promotion.amountPerUnitInTheInPromo[i];
              promotion.amountPerUnitInTheInPromo[i] = 0;
            }
          }
        }
      }
    });
    // ajustar arrays
    receivedPromotionList.filter(promo => promo.description != 'tarifa local').forEach(
      promotion => {
        for (let line = 0; line < this.currentDocument.lines.length; line++) {
          if (promotion.timesApplied[line] == undefined) {
            promotion.timesApplied[line] = 0;
            promotion.amountPerUnitInTheInPromo[line] = 0;
          }
        }
      }
    );
    receivedPromotionList.forEach(promotion => {
      if (promotion.description != 'tarifa local') { // Si es una promocion
        // const timesAppliedWithDiscount  = this._promotionsSvc.getTimesAppliedWithDiscount(this.currentDocument, promotion);
        for (let i = 0; i < promotion.timesApplied.length; i++) {
          if (promotion.timesApplied[i] > 0) {
            const lineRelated = i;
            /*if (this.currentDocument.lines[i].isPromoted === undefined || !this.currentDocument.lines[i].isPromoted){
              lineRelated = i;
            }
            else{
              let lineAux = this._documentInternalService.cloneDocument(this.currentDocument).lines[promotion.referredLineNumber - 1];
              lineAux.quantity = promotion.timesApplied[i];
              lineAux.totalAmountWithTax = lineAux.priceWithTax * lineAux.quantity ;
              this.currentDocument.lines[promotion.referredLineNumber - 1].quantity =
                this.currentDocument.lines[promotion.referredLineNumber - 1].quantity - lineAux.quantity;
              this.currentDocument.lines[promotion.referredLineNumber - 1].totalAmountWithTax =
                this.currentDocument.lines[promotion.referredLineNumber - 1].quantity *
                this.currentDocument.lines[promotion.referredLineNumber - 1].priceWithTax;
              this._documentInternalService.publishLineData(lineAux);
              promotion.referredLineNumber = this.currentDocument.lines.length;
              lineRelated = this.currentDocument.lines.length - 1;
            }*/
            // creamos dos lineas informativas: una con descuento y otra sin
            const promotionAuxConDesc: DocumentLinePromotion = {
              description: promotion.description,
              discountAmountWithTax: promotion.amountPerUnitInTheInPromo[lineRelated],
              // numberOfTimesApplied: timesAppliedWithDiscount[lineRelated],
              numberOfTimesApplied: promotion.timesApplied[lineRelated],
              promotionId: promotion.promotionId,
              referredLineNumber: lineRelated + 1,
              // timesApplied: promotion.timesApplied,
              // amountPerUnitInTheInPromo: promotion.amountPerUnitInTheInPromo
            };
            /*
            const promotionAuxSinDesc: DocumentLinePromotion = {
              description: promotion.description,
              discountAmountWithTax: 0,
              numberOfTimesApplied: promotion.timesApplied[lineRelated] - timesAppliedWithDiscount[lineRelated],
              promotionId: promotion.promotionId,
              referredLineNumber: lineRelated + 1,
              // timesApplied: promotion.timesApplied,
              // amountPerUnitInTheInPromo: promotion.amountPerUnitInTheInPromo
            };
            */
            if (this.currentDocument.lines[lineRelated].appliedPromotionList == undefined) {
              this.currentDocument.lines[lineRelated].appliedPromotionList = [];
            }
            if (promotionAuxConDesc.discountAmountWithTax != 0) {
              this.currentDocument.lines[lineRelated].appliedPromotionList.push(promotionAuxConDesc);
              this.currentDocument.lines[lineRelated].isPromoted = true;
            }
            /*
            if (promotionAuxSinDesc.numberOfTimesApplied != 0) {
              this.currentDocument.lines[lineRelated].appliedPromotionList.push(promotionAuxSinDesc);
            }
            */
            if (this.currentDocument.lines[lineRelated].discountAmountWithTax == undefined) {
            this.currentDocument.lines[lineRelated].discountAmountWithTax = 0;
            }
            this.currentDocument.lines[lineRelated].discountAmountWithTax =
            promotionAuxConDesc.discountAmountWithTax * promotionAuxConDesc.numberOfTimesApplied;
            // limpiamos descuentos
            /*
            if (this.currentDocument.lines[lineRelated].discountPercentage != undefined) {
              this.currentDocument.lines[lineRelated].discountPercentage = 0;
            }
            */
        }
        if (this.currentDocument.lines[promotion.referredLineNumber - 1].appliedPromotionListHTML == undefined) {
          this.currentDocument.lines[promotion.referredLineNumber - 1].appliedPromotionListHTML = [];
        }
        this.currentDocument.lines[promotion.referredLineNumber - 1].appliedPromotionListHTML.push(promotion);
        totalDiscountByPromotions += promotion.discountAmountWithTax;
      }
      }
      else {
        isTarifa = true; // si en las promociones hay una tarifa local
        if (this.currentDocument.lines[promotion.referredLineNumber - 1].quantity != promotion.numberOfTimesApplied) {
          const lineAux = this._documentInternalService.cloneDocument(this.currentDocument).lines[promotion.referredLineNumber - 1];
          lineAux.priceWithTax =
            lineAux.priceWithTax - (promotion.discountAmountWithTax / promotion.numberOfTimesApplied);
          lineAux.quantity = promotion.numberOfTimesApplied;
          lineAux.totalAmountWithTax = lineAux.priceWithTax * lineAux.quantity;
          lineAux.PVPLocal = true;
          // lineAux.appliedPromotionList = [];
          this.currentDocument.lines[promotion.referredLineNumber - 1].quantity =
            this.currentDocument.lines[promotion.referredLineNumber - 1].quantity - lineAux.quantity;
          this.currentDocument.lines[promotion.referredLineNumber - 1].totalAmountWithTax =
            this.currentDocument.lines[promotion.referredLineNumber - 1].quantity *
            this.currentDocument.lines[promotion.referredLineNumber - 1].priceWithTax;
          // limpiamos descuentos
          /*
          this.currentDocument.lines[promotion.referredLineNumber - 1].discountPercentage = 0;
          this.currentDocument.lines[promotion.referredLineNumber - 1].discountAmountWithoutTax = 0;
          this.currentDocument.lines[promotion.referredLineNumber - 1].discountAmountWithTax = 0;
          lineAux.discountAmountWithTax = 0;
          lineAux.discountPercentage = 0;
          lineAux.discountAmountWithoutTax = 0;
          */
          this._documentInternalService.publishLineDataForSetPromotion(lineAux);
        }
        else {
          this.currentDocument.lines[promotion.referredLineNumber - 1].PVPLocal = true;
          this.currentDocument.lines[promotion.referredLineNumber - 1].priceWithTax = this._roundPipe.transformInBaseCurrency(
            this.currentDocument.lines[promotion.referredLineNumber - 1].priceWithTax -
            (promotion.discountAmountWithTax / promotion.numberOfTimesApplied));
          this.currentDocument.lines[promotion.referredLineNumber - 1].totalAmountWithTax =
            this.currentDocument.lines[promotion.referredLineNumber - 1].priceWithTax *
            this.currentDocument.lines[promotion.referredLineNumber - 1].quantity;
             // limpiamos descuentos
             /*
          this.currentDocument.lines[promotion.referredLineNumber - 1].discountPercentage = 0;
          this.currentDocument.lines[promotion.referredLineNumber - 1].discountAmountWithoutTax = 0;
          this.currentDocument.lines[promotion.referredLineNumber - 1].discountAmountWithTax = 0;
          */
        }
      }
    });
    // if (receivedPromotionList.length > 0) {
    //  this._documentInternalService.notifyPromotionAdded();
    // }
    // NUEVAS PROMOS:
    if (receivedPromotionList.length > 0 || promoGlobal != undefined) {
      this._documentInternalService.notifyPromotionAdded();
    }
    if (isTarifa) {  // Recalcular el totalAmountWithTax despues del aplicar la tarifa local
      let sumTotalLineAux = 0;
      this.currentDocument.lines.forEach(line => {
        sumTotalLineAux += line.totalAmountWithTax;
      });
      this.currentDocument.totalAmountWithTax = sumTotalLineAux;
    }
    // NUEVAS PROMOS
    if (promoGlobal != undefined) {
      // Guardamos la promo de ticket como un nuevo medio de pago
      const promoPM = this._appDataConfig.getPaymentMethodByType(PaymentMethodType.promotion);
      const baseCurrency: Currency = this._appDataConfig.currencyList.find(c => c.priorityType == CurrencyPriorityType.base);
      this.currentDocument.paymentDetails = [{
        paymentMethodId: promoPM.id,
        paymentDateTime: FormatHelper.formatToUTCDateFromLocalDate(new Date()),
        currencyId: baseCurrency.id,
        changeFactorFromBase: 1,
        primaryCurrencyTakenAmount: promoGlobal.discountAmountWithTax,
        primaryCurrencyGivenAmount: 0,
        method: promoPM
      }];
      // incluimos Descuento Fijo
      // totalDiscountByPromotions += promoGlobal.discountAmountWithTax;
      // para la visualizacion del descuento global al final del ticket, lo añadimos al ultimo articulo del ticket
      // Pero Sólo al array de visualizacion, no al array para el informe de promociones
      this.currentDocument.lines[this.currentDocument.lines.length - 1].appliedPromotionListHTML =
        this.currentDocument.lines[this.currentDocument.lines.length - 1].appliedPromotionListHTML.concat(promoGlobal);
      // if (isNaN(this.currentDocument.pendingAmountWithTax)) {
      //   this.currentDocument.totalAmountWithTax -= promoGlobal.discountAmountWithTax;
      // } else {
      //   this.currentDocument.pendingAmountWithTax -= promoGlobal.discountAmountWithTax;
      // }
    }
    this._logHelper.trace(`Total descuento aplicado al documento con las promociones: ${totalDiscountByPromotions.toString()}`);
    this.currentDocument.totalAmountWithTax = this._roundPipe.transformInBaseCurrency(
      this.currentDocument.totalAmountWithTax - totalDiscountByPromotions
    );
    if (this.currentDocument.discountAmountWithTax == undefined) {
      this.currentDocument.discountAmountWithTax = 0;
    }
    this.currentDocument.discountAmountWithTax += this._roundPipe.transformInBaseCurrency(totalDiscountByPromotions);
    // this._logHelper.trace(`Documento DESPUES de completar insercion de lineas de promocion: ${JSON.stringify(this.currentDocument)}`);
    this.promotionsCalculated.emit(true);
  }

  // Vacía las promociones aplicadas al documento actual
  private _clearPromotions() {
    let calculatedTotalAmountWithTax: number = 0;
    if (this.currentDocument && this.currentDocument.lines) {
      this.currentDocument.lines.forEach(line => {
        if (line.appliedPromotionList) {
          line.appliedPromotionList = [];
        }
        if (line.appliedPromotionListHTML) {
          line.appliedPromotionListHTML = [];
        }
        if (line.isPromoted) {
          line.isPromoted = false;
        }
        if (line.quantity > 0 && line.isRemoved != false) {
          calculatedTotalAmountWithTax += line.totalAmountWithTax;
        }
        if (line.PVPLocal) {
          line.PVPLocal = undefined;
        }
      });
      this.currentDocument.totalAmountWithTax = this._roundPipe.transformInBaseCurrency(calculatedTotalAmountWithTax);
      this.currentDocument.discountAmountWithTax = 0;
    }
  }

  private _previewPromotions() {
    if (this._requesting ||
      this.currentDocument == undefined ||
      this.currentDocument.lines == undefined ||
      this.currentDocument.lines.length <= 0) {
      return;
    }
    this._requesting = true;
    this._promotionsSvc.cleanLocalTarif(this.currentDocument); // Pana - Se limpian las tarifas locales si se han aplicado
    this._promotionsSvc.calculatePromotions(this.currentDocument)
      .first()
      .subscribe(
        calculatePromotionsResponse => {
          if (calculatePromotionsResponse.status === ResponseStatus.success) {
            const receivedPromotionsList = calculatePromotionsResponse.object;
            if (receivedPromotionsList != undefined && receivedPromotionsList.length > 0) {
              this._setPromotions(receivedPromotionsList);
            } else {
              this.promotionsCalculated.emit(true);
            }
          }
        });
    this._requesting = false;
  }

  fnChangedDelivered(paymentType: number) {
    if (!this._signalRTMEService.getStatusConnection()) {
      Promise.resolve(this._signalRTMEService.startInitializationProcess()).then(response => {
        if (response.status === TMEApplicationInitResponseStatuses.successful) {
          this._signalRTMEService.setStatusConnection(true);
        } else if (response.status === TMEApplicationInitResponseStatuses.genericError) {
          this._signalRTMEService.setStatusConnection(false);
        }
      });
    }

    if (this.currentDocument == undefined ||
      this.currentDocument.lines == undefined ||
      this.currentDocument.lines.length <= 0 ||
      this.currentDocument.totalAmountWithTax == 0) {
      if (this.currentDocument.totalAmountWithTax == 0) {
        this._statusBarService.publishMessage(this.messajeDocumentCancel);
      }
      return;
    }
    this._pluService.canSearchWithBarcode = false; // Pana - Para no poder buscar con el lector
    if (!GenericHelper._hasMoreOnePrepaid(this.currentDocument.lines)) {
      this._documentInternalService.currentDocument.BarcodeStatus = true;
      if (this.currentDocument.totalAmountWithTax < 9998) {
        if ((this.customerInternalSvc.isUnknownCustomer(this.currentDocument.customer.id)
          && this.currentDocument.totalAmountWithTax > this._appDataSvc.maxAmountForUnkownCustomer)) {
          this.confirmActionSvc.promptActionConfirm(this.getLiteral('document_actions_component',
            'confirmActionSvc.promptActionLimit'),
            this.getLiteral('common', 'aceptar'),
            undefined, this.getLiteral('document_actions_component', 'confirmActionSvc.promptActionInformation'), ConfirmActionType.Information)
            .first().subscribe(confirmResponse => {
              if (!confirmResponse) {
                return;
              }
              this.requestCustomer(false)
                .first().subscribe(customerResult => {
                  if (customerResult == undefined || customerResult.customer == undefined) {
                    return;
                  }
                  this.currentChanged.customerId = customerResult.customer.id;
                  this.currentDocument.customer = customerResult.customer;
                  this.currentDocument.plate = customerResult.plate;

                  this._documentInternalService.setCustomerSelected(customerResult);

                  this.fnSaleEfectivo(paymentType);
                });

            });

        } else {
          this.fnSaleEfectivo(paymentType);
        }
      } else { // importe mayor a 9998
        this.confirmActionSvc.promptActionConfirm(
          this.getLiteral('document_actions_component', 'literal_messageAmountExceeds'),
          this.getLiteral('common', 'aceptar'), undefined,
          this.getLiteral('document_actions_component', 'confirmActionSvc.promptActionInformation'), ConfirmActionType.Information)
          .first().subscribe(confirmResponse => {
            return;
          });
      }
    } else {
      this._confirmActionSvc.promptActionConfirm(
        this.messajeErrorMultiplePrepago,
        this.getLiteral('document_actions_component', 'literal_confirmActionSvcAccept'), undefined,
        this.getLiteral('document_actions_component', 'literal_confirmActionSvcMessageInfo'),
        ConfirmActionType.Error);
    }
  }

  fnSaleEfectivo(paymentType: number) {
    this._requesting = true;
    this._promotionsSvc.cleanLocalTarif(this.currentDocument); // Pana - Se limpian las tarifas locales si se han aplicado
    this._pluService.canSearchWithBarcode = false; // Pana - Para no poder buscar con el lector
    // eliminamos llamada a molulo de promocoines
    this._requesting = false; // Añadido de Pana para aplicar las promociones y pintarlas antes de ir a TME
    this._btnWriteDisplayTicket(); // Pana - Diplay Visor
    // this.btnOpenCashDrawer(); // Pana - Abrir Cajon
    this.currentDocument.lines.forEach(cd => {
      cd.isEditable = false;
    });
    this.currentChanged.typeCall = 1;
    this.currentChanged.isTicket = true;
    this.currentChanged.ticket = 'Ticket ' + (this.currentChanged.selectedIndex + 1);
    this.currentChanged.total = this.currentDocument.totalAmountWithTax;
    this.currentChanged.isCharged = false;
    this.currentChanged.customerId = this.currentDocument.customer.id;
    this.currentChanged.paymentType = paymentType;
    this.currentChanged.isButtonHidden = false;
    this.currentChanged.isEnabledButtom = true;
    this.currentChanged.isButtonFactura = true;
    this.currentChanged.isButtonTicket = true;
    this.currentChanged.changePend = this.currentDocument.totalAmountWithTax;
    if (this.currentDocument.paymentDetails != undefined) {
      this.currentDocument.paymentDetails.forEach(pD => {
        if (pD.method.type == 72) {
          this.currentChanged.changePend -= pD.primaryCurrencyTakenAmount;
        }
      });
    }
    this.currentChanged.totalChange = this.currentDocument.totalAmountWithTax;
    this._changedPaymnetInternalSvc.fnChangedPayment(this.currentChanged);
    this._changedPaymnetInternalSvc.fnDocument(this.currentDocument);
    jQuery('.buttonCancel').css('background-image', 'linear-gradient(104deg, #ffffff 78%, #ffffff 0%)');
    jQuery('.selecArticulo').css('background-color', '#ffffff');
    // Nuevas promociones
    /*
    this._promotionsSvc.calculatePromotions(this.currentDocument)
      .first()
      .subscribe(
        calculatePromotionsResponse => {
          if (calculatePromotionsResponse.status === ResponseStatus.success) {
            const receivedPromotionsList = calculatePromotionsResponse.object;
            if (receivedPromotionsList != undefined && receivedPromotionsList.length > 0) {
              this._setPromotions(receivedPromotionsList);
            } else {
              this.promotionsCalculated.emit(true);
            }
          }
          this._requesting = false; // Añadido de Pana para aplicar las promociones y pintarlas antes de ir a TME
          this._btnWriteDisplayTicket(); // Pana - Diplay Visor
          // this.btnOpenCashDrawer(); // Pana - Abrir Cajon
          this.currentDocument.lines.forEach(cd => {
            cd.isEditable = false;
          });
          this.currentChanged.typeCall = 1;
          this.currentChanged.isTicket = true;
          this.currentChanged.ticket = 'Ticket ' + (this.currentChanged.selectedIndex + 1);
          this.currentChanged.total = this.currentDocument.totalAmountWithTax;
          this.currentChanged.isCharged = false;
          this.currentChanged.customerId = this.currentDocument.customer.id;
          this.currentChanged.paymentType = paymentType;
          this.currentChanged.isButtonHidden = false;
          this.currentChanged.isEnabledButtom = true;
          this.currentChanged.isButtonFactura = true;
          this.currentChanged.isButtonTicket = true;
          if (this.currentDocument.paymentDetails[0] != undefined) {
            // tslint:disable-next-line:max-line-length
            this.currentChanged.changePend = this.currentDocument.totalAmountWithTax - this.currentDocument.paymentDetails[0].primaryCurrencyGivenAmount;
          } else { this.currentChanged.changePend = this.currentDocument.totalAmountWithTax; }
          // this.currentChanged.changePend = this.currentDocument.totalAmountWithTax;
          this.currentChanged.totalChange = this.currentDocument.totalAmountWithTax;
          this._changedPaymnetInternalSvc.fnChangedPayment(this.currentChanged);
          this._changedPaymnetInternalSvc.fnDocument(this.currentDocument);
          jQuery('.buttonCancel').css('background-image', 'linear-gradient(104deg, #ffffff 78%, #ffffff 0%)');
          jQuery('.selecArticulo').css('background-color', '#ffffff');
        });
      */
  }

  fnCharged(isAccept: boolean = false, paymentType: endSaleType = endSaleType.cash) {
    if (!isAccept) {
      if (this._signalRTMEService.getStatusConnection()) {
        // preguntaremos si quiere fidelizar o no
        this.confirmActionSvc.promptActionConfirmStatic(
          this.messajeconfirmAction,
          this.getLiteral('document_actions_component', 'confirmActionSvc.Yes'), this.getLiteral('document_actions_component', 'confirmActionSvc.No'),
          this.getLiteral('document_actions_component', 'confirmActionSvc.Confirm'),
          ConfirmActionType.Question)
          .subscribe(response => {
            if (response === undefined) { }
            else if (response) {
              // Efectivo fidelización SI (tarjeta)
              this.requestEndSale(endSaleType.creditCard, false);
            }
            else {
              // Efectivo fidelización NO (SorteoEfectivo)
              this._efectivoFidelizarNo(paymentType);
            }
          },
            err => {
              this._logHelper.logError(undefined, err);
              this.onPaymentFinalized(false);
            },
            () => {
              this._requesting = false;
              this._tpvMainService.setPluVisible(true);
            });
      } else {
        // Efectivo fidelización NO (SorteoEfectivo)
        this._requesting = false;
        this._tpvMainService.setPluVisible(true);
        this._efectivoFidelizarNo(paymentType);
      }
    } else {
      this.currentChanged.typeCall = 2;
      this.currentChanged.isTicket = true;
      this.currentChanged.isCharged = true;
      this.currentChanged.counterSecond = 0;
      this.currentChanged.isStop = false;
      this.currentChanged.isButtonHidden = true;
      this.currentChanged.paymentType = paymentType;
      this.currentChanged.isButtonHidden = true;
      this.currentChanged.isEnabledButtom = true;
      this.currentChanged.isButtonFactura = true;
      this.currentChanged.isButtonTicket = true;
      if (paymentType == endSaleType.mixtPayment || paymentType == endSaleType.creditCard) {
        // tslint:disable-next-line:max-line-length
        this.currentDocument.cambio = this.currentDocument.changeDelivered != undefined ? this.currentDocument.changeDelivered : 0.00;
      } else {
        // tslint:disable-next-line:max-line-length
        this.currentDocument.cambio = this.currentChanged.totalChange != undefined ? this.currentChanged.totalChange : 0.00;
      }
      this.currentChanged.totalChange = this.currentDocument.cambio;
      // Se comenta para que no vuelva a asignar el documento, ya que se ha asignado el que devuelve el TME.
      this._changedPaymnetInternalSvc.fnChangedPayment(this.currentChanged);
      if (paymentType != endSaleType.cash && paymentType != endSaleType.creditCard) {
        this._changedPaymnetInternalSvc.fnDocument(this.currentDocument);
        this._requesting = false;
        this.requestEndSale(endSaleType.cash);
        this._tpvMainService.setPluVisible(true);
      }
    }
  }


  private _efectivoFidelizarNo(paymentType: endSaleType) {

    this.currentChanged.typeCall = 2;
    this.currentChanged.isTicket = true;
    this.currentChanged.isCharged = true;
    this.currentChanged.counterSecond = 0;
    this.currentChanged.isStop = false;
    this.currentChanged.paymentType = paymentType;
    this.currentChanged.isButtonHidden = true;
    this.currentChanged.isEnabledButtom = true;
    this.currentChanged.isButtonFactura = true;
    this.currentChanged.isButtonTicket = true;
    if (paymentType == endSaleType.mixtPayment) {
      // tslint:disable-next-line:max-line-length
      this.currentDocument.cambio = 0;
    } else {
      // tslint:disable-next-line:max-line-length
      this.currentDocument.cambio = this.currentChanged.totalChange != undefined ? this.currentChanged.total + this.currentChanged.totalChange : this.currentChanged.total;
    }
    this._changedPaymnetInternalSvc.fnDocument(this.currentDocument);
    this._changedPaymnetInternalSvc.fnChangedPayment(this.currentChanged);
    this.requestEndSale(endSaleType.cash);
  }

  // Pana - Cajon y Visor - 12/03/2019
  // talonsoc 14/10/19 - añadir decimales cuando el importe es entero
  private _btnWriteDisplayTicket() {
    this.OPOS_WriteDisplayTicket(this.getLiteral('common', 'total'),
      // this.currentDocument.totalAmountWithTax.toString() + ' ' + this._appDataConfig.baseCurrency.symbol)
      GenericHelper.ToStringWithDecimals(this.currentDocument.totalAmountWithTax) + ' ' + this._appDataConfig.baseCurrency.symbol)
      .first().subscribe(response => {
        /*if (response) {
          this._statusBarService.publishMessage('mensaje enviado');
        } else {
          this._statusBarService.publishMessage('no se ha podido establecer comunicacion con el visor');
        }*/
      });
  }

  private OPOS_WriteDisplayTicket(strLinea1: string, strLinea2: string): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      Promise.resolve(this._signalROPOSService.OPOSWriteDisplay(strLinea1, strLinea2).then(responseOPOS => {
        if (responseOPOS.status === OPOSWriteDisplayResponseStatuses.successful) {
          observer.next(true);
        } else if (responseOPOS.status === OPOSWriteDisplayResponseStatuses.genericError) {
          observer.next(false);
        }
      }));
    });
  }

  btnOpenCashDrawer() {
    this._OPOS_OpenCashDrawer()
      .first().subscribe(response => {
        /*if (response) {
          this._statusBarService.publishMessage('Cajon Abierto');
        } else {
          this._statusBarService.publishMessage('No se ha podido establecer la comunicación con el CAJON');
        }*/
      });
  }

  private _OPOS_OpenCashDrawer(): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      Promise.resolve(this._signalROPOSService.OPOSOpenCashDrawer().then(responseOPOS => {
        if (responseOPOS.status === OPOSOpenCashDrawerResponseStatuses.successful) {
          observer.next(true);
        } else if (responseOPOS.status === OPOSOpenCashDrawerResponseStatuses.genericError) {
          observer.next(false);
        }
      }));
    });
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

  private _transformToEmptyDocument(currentDocument: Document): Document {
    currentDocument.lines = [];
    currentDocument.totalAmountWithTax = 0;
    currentDocument.showAlertInsertOperator = false;
    currentDocument.showAlertInsertCustomer = false;
    currentDocument.usedDefaultOperator = false;
    currentDocument.loyaltyAttributionInfo = undefined;
    currentDocument.documentId = undefined;
    currentDocument.documentNumber = undefined;
    currentDocument.provisionalId = undefined;
    currentDocument.referencedProvisionalIdList = [];
    currentDocument.referencedDocumentIdList = [];
    currentDocument.referencedDocumentNumberList = [];
    currentDocument.series = undefined;
    currentDocument.paymentDetails = [];
    currentDocument.emissionLocalDateTime = undefined;
    currentDocument.emissionUTCDateTime = undefined;
    currentDocument.kilometers = undefined;
    currentDocument.discountPercentage = undefined;
    currentDocument.discountAmountWithTax = undefined;
    currentDocument.totalTaxableAmount = 0;
    currentDocument.totalTaxAmount = 0;
    currentDocument.taxableAmount = 0;
    currentDocument.totalTaxList = undefined;
    currentDocument.taxableAmountList = undefined;
    currentDocument.extraData = undefined;
    currentDocument.changeDelivered = undefined;
    currentDocument.pendingAmountWithTax = 0;
    currentDocument.loyaltyAttributionInfo = undefined;
    currentDocument.plate = undefined;
    currentDocument.cambio = undefined;
    currentDocument.isPrinted = undefined;
    return currentDocument;
  }

  private _verifiedExistSuppliesTranInDocument(currentDocument: Document) {
    if (currentDocument) {
      if (currentDocument.lines.find(x => x.businessSpecificLineInfo != undefined && x.businessSpecificLineInfo.supplyTransaction != undefined)) {
        this._documentService.notifySaleCancelSuppliesAnulated();
      }
    }
  }
}
