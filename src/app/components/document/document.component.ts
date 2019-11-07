import { Component, OnInit, ViewContainerRef, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { MdTabChangeEvent } from '@angular/material';
import 'rxjs/add/operator/first';
import { RoundPipe } from 'app/pipes/round.pipe';
import { IDimensionable } from 'app/shared/idimensionable';
import { HostDimensionable } from 'app/shared/host-dimensionable';
import { IViewContainerReferenceable } from 'app/shared/iview-container-referenceable';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { Document } from 'app/shared/document/document';
import { Customer } from 'app/shared/customer/customer';
import { Operator } from 'app/shared/operator/operator';
import { OperatorInternalService } from 'app/services/operator/operator-internal.service';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { TpvMainService } from 'app/services/tpv/tpv-main.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { Currency } from 'app/shared/currency/currency';
import { AuxiliarActionsManagerService } from 'app/services/auxiliar-actions/auxiliar-actions-manager.service';
import { CustomerInternalService } from 'app/services/customer/customer-internal.service';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { AlertsService } from 'app/services/alerts/alerts.service';
import { AlertPurposeType } from 'app/shared/alerts/alert-purpose-type.enum';
import { AlertsInternalService } from 'app/services/alerts/alerts-internal.service';
import { ConfirmActionService } from '../../services/confirm-action/confirm-action.service';
import { ConfirmActionType } from '../../shared/confirmAction/confirm-action-type.enum';
import { CustomerAddInformationResult } from '../../shared/customer-add-information/customer-add-information-result';
import { DocumentLine } from 'app/shared/document/document-line';
import { DocumentSeriesService } from 'app/services/document/document-series.service';
import { FinalizingDocumentFlowType } from 'app/shared/document/finalizing-document-flow-type.enum';
import { CashPaymentService } from 'app/services/payments/cash-payment.service';
import { CustomerSelectedResult } from '../../shared/customer/customer-selected-result';
import { PromotionsService } from 'app/services/promotions/promotions.service';
import { GenericHelper } from 'app/helpers/generic-helper';
import { FuellingPointsService } from 'app/services/fuelling-points/fuelling-points.service';
import { FuellingPointFormatConfiguration } from 'app/shared/fuelling-point/fuelling-point-format-configuration';
import { FuellingPointsInternalService } from 'app/services/fuelling-points/fuelling-points-internal.service';
import { ChangePaymentInternalService } from 'app/services/payments/change-payment-internal.service';
import { changedPayment } from 'app/shared/payments/changed-payment';
import { isNullOrUndefined } from 'util';
import { SignalROPOSService } from 'app/services/signalr/signalr-opos.service';
import { OPOSWriteDisplayResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/opos-writedisplay-response-statuses.enum';
import { SessionInternalService } from 'app/services/session/session-internal.service';
import { Subscription } from 'rxjs/Subscription';
import { LanguageService } from 'app/services/language/language.service';
import { PluService } from 'app/services/plu/plu.service';
import { OperatorService } from 'app/services/operator/operator.service';
import { ResponseStatus } from 'app/shared/response-status.enum';
import { DocumentLinePromotion } from 'app/shared/document/document-line-promotion';
import { LogHelper } from 'app/helpers/log-helper';
import { PluInternalService } from 'app/services/plu/plu-internal.service';
import { DocumentService } from 'app/services/document/document.service';
import { PaymentMethodType } from 'app/shared/payments/payment-method-type.enum';
import { FormatHelper } from 'app/helpers/format-helper';
import { CurrencyPriorityType } from 'app/shared/currency/currency-priority-type.enum';
import { FuellingPointInfo } from 'app/shared/fuelling-point/fuelling-point-info';
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
import { SignalRMultiTPVService } from 'app/services/signalr/signalr-multitpv.service';

@Component({
  selector: 'tpv-document',
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.scss'],
  viewProviders: []
})
export class DocumentComponent extends HostDimensionable
  implements OnInit, AfterViewInit, IDimensionable, IViewContainerReferenceable {
  @ViewChild('documentContainerHost', { read: ViewContainerRef }) viewContainerRef: ViewContainerRef;
  @ViewChild('documentLinesContainer') documentLinesContainer: ElementRef;
  // documents con id y lineas de document
  documents: Array<Document> = [];
  linesAnul: Array<DocumentLine> = [];
  // Two way binded with mat-tabs component
  selectedDocumentIndex = 0;
  // divisa base
  baseCurrency: Currency;
  npestana: number = 1;
  // configuracion de formatos
  formatConfig: FuellingPointFormatConfiguration;
  promotionsCalculated: boolean = false;
  clienteChanged: boolean = false;
  disabledButtonResetDocument: boolean = false;
  alerta: boolean = false;
  // comprueba el llamado del metodo
  isCloseSession: boolean = false;
  private _subscriptions: Subscription[] = [];

  private _isPromotionVisible: boolean = false;
  private _isPreviewPromotionsApplied: boolean = true;
  changedDelivered: boolean;
  changed: changedPayment = {
    selectedIndex: -1, typeCall: 0, isTicket: false, ticket: '', total: 0, isCharged: false, totalChange: 0, changePend: 0
    , customerId: '', paymentType: 0, counterSecond: 0, isStop: false, isButtonHidden: true, isButtonFactura: true, isButtonTicket: true
  };
  valWidth: number;
  arrayChanged: Array<changedPayment> = [];
  documentsTab: Array<Document> = [];
  operador: string = '';
  customer_businessName: string = '';
  customer_matricula: string = '';
  linesNew: Array<DocumentLine> = [];
  contador: number = 0;
  documentAct: number = 0;
  globalPromo: number = 0;

  constructor(
    private _documentSeriesService: DocumentSeriesService,
    private _cashPaymentService: CashPaymentService,
    private _elRef: ElementRef,
    private _appDataConfig: AppDataConfiguration,
    private _operatorInternalService: OperatorInternalService,
    private _statusBarService: StatusBarService,
    private _documentInternalService: DocumentInternalService,
    private _tpvMainService: TpvMainService,
    private _roundPipe: RoundPipe,
    private _auxActionsManager: AuxiliarActionsManagerService,
    private _customerInternalService: CustomerInternalService,
    private _alertService: AlertsService,
    private _alertInternalService: AlertsInternalService,
    private _confirmActionSvc: ConfirmActionService,
    private _promotionsService: PromotionsService,
    private _fpSvc: FuellingPointsService,
    private _fpInternalSvc: FuellingPointsInternalService,
    private _changedPaymnetInternalSvc: ChangePaymentInternalService,
    private _signalROPOSService: SignalROPOSService,
    private _session: SessionInternalService,
    private _languageService: LanguageService,
    private _pluService: PluService,
    private _operatorService: OperatorService,
    private _pluInternalService: PluInternalService,
    private _documentService: DocumentService,
    private _conf: MinimumNeededConfiguration,
    private _signalrMultitpv: SignalRMultiTPVService,
    private _logHelper: LogHelper,
  ) {
    super();
    this._logHelper.trace('DocumentComponent created.');

    window.addEventListener('resize', () => this._setHostHeight());

  }

  ngOnInit() {
    this.valWidth = 35;
    this._setInitialData();
    this._setInitialDocumentData();
    this.formatConfig = this._fpInternalSvc.formatConfiguration;
    this._btnWriteDisplaySiguiente(); // Pana visor al iniciar
    // suscribirse al evento cuando un usuario añade un producto para el documento
    this._subscriptions.push(this._documentInternalService.lineInsertionRequested().subscribe(lineToInsert => {
      if (this.currentDocument.lines == undefined) {
        this.currentDocument.lines = [];
      }
      lineToInsert.ticket = this.selectedDocumentIndex + 1;
      this.currentDocument.lines.push(lineToInsert);
      this._documentChanged();
      this._setPluVisible();
      // tslint:disable-next-line:max-line-length
      this._statusBarService.publishMessage(
        `${this.getLiteral('document_component', 'message_StatusBar_ArticleAdd')} ${this.selectedDocumentIndex + 1}`);
    }));

    this._subscriptions.push(this._documentService.currentDocument$
      .subscribe((response: Document) => {
        if (response != undefined) {
          this.documents[this.selectedDocumentIndex] = response;
          setTimeout(() => {
            this._setHostHeight();
          }, 0);
        }
      }));

    // suscribirse a evento que pide limpiar ticket
    this._documentInternalService.documentResetRequested().subscribe(response => {
      if (response != undefined) {
        this.resetDocument(response.mustResetOperator);
      }
    });
    this._subscriptions.push(this._operatorInternalService.operador$.subscribe(d => {
      this.requestOperator();
    }));
    this._subscriptions.push(this._documentInternalService.linePromotionAdded().subscribe(_ => {
    }));

    this._subscriptions.push(this._documentInternalService.resetDocumentRequested().subscribe(response => {
      if (response != undefined) {
        this.resetDocument(false, false, response.result);
      }
    }));

    this._subscriptions.push(this._documentInternalService.documentClear().subscribe(response => {
      if (response != undefined) {
        this.resetDocument(false, true, response.result);
      }
    }));


    this._subscriptions.push(this._documentInternalService.lineDeletionRequested().subscribe(lineIndex => {
      if (lineIndex != undefined && lineIndex > -1) {
        this.currentDocument.lines.splice(lineIndex, 1);
        this._recalculateDocumentTotalAmmount();
        this._documentChanged();
      }
    }));

    this._subscriptions.push(this._documentInternalService.cleanDocumentLinesRequested().subscribe(param => {
      this.cleanDocumentLines();
    }));

    this._subscriptions.push(this._documentInternalService.getCustomerSelected().subscribe(req => {
      this._setCustomer(req);
    }));
    this._subscriptions.push(this._session.ActivacionPopup$.subscribe(data => {
      if (data) {
        this.alerta = true;
        }
     }));
    this._subscriptions.push(this._session.clickConfirmActionDispenser$.subscribe(data => {
     if (data) {
       this.alerta = false;
       this._session.fnDesactivarPopup(false);
       }
    }));
    /*
    this._changedPaymnetInternalSvc.resetDocument$.subscribe(dato => {
      if (dato == true) {
      this.resetDocument(false, true);
      }
    });
    */

    this._subscriptions.push(this._changedPaymnetInternalSvc.changedPayment$.subscribe(param => {
      this.changed = param;
      this.valWidth = param.isButtonHidden ? 35 : 20;
      if (param.typeCall === 0) {
        this.currentDocument.lines.forEach(p => {
          p.isEditable = true;
        });
        this.restableceWithHeader();
      } else {
        // variar header
        this._setlengthwidthHeader();
      }
      setTimeout(() => {
        this._setHostHeight();
      }, 1);
    }));

    this.creaBtn();

    this._subscriptions.push(this._session.getOperatorToLoginSession$.subscribe(operator => {
      if (operator != undefined) {
        this.fnLoginOperator(operator);
        this.currentDocument.showAlertInsertOperator = false;
      } else {
        this.fnLogoutOperator();
        this.currentDocument.showAlertInsertOperator = true;
      }
    }));

    this._subscriptions.push(this._pluInternalService.listenerdisabledResetDocument().subscribe((req) => {
      this.disabledButtonResetDocument = req || false;
    }));


  }

  // Recalculamos altura al hacer resize de la pantalla y en el evento onSelect
  ngAfterViewInit() {
    this._elRef.nativeElement.classList.add('tpv-document');
    this._elRef.nativeElement.classList.add('noP');
    this._elRef.nativeElement.classList.add('document-wrapper');
    // NOTA: hack timeout para ejecutar funciones estando ya renderizado el HTML
    setTimeout(() => {
      this._setHostHeight();
    }, 0);
    // $(this._elRef.nativeElement).draggable();
  }
  /*
    ngAfterViewChecked() {
      if (this._hasToScrollDownLinesContainer) {
        this.documentLinesContainer.nativeElement.scrollTop = this.documentLinesContainer.nativeElement.scrollHeight;
        this._hasToScrollDownLinesContainer = false;
      }
    }*/

  get currentDocument(): Document {
    return this.documents[this.selectedDocumentIndex];
  }

  get currentChange(): changedPayment {
    return this.arrayChanged[this.selectedDocumentIndex];
  }

  // TODO método que necesite modificar este valor
  setContactId(contactId: string) {
    this.currentDocument.contactId = contactId;
  }

  // TODO método que necesite modificar este valor
  setKilometers(kilometers: number) {
    this.currentDocument.kilometers = kilometers;
  }

  // añade un rectángulo de decoración para indicar ticket abierto (con operador y cliente)
  setDocumentOpened(documentInternalId: number) {
    // creating html decorator
    const element = document.createElement('div');
    element.id = 'md-tab-bar-0-' + documentInternalId;
    // element.className = 'mat-ink-bar';
    // append html decorator
    const label = document.getElementById('md-tab-label-0-' + documentInternalId);
    label.appendChild(element);
  }

  // elimina el rectángulo de decoración para indicar ticket cerrado (sin cliente y/o operador)
  setDocumentClosed(documentInternalId: number) {
    // search html decorator
    const decorator = document.getElementById('md-tab-bar-0-' + documentInternalId);
    if (decorator != undefined) {
      // removing html decorator
      const label = document.getElementById('md-tab-label-0-' + documentInternalId);
      label.removeChild(decorator);
    }
  }

  // actualizamos documento seleccionado
  documentSelected(ev: MdTabChangeEvent) {
    // Si el evento es llamado al cerrar la session, no se ejecuta.
    this.currentDocument.bloqClient = false;
    this._logHelper.trace(`DocumentComponent->documentSelected: Selected document index: ${ev.index}`);
    this._documentChanged();
    this._setPluVisible();
    // volvemos a calcular alturas CSS
    this._setHostHeight();
    // especificamos datos específicos del documento
    this._setInitialDocumentData();
    this._llenarButons(ev);
    // funcionalidad dinamica de Pagos
    /* this.currentChange.counterSecond = 0;
     this.currentChange.isStop = false;*/
    this._changedPaymnetInternalSvc.fnDocument(this.currentDocument);
    this._changedPaymnetInternalSvc.fnChangedPayment(this.currentChange);
    this._changedPaymnetInternalSvc.fnTicketSelected(ev.index);
  }

  operatorHasValue(operator: Operator): boolean {
    return operator != undefined;
  }

  customerHasValue(customer: Customer): boolean {
    return customer != undefined;
  }
  isDocumentBlocked(): boolean {
    return this.currentDocument.isLocked;
  }
  cleanDocumentLines() {
    if (this.documents.length > 0 && this.selectedDocumentIndex >= 0) {
      const currentDocument = this.documents[this.selectedDocumentIndex];
      if (currentDocument != undefined) {
        currentDocument.lines = [];
        this._setCustomer(undefined);
        this._requestOperatorCustomer();
        this.resetDocument(false, true);
      }
    }
  }

  // Al pulsar el boton anular del ticket, anula cada una de las lineas del ticket y las enviar a BBDD
  resetDocument(mustResetOperator: boolean = false, saleFinished = false, result: boolean = false) {
    this.globalPromo = 0;
    const currentDocument = this.currentDocument;
    // si es fin de venta, limpiamos sin entrar linea a linea.
    if (saleFinished) {
      this.resetFunc(mustResetOperator, saleFinished);
      return;
    }
    // Se comprueba si el documento tiene al menos una linea y mostramos un mensaje de confirmacion
    // tslint:disable-next-line:max-line-length
    if (result) {
      this.ResetDocumnentData(result, mustResetOperator, saleFinished);
    } else {
      if (currentDocument.lines.length > 0) {
        this._confirmActionSvc.promptActionConfirm(this.getLiteral('document_component', 'confirmActionSvc.messajeconfirmAction'),
          this.getLiteral('document_component', 'confirmActionSvc.Accept'),
          this.getLiteral('document_component', 'confirmActionSvc.Cancel'))
          .first().subscribe(confirmResponse => {
            this.ResetDocumnentData(confirmResponse, mustResetOperator, saleFinished);
          });
      }
    }
    this.contador = 0;
  }

  resetFunc(mustResetOperator: boolean = false, saleFinished = false) {
    if (saleFinished) {
      this._documentInternalService.lines = new Array<DocumentLine>();
    }
    const currentDocument = this.currentDocument;

    this._transformToEmptyDocument(currentDocument);

    this._statusBarService.publishMessage(``);
    this._alertService.getActiveAlerts(AlertPurposeType.showOnSaleFinished, this.currentDocument.operator)
      .first()
      .subscribe(alerts => {
        // this._logHelper.trace(JSON.stringify(alerts));
        this._alertInternalService.showAvailableAlerts(alerts)
          .first()
          .subscribe(_ => {
            if (mustResetOperator === true) {
              currentDocument.operator = undefined;
              this._operatorInternalService.currentOperator = undefined;
              this._setOperator(undefined);
            }
            this._customerInternalService.currentCustomer = this.currentDocument.customer;
            this.setDocumentClosed(this.selectedDocumentIndex);
            if (!saleFinished) {
              // pedimos operador si no hay, si no customer
              this._requestOperatorCustomer();
            }
            /*else {
              this.requestCustomer();
            }*/
            // his.documents[this.selectedDocumentIndex] = currentDocument;
            this._documentChanged();
          });
      });
  }

  ResetDocumnentData(confirmResponse: boolean, mustResetOperator: boolean = false, saleFinished = false) {
    const currentDocument = this.currentDocument;
    const supplyTransactions: any = [];

    if (confirmResponse) {
      // Si confirmamos, recorremos el documento eliminando las lineas negativas
      for (let i = 0; i < currentDocument.lines.length; i++) {
        // tslint:disable-next-line:max-line-length
        if (this.documents[this.selectedDocumentIndex].lines[i].quantity < 0) {
          this.documents[this.selectedDocumentIndex].lines.splice(i, 1);
          i--;
        }
      }
      // Recorremos el documento insertando en una array de linea una linea negativa por cada linea positiva
      this.linesAnul = new Array<DocumentLine>();
      for (let i = 0; i < currentDocument.lines.length; i++) {

        const isSupplyTransaction = currentDocument.lines[i].businessSpecificLineInfo;
        if (isSupplyTransaction) {
           supplyTransactions[supplyTransactions.length] = isSupplyTransaction;
          if (isSupplyTransaction.supplyTransaction) {
            // desbloqueamos de transacciones virtuales
            if (isSupplyTransaction.supplyTransaction) {
              const request = { transacctionId: isSupplyTransaction.supplyTransaction.id,
                posIdTpv: 0,
                type: 'update'
              };
              this._signalrMultitpv.requestNotifyGenericChangesRed('changeTransactionVirtual', JSON.stringify(request)).subscribe(
                respuesta => {
                  if (!respuesta) {
                    this._signalrMultitpv.setDocumentVirtualMultiTpv(request);
                  }
                }
              );
            }
          }
        } else {
          this.linesAnul.push(this.documents[this.selectedDocumentIndex].lines[i]);
          const documentLine2: DocumentLine = {
            description: this.documents[this.selectedDocumentIndex].lines[i].description,
            discountPercentage: this.documents[this.selectedDocumentIndex].lines[i].discountPercentage,
            // tslint:disable-next-line:max-line-length
            totalAmountWithTax: this.documents[this.selectedDocumentIndex].lines[i].totalAmountWithTax - this.documents[this.selectedDocumentIndex].lines[i].totalAmountWithTax * 2,
            productId: this.documents[this.selectedDocumentIndex].lines[i].productId,
            appliedPromotionList: this.documents[this.selectedDocumentIndex].lines[i].appliedPromotionList,
            taxAmount: this.documents[this.selectedDocumentIndex].lines[i].taxAmount,
            priceWithoutTax: this.documents[this.selectedDocumentIndex].lines[i].priceWithoutTax,
            quantity: this.documents[this.selectedDocumentIndex].lines[i].quantity * -1,
            priceWithTax: this.documents[this.selectedDocumentIndex].lines[i].priceWithTax,
            taxPercentage: this.documents[this.selectedDocumentIndex].lines[i].taxPercentage,
            discountAmountWithTax: this.documents[this.selectedDocumentIndex].lines[i].discountAmountWithTax,
            originalPriceWithTax: this.documents[this.selectedDocumentIndex].lines[i].originalPriceWithTax,
            idCategoria: '',
            nameCategoria: '',
            isConsigna: this.documents[this.selectedDocumentIndex].lines[i].isConsigna
          };
          this.linesAnul.push(documentLine2);
          this.linesAnul.forEach(elem => elem.isRemoved = true);
        }
      }
      // Creamos un nuevo objeto document con los datos del documento original pero con las lineas anuladas
      // Se indica todos los campos totales a 0 por la cancelacion del tickets
      const documentoAnulado: Document = {
        totalAmountWithTax: 0,
        lines: this.linesAnul,
        operator: currentDocument.operator,
        customer: currentDocument.customer,
        showAlertInsertOperator: currentDocument.showAlertInsertCustomer,
        usedDefaultOperator: currentDocument.usedDefaultOperator,
        documentId: currentDocument.documentId,
        documentNumber: currentDocument.documentNumber,
        provisionalId: currentDocument.provisionalId,
        referencedProvisionalIdList: currentDocument.referencedProvisionalIdList,
        referencedDocumentIdList: currentDocument.referencedDocumentIdList,
        series: currentDocument.series,
        paymentDetails: currentDocument.paymentDetails,
        emissionLocalDateTime: currentDocument.emissionLocalDateTime,
        emissionUTCDateTime: currentDocument.emissionUTCDateTime,
        contactId: currentDocument.contactId,
        kilometers: currentDocument.kilometers,
        currencyId: currentDocument.currencyId,
        discountPercentage: 0,
        discountAmountWithTax: 0,
        totalTaxableAmount: 0,
        totalTaxAmount: 0,
        taxableAmount: 0,
        totalTaxList: currentDocument.totalTaxList,
        taxableAmountList: currentDocument.taxableAmountList,
        extraData: currentDocument.extraData,
        changeDelivered: 0,
        pendingAmountWithTax: 0,
        loyaltyAttributionInfo: currentDocument.loyaltyAttributionInfo,
        showAlertInsertCustomer: currentDocument.showAlertInsertCustomer,
        posId: currentDocument.posId != undefined ? currentDocument.posId : this._appDataConfig.userConfiguration.posId
      };
      try {
        if (supplyTransactions.length > 0) {

          const listaIdSumiAnul: number[] = [];

          for (let i = 0; i < supplyTransactions.length; i++) {
            if (supplyTransactions[i].data) {
              if (supplyTransactions[i].data.supplyTransaction.anulated == true) {
                listaIdSumiAnul.push(supplyTransactions[i].data.supplyTransaction.id);
              }
            } else {
              if (supplyTransactions[i]._data) {
                listaIdSumiAnul.push(supplyTransactions[i]._data.idFuellingPoint);
              }
            }
          }

          if (listaIdSumiAnul.length > 0) {
            this._fpSvc.UpdateSupplyAnulatedEnTicket(listaIdSumiAnul, false)
              .first().subscribe(responseUpdate => {
                if (responseUpdate == undefined || responseUpdate == false) {
                  this._logHelper.trace('Error en la actualización del EnTicket.');
                }
              });
          }

          for (let i = 0; i < supplyTransactions.length; i++) {

            if (supplyTransactions[i] != undefined) {
              const supply = supplyTransactions[i].supplyTransaction;
              if (supply) {
                const idTransaction = supplyTransactions[i].supplyTransaction.id;
                const idfuellingPoint = supplyTransactions[i].supplyTransaction.fuellingPointId;
                if (!supply.isVirtual) {
                  if (idTransaction != undefined && idfuellingPoint != undefined
                    && (supplyTransactions[i].data.supplyTransaction.anulated == undefined
                      || supplyTransactions[i].data.supplyTransaction.anulated == false)) {
                    this._fpSvc.unlockSupplyTransaction(idTransaction, idfuellingPoint)
                      .first().subscribe(response => {
                        this._statusBarService.publishMessage(this.getLiteral('document_component', 'message_StatusBar_SaleDelete'));
                      });
                  } else {
                    this._statusBarService.publishMessage(this.getLiteral('document_component', 'message_StatusBar_SaleDelete'));
                  }
                }
              }

              const data = supplyTransactions[i]._data;
              if (data) {
                if (this._fpInternalSvc.fpListInternal) {
                  const fpCancel: FuellingPointInfo = this._fpInternalSvc.fpListInternal.find(x => x.id == data.idFuellingPoint);
                  this._fpSvc.requestChangeServiceModeMultiTPV(fpCancel.oldServiceModeType, fpCancel.id, this._conf.POSInformation.code,
                    fpCancel.oldHasPostPaidTransaction, fpCancel.oldHasPrePaidTransaction,
                    fpCancel.serviceModeType, fpCancel.hasPostPaidTransaction, fpCancel.hasPrePaidTransaction)
                  .first().subscribe(response => {
                    this._fpSvc.manageRequestCancelPreset(supplyTransactions[i]._data.idFuellingPoint).first().subscribe(response => {
                      this._statusBarService.publishMessage(this.getLiteral('document_component', 'message_StatusBar_SaleDelete'));
                    });
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        this._statusBarService.publishMessage(this.getLiteral('common', 'error'));
        currentDocument.totalAmountWithTax = 0;
      }
      // limpiamos las lineas del documento y enviamos el documento para la insercion
      currentDocument.totalAmountWithTax = 0;
      currentDocument.lines = [];
      this._documentInternalService.setLinesFromDocument(this.countLinesDocuments());
      this.sendSale(documentoAnulado);
      if (saleFinished) {
        this.resetFunc(mustResetOperator, saleFinished);
        return;
      }
    } else {
      this._setPluVisible();
    }
  }

  countLinesDocuments(): number {
    let countLinesOnDocument: number = 0;
    this.documents.forEach((element, index) => {
      countLinesOnDocument += element.lines.length;
    });
    return countLinesOnDocument;
  }

  // Metodo para enviar el documento anulado a BBDD
  sendSale(document: Document) {
    let isanulado = false;
    if (document != undefined &&
      document.lines != undefined &&
      document.lines.length > 0) {
      this._addSelectedSeriesAndEmissionLocalDateTimeToCurrentDocument(document);

      const documentline = document.lines.filter(x => x.isRemoved == true);
      if (documentline.length == document.lines.length) {
        isanulado = true;
      }

      return this._cashPaymentService.sendSale(document, false, false, isanulado);
    }
  }
  // Adjunta la información de serie y fecha-hora de generación al documento actual
  private _addSelectedSeriesAndEmissionLocalDateTimeToCurrentDocument(document: Document): void {
    // this._logHelper.trace(`Documento ANTES de completar con serie y fecha de generación: ${JSON.stringify(this.currentDocument)}`);
    document.series = this._documentSeriesService.getSeriesByFlow(
      FinalizingDocumentFlowType.EmittingTicket,
      document.totalAmountWithTax);
    document.emissionLocalDateTime = new Date();
    // this._logHelper.trace(`Documento DESPUES de completar con serie y fecha de generación: ${JSON.stringify(this.currentDocument)}`);
  }

  // eliminamos linea documento
  deleteLine(ev: Event, index: number) {
    ev.stopPropagation();
    this._deleteLine(index)
      .first().subscribe(response => {
        if (!response) {
          this._statusBarService.publishMessage(this.getLiteral('document_component', 'error_Ticket_LineCouldNotBeCanceled'));
        } else {
          // this.currentDocument.lines.splice(index, 1);
          this._documentChanged();
          this._setPluVisible();
        }
      });
  }

  // edicion de los datos de la linea
  editLine(lineIndex: number): void {
    if (this.currentDocument.lines[lineIndex].typeArticle != undefined && !this.currentDocument.lines[lineIndex].typeArticle.includes('COMBU')) {
      const lineToEdit: DocumentLine = GenericHelper.deepCopy(this.currentDocument.lines[lineIndex]);
      jQuery('.selecArticulo').css('background-color', '#ffffff');
      jQuery('.selecArticulo').css('font-weight', 'normal');
      jQuery('.selecArticulo').css('font-family', 'TypeRegular,Repsol');
      jQuery('.buttonCancel').css('background-image', 'linear-gradient(104deg, #aca39a 78%, #ffffff 0%)');
      jQuery('#selecArticulo-' + lineIndex).css('background-color', 'rgba(228, 0, 40, 0.2)');
      jQuery('#selecArticulo-' + lineIndex).css('font-weight', 'bold');
      jQuery('#selecArticulo-' + lineIndex).css('font-family', 'TypeBold,Repsol');
      jQuery('#selecArticulo-' + lineIndex + ' .buttonCancel').css('background-image',
        'linear-gradient(104deg, #e40028 78%, rgba(228, 0, 40, 0) 12%)');
      this._auxActionsManager.editDocumentLine(lineToEdit)
        .first()
        .subscribe(newLine => {
          if (newLine != undefined) {
            if (this.currentDocument.lines[lineIndex] != undefined) {
              this.currentDocument.lines[lineIndex] = newLine;
              this._documentChanged();
              this._btnWriteDisplayArticle(newLine);
              this._setPluVisible();
              this._statusBarService.publishMessage(`${this.getLiteral('document_component', 'message_Ticket_LineModified1')}
              ${this.selectedDocumentIndex + 1}
              ${this.getLiteral('document_component', 'message_Ticket_LineModified2')}`);
            } else {
              this._statusBarService.publishMessage(this.getLiteral('document_component', 'error_Ticket_LineNotFound'));
            }
          }
        });
    }
  }

  onCloseSessionOperator() {
    if (this.operador != undefined) {
      this._confirmActionSvc.promptActionConfirm(this.getLiteral('document_component', 'confirmActionSvc.messageconfirmActionClose'),
        this.getLiteral('document_component', 'confirmActionSvc.Yes'),
        this.getLiteral('document_component', 'confirmActionSvc.Not'))
        .first().subscribe(confirmResponse => {
          if (confirmResponse) {
            if (this.countLinesDocuments() == 0) {
              // Se activa controlador, para validacion lanzamiento de eventos al consultar operador
              this.isCloseSession = true;
              this.resetAllDocument();
              this.requestOperator();
              this._statusBarService.publishMessage(this.getLiteral('document_component', 'sessionClosedSuccessfully'));
            } else {
              this._statusBarService.publishMessage(this.getLiteral('document_component', 'literal_cancelTicket'));
            }
          } else {
            this._statusBarService.publishMessage('');
          }
        });
    } else {
      this.requestOperator();
    }
  }

  // peticion de datos del operador desde UI o tras ver que este es vacío
  requestOperator() {
    // al solicitar el operador se eliminan siempre el operador y cliente que hayan
    this.fnLogoutOperator();

    // se solicita el operador
    this._operatorInternalService.requestOperator(this.currentDocument.usedDefaultOperator)
      .first()
      .subscribe(operator => {
        if (operator != undefined) {
          this.fnLoginOperator(operator);
          this.currentDocument.showAlertInsertOperator = false;
          // Se completo el inicio de session, reset controlador
          this.isCloseSession = false;
          this._statusBarService.publishMessage(this.getLiteral('document_component', 'literal_docSynchronization'));
        } else {
          this.currentDocument.showAlertInsertOperator = true;
          this._operatorService.fnOperador(undefined);
        }
      });
  }

  fnLoginOperator(operator: Operator): void {
    this.operador = operator.name;
    this._setOperator(operator, true);
    // TODO: Solicitamos alertas de operador
    this._alertService.getActiveAlerts(AlertPurposeType.showOnLogged, operator)
      .first()
      .subscribe(alerts => {
        // this._logHelper.trace(JSON.stringify(alerts));
        this._alertInternalService.showAvailableAlerts(alerts).first().subscribe();
      });
  }

  fnLogoutOperator(): void {
    this.currentDocument.showAlertInsertOperator = false;
    this._setOperator(undefined, true);
    this._operatorService.fnOperador(undefined);
    this._deleteCustomerData();
    this.operador = undefined;
    this.customer_businessName = undefined;
    this.customer_matricula = undefined;
  }

  // peticion de datos del customer
  requestCustomer(isRequestingCustomer?: boolean) {
    this.currentDocument.showAlertInsertCustomer = false;
    // si hay cliente por defecto se utiliza este
    if (this._customerInternalService.defaultCustomer && !isRequestingCustomer) {
      this._setCustomer({
        customer: this._customerInternalService.defaultCustomer,
        isFromCreateForm: false
      });
      return;
    }
    // se solicita el cliente
    this._customerInternalService.requestCustomer(isRequestingCustomer, true)
      .first()
      .subscribe(customerResult => {
        const customer = customerResult == undefined ? undefined : customerResult.customer;
        if (customer != undefined) {
          if (customer.customerMessage) { // !isUndefinedOrEmpty
            this._confirmActionSvc.promptActionConfirm(customer.customerMessage, this.getLiteral('common', 'aceptar'),
              undefined,
              this.getLiteral('document_component', 'header_CustomerNotice'), ConfirmActionType.Information)
              .first().subscribe(confirmResponse => {
                if (confirmResponse) {
                  this._setCustomer(customerResult);
                }
              });
          } else {
            this._setCustomer(customerResult);
          }
        } else {
          if (!this.customerHasValue(this.currentDocument.customer)) {
            this.currentDocument.showAlertInsertCustomer = true;
          } else {
            this._setPluVisible();
          }
        }
      });

  }

  onSaleFinished(success: boolean) {
    if (success) {
      this._statusBarService.publishMessage(this.getLiteral('document_component', 'message_Ticket_SaleOk'));
      this.resetDocument(false, true);
      this._documentSeriesService.showCleanCategories();
      const btnmas = document.getElementById('btnmas');
      if (isNullOrUndefined(btnmas) && this.npestana <= this._appDataConfig.numberOfDocuments && this.selectedDocumentIndex != 0) {
        this.creaBtn();
      }
      if (this.selectedDocumentIndex >= 1) {
        this.npestana--;
        this.documents.splice(this.selectedDocumentIndex, 1);
        this.selectedDocumentIndex = this.selectedDocumentIndex - 1;
        const tab = new MdTabChangeEvent();
        tab.index = this.selectedDocumentIndex;
        this.documentSelected(tab);
      }
      else {
        this.requestCustomer();
      }
      // if (this.npestana >= this._appDataConfig.numberOfDocuments )  {
      //   this.creaBtn();
      // }


    } else if (success == false) {
      this._statusBarService.publishMessage(this.getLiteral('document_component', 'error_Ticket_SaleCouldNotBeFinished'));
    }
    this._btnWriteDisplaySiguiente(); // Pana visor
    this._pluService.canSearchWithBarcode = true;
    this._documentInternalService.documentLockStatus = false;
    this._documentInternalService.setLinesFromDocument(this.countLinesDocuments());
  }
  /**
   * Captura evento click en el boton de cliente.
   * Si ya hay cliente pedira informacion extra (ej plate)
   * Si no, pedira nuevo cliente.
   */
  btnRequestCustomerClick() {
    const currentDocument = this.currentDocument;
    if (currentDocument.customer != undefined) {
      // permite edicion de matricula si no tiene informacion de tarjeta, o si no es flota
      const editPlate = currentDocument.customer.cardInformation == undefined || !currentDocument.customer.cardInformation.isFleet;
      this._customerInternalService.requestAddCustomerInformation({
        customer: currentDocument.customer,
        editPlate: editPlate
      })
        .first().subscribe((information: CustomerAddInformationResult) => {
          if (information == undefined || !information.success) {
            return;
          }
          if (information.changeCustomerRequested) {
            this.requestCustomer(true);
            return;
          }
          if (currentDocument.customer.cardInformation == undefined) {
            currentDocument.customer.cardInformation = {};
          }
          currentDocument.customer.cardInformation.plate = information.plate;
          currentDocument.plate = information.plate;
        });
    } else {
      this.requestCustomer(true);
    }
  }
  previewPromotions() {
    this._documentInternalService.previewPromotions();
    this._isPreviewPromotionsApplied = true;
  }

  disablePreviewPromotionsButton(): boolean {
    return this._isPreviewPromotionsApplied;
  }
  onPromotionsCalculated(success: boolean) {
    this.promotionsCalculated = success;
  }
  isNoPromotionsApplied(): boolean {
    if (this.currentDocument.lines.length > 0 &&
      this._isPreviewPromotionsApplied == true && this.promotionsCalculated == true &&
      this.currentDocument.lines.find(l => l.appliedPromotionList.length > 0) == undefined) {
      if (this._isPromotionVisible === false) {
        this._isPromotionVisible = true;
      }
      return true;
    }
    return false;
  }  // Efectua las acciones de insertar una linea negativa de la linea marcada con index

  private _deleteLine(index: number): Observable<boolean> {
    // Pana limpiar la tarifa local de articulo si se elimina la linea
    if (this.documents[this.selectedDocumentIndex].lines[index].PVPLocal) {
      this._promotionsService.cleanLocalTarif(this.currentDocument);
    }
    return Observable.create((observer: Subscriber<boolean>) => {

      const isCarburante: any = this.documents[this.selectedDocumentIndex].lines[index].businessSpecificLineInfo;
      if (isCarburante) {
        try {
          const isSupply = isCarburante.supplyTransaction;
          if (isSupply) {
            // desbloqueamos de transacciones virtuales
            if (isSupply.isVirtual) {
              const request = { transacctionId: isSupply.id,
                posIdTpv: 0,
                type: 'update'
              };
              this._signalrMultitpv.requestNotifyGenericChangesRed('changeTransactionVirtual', JSON.stringify(request)).subscribe( resp => {
                if (!resp) {
                  this._signalrMultitpv.setDocumentVirtualMultiTpv(request);
                }
              });
            }
            const listaIdSumiAnul: number[] = [];

            if (isSupply.anulated == true) {
              listaIdSumiAnul.push(isSupply.id);
            }

            if (listaIdSumiAnul.length > 0) {
              this._fpSvc.UpdateSupplyAnulatedEnTicket(listaIdSumiAnul, false)
                .first().subscribe(responseUpdate => {
                  if (responseUpdate == undefined || responseUpdate == false) {
                    this._logHelper.trace('Error en la actualización del EnTicket.');
                  }
                });
            }

            const idTransaction = isCarburante.supplyTransaction.id;
            const idfuellingPoint = isCarburante.supplyTransaction.fuellingPointId;
            if (idTransaction && idfuellingPoint) {
              this.documents[this.selectedDocumentIndex].lines.splice(index, 1);
              if (!isSupply.isVirtual) {
                if (isSupply.anulated == undefined || isSupply.anulated == false) {
                  this._fpSvc.unlockSupplyTransaction(idTransaction, idfuellingPoint).first().subscribe();
                }
              }
            }
          }
          const data = isCarburante._data;
          let maxPrepago: number = 0;
          if (data) {
            const listCarburantes: any = [];
            this.documents[this.selectedDocumentIndex].lines.forEach(element => {
                const isCarb: any = element.businessSpecificLineInfo;
                if (isCarb) {
                  const isCarbPrep =  isCarb._data;
                  if (isCarbPrep) {
                    listCarburantes.push(isCarb);
                  }
                }
            });
            if (listCarburantes.length > 1) {
              for (let i = 0; i < listCarburantes.length; i++) {
               if ( data.idFuellingPoint == listCarburantes[i]._data.idFuellingPoint) {
                maxPrepago ++;
               }
              }
            }
            if (maxPrepago > 1) {
              this.documents[this.selectedDocumentIndex].lines.splice(index, 1);
              return;
            }
            const fpCancel: FuellingPointInfo = this._fpInternalSvc.fpListInternal.find(x => x.id == data.idFuellingPoint);
            this._fpSvc.requestChangeServiceModeMultiTPV(fpCancel.oldServiceModeType, fpCancel.id, this._conf.POSInformation.code,
              fpCancel.oldHasPostPaidTransaction, fpCancel.oldHasPrePaidTransaction,
              fpCancel.serviceModeType, fpCancel.hasPostPaidTransaction, fpCancel.hasPrePaidTransaction)
            .first().subscribe(response => {
            this.documents[this.selectedDocumentIndex].lines.splice(index, 1);
            this._fpSvc.manageRequestCancelPreset(isCarburante._data.idFuellingPoint).first().subscribe();
            });
          }
        } catch (error) {
          this._statusBarService.publishMessage(this.getLiteral('common', 'error'));
        }
      } else {
        // Se crea nuevo objeto linea con los mismos datos de la linea seleccionada pero con la cantidad y su importe negativos
        this.currentDocument.lines[index].isRemoved = false;
        const documentLine2: DocumentLine = {
          description: this.documents[this.selectedDocumentIndex].lines[index].description,
          discountPercentage: this.documents[this.selectedDocumentIndex].lines[index].discountPercentage,
          // tslint:disable-next-line:max-line-length
          totalAmountWithTax: this.documents[this.selectedDocumentIndex].lines[index].totalAmountWithTax - this.documents[this.selectedDocumentIndex].lines[index].totalAmountWithTax * 2,
          productId: this.documents[this.selectedDocumentIndex].lines[index].productId,
          quantity: this.documents[this.selectedDocumentIndex].lines[index].quantity * -1,
          priceWithTax: this.documents[this.selectedDocumentIndex].lines[index].priceWithTax,
          taxPercentage: this.documents[this.selectedDocumentIndex].lines[index].taxPercentage,
          discountAmountWithTax: this.documents[this.selectedDocumentIndex].lines[index].discountAmountWithTax,
          originalPriceWithTax: this.documents[this.selectedDocumentIndex].lines[index].originalPriceWithTax,
          isRemoved: false,
          idCategoria: '',
          nameCategoria: ''
        };
        // Se pone la propiedad isRemoved a false para saber que la linea ha sido anulada y no poder modificar ni eliminar
        this.documents[this.selectedDocumentIndex].lines[index].isRemoved = false;
        // tslint:disable-next-line:no-unused-expression
        this.documents[this.selectedDocumentIndex].lines.push(documentLine2);
      }
      observer.next(true);
    });
  }
  // según si falta operador o customer es pedido mediante slide
  // si operador ya está y/o cliente, mandamos evento informando de los datos,
  // es para que resto de componentes estén informados del estado
  // (con cada número de ticket hay un estado diferente)
  private _requestOperatorCustomer(): void {
    if (!this.operatorHasValue(this.currentDocument.operator)) {
      /*  this._operatorService.limpiadoOperador(this._appDataConfig.defaultOperator).first()
         .subscribe(response => {
           if (response) { */
      this.requestOperator();
      /* } */
      /*   }); */
    } else {
      if (!this.customerHasValue(this.currentDocument.customer)) {
        this.requestCustomer();
      }
    }
  }

  /* NOTA: Hay que calcular la altura del ticket en base a la altura de la pantalla
  y los elementos circundantes como las tabs, y los botones de acción.
  Habría que hacerlo en vainilla javaScript o en typeScript */
  private _setHostHeight() {
    const btnHeight = jQuery('.tpv-document .btn-content').css('height');
    if (btnHeight) {
      const calcBtnHeight = Number(btnHeight.replace('px', ''));
      const calcHeight = jQuery('.tpv-document').height() -
        (calcBtnHeight +
          jQuery('.tpv-document .mat-tab-header').height() +
          jQuery('.tpv-document .document-actions').height() +
          jQuery('.tpv-document .summary').height());
      jQuery('.tpv-document .divOverflow').css('height', (calcHeight - this.valWidth));
      this._logHelper.trace(`DocumentComponent->getHeight: ${calcHeight}`);
    }
  }
  private _setlengthwidthHeader() {
    jQuery('#idcantidad').css('width', '132px');
    jQuery('#idcantidad').css('text-align', 'center');
    jQuery('#idcancel').css('width', '44px');
    jQuery('#iddescripcion').css('width', '265px');
    jQuery('#idPVP').css('width', '0px');
    jQuery('#idporcentaje').css('width', '0px');
    jQuery('#idsimbol').css('width', '100px');
    jQuery('idsimbolDescript').css('width', '100px');
  }

  private restableceWithHeader() {
    jQuery('#idcantidad').css('width', '58px');
    jQuery('#idcantidad').css('text-align', 'left');
    jQuery('#idcancel').css('width', '48px');
    jQuery('#iddescripcion').css('width', '197px');
    jQuery('#idPVP').css('width', '56px');
    jQuery('#idporcentaje').css('width', '39px');
    jQuery('#idsimbol').css('width', '56px');
    jQuery('idsimbolDescript').css('width', '100px');
  }


  // recalculamos total ammount del document cuando cambia el total ammount de un document line
  private _recalculateDocumentTotalAmmount() {
    this.currentDocument.totalAmountWithTax = 0;
    this.currentDocument.lines.map(documentLine => {
      let totalAmountWithTax = this.currentDocument.totalAmountWithTax;
      if (documentLine.quantity > 0 && documentLine.isRemoved != false) {
        totalAmountWithTax += documentLine.totalAmountWithTax;
      }
      this.currentDocument.totalAmountWithTax = this._roundPipe.transformInBaseCurrency(totalAmountWithTax);
    });
  }

  // se realizan una serie de acciones cuando hay operator
  // si hay que borrar cliente se borra y se pide por evento
  private _setOperator(operator: Operator, customerEmpty?: boolean): any {
    // si se solicita, se elimina el cliente
    if (customerEmpty) {
      this.setDocumentClosed(this.selectedDocumentIndex);
      if (operator === undefined) {
        this._operatorService.limpiadoOperador('').first()
          .subscribe(response => {
            if (response) {
            }
          });
      }
    }
    // si no se ha usado el operador por defecto en este documento y existe, se marca el flag para indicar que ya se ha usado
    if (this.currentDocument.usedDefaultOperator == false
      && this._operatorInternalService.defaultOperator && operator) {
      this.currentDocument.usedDefaultOperator = true;
    }
    // this.currentDocument.operator = operator;
    // setear operador en todos los documentos abiertos
    this.documents.forEach(item => {
      item.operator = operator;
    });
    this._operatorInternalService.currentOperator = operator;
    this._documentChanged();

    // si se borra operador pedimos operador, si solo se edita pedimos customer
    if (this.operatorHasValue(operator)) {
      this.currentDocument.showAlertInsertOperator = false;
      if (customerEmpty) {
        this.requestCustomer();
      }
    }
  }

  // acciones a realizar cuando hay customer
  private _setCustomer(customerResult: CustomerSelectedResult): void {
    const currentCustomer = this._customerInternalService.currentCustomer;
    const customer = customerResult == undefined ? undefined : customerResult.customer;
    this.customer_businessName = customerResult.customer.businessName;
    this.customer_matricula = customerResult.customer.matricula;

    if (!this.customerHasValue(customer)) {
      if (currentCustomer != undefined) {
        this.currentDocument.plate = undefined;
      }
      this.currentDocument.customer = undefined;
      this.setDocumentClosed(this.selectedDocumentIndex);
    } else {
      if (currentCustomer == undefined || currentCustomer.tin != customer.tin) {
        this.currentDocument.plate = undefined;
      }
      this.currentDocument.showAlertInsertCustomer = false;
      this.currentDocument.customer = customer;
      this._setPluVisible();
      this.setDocumentOpened(this.selectedDocumentIndex);
      if (this.currentDocument.customer.cardInformation == undefined) {
        this.currentDocument.customer.cardInformation = {};
      }
      this.currentDocument.customer.cardInformation.plate = customerResult.plate;
      this.currentDocument.plate = customerResult.plate;

      const emitirFactura: Boolean = this._statusBarService.getEmitirFactura();

      if (emitirFactura) {
        const idCorta: string = customerResult.customer.id.substring(5);
        if (idCorta != '00000') {
          this._statusBarService.asignarFactura(true);
        }
      }

    }
    this._customerInternalService.currentCustomer = this.currentDocument.customer;
    this.clienteChanged = true;
    this._documentChanged();
    // TODO Aquí se insertarían más datos (kilometers, contactId)
  }

  private _deleteCustomerData() {
    this.currentDocument.customer = undefined;
    this._customerInternalService.currentCustomer = undefined;
  }

  // actualizamos documento actual
  private _documentChanged() {
    if (!this.clienteChanged) {
      this._deleteDocumentPromotions();
      this._recalculateDocumentTotalAmmount();
    }

    /*var nTamTabla = jQuery('#tableDocuments tbody tr').length;
    var ntamDocument = this.documents[this.selectedDocumentIndex].lines.length;

    if (nTamTabla == ntamDocument) {
      if (this.documents[this.selectedDocumentIndex].lines.length > 0) {
        var nTamDoc = this.documents[this.selectedDocumentIndex].lines.length - 1;
        this.linesNew = new Array<DocumentLine>();

        this.linesNew.push(this.documents[this.selectedDocumentIndex].lines[nTamDoc]);
        for (let i = 0; i < this.documents[this.selectedDocumentIndex].lines.length - 1; i++) {
          this.linesNew.push(this.documents[this.selectedDocumentIndex].lines[i]);
        }
        this.documents[this.selectedDocumentIndex].lines = this.linesNew;
      }
    }*/
    this.contador = 0;
    this.documentAct = this.selectedDocumentIndex;
    this._documentInternalService.currentDocumentList = this.documents;
    this._documentInternalService.selectedDocumentIndex = this.selectedDocumentIndex;
    // solamente preguntamos por posibles promociones para aquellas líneas cuyo estado no sepamos
    if (this.currentDocument.lines !== undefined && this.currentDocument.lines.length !== 0) {
      this.calulatePromotionsChangedDocument();
    }
    this._isPromotionVisible = false;
    this.clienteChanged = false;
  }

  private calulatePromotionsChangedDocument() {
    this.globalPromo = 0;
    this._promotionsService.cleanLocalTarif(this.currentDocument);
    this._promotionsService.calculatePromotions(this.currentDocument).first()
      .subscribe(
        calculatePromotionsResponse => {
          if (calculatePromotionsResponse.status === ResponseStatus.success) {
            const receivedPromotionsList = calculatePromotionsResponse.object;
            if (receivedPromotionsList != undefined && receivedPromotionsList.length > 0) {
              this._setPromotions(receivedPromotionsList);
            }
          }
        });
  }

  /*
  private _setPromotions_OLD(receivedPromotionList: Array<DocumentLinePromotion>) {
    this._logHelper.trace(`Se aplicarán las siguientes PROMOCIONES:`);
    this._logHelper.trace(receivedPromotionList.toString());
    let totalDiscountByPromotions: number = 0;
    let isTarifa: boolean = false;
    this._clearPromotions();
    // recorrer lista de promociones para ir desglosando líneas del ticket si están incluidas en diferentes promociones
    receivedPromotionList.forEach(promotion => {
      if (promotion.description != 'tarifa local') {
        const numIteration = promotion.timesApplied.length;
        for (let i = 0; i < numIteration; i++) {
          if (promotion.timesApplied[i] > 0) {
            // const line = this.currentDocument.lines[i];
            if (this.currentDocument.lines[i].isPromoted === undefined || !this.currentDocument.lines[i].isPromoted) {
              this.currentDocument.lines[i].isPromoted = true;
            }
            else {
              const lineAux = this._documentInternalService.cloneDocument(this.currentDocument).lines[i];
              lineAux.quantity = promotion.timesApplied[i];
              lineAux.totalAmountWithTax = lineAux.priceWithTax * lineAux.quantity;
              this.currentDocument.lines[i].quantity =
                this.currentDocument.lines[i].quantity - lineAux.quantity;
              this.currentDocument.lines[i].totalAmountWithTax =
                // tslint:disable-next-line:max-line-length
                this.currentDocument.lines[i].quantity * this.currentDocument.lines[i].priceWithTax;
              lineAux.isPromoted = true;
              this._documentInternalService.publishLineData(lineAux);
              promotion.referredLineNumber = this.currentDocument.lines.length;
              promotion.timesApplied = promotion.timesApplied.concat(promotion.timesApplied[i]);
              promotion.timesApplied[i] = 0;
              promotion.amountPerUnitInTheInPromo = promotion.amountPerUnitInTheInPromo.concat(promotion.amountPerUnitInTheInPromo[i]);
              promotion.amountPerUnitInTheInPromo[i] = 0;
            }
          }
        }
      }
    });
    receivedPromotionList.forEach(promotion => {
      if (promotion.description != 'tarifa local') { // Si es una promocio
        for (let i = 0; i < promotion.timesApplied.length; i++) {
          if (promotion.timesApplied[i] > 0) {
            const lineRelated = i;
            const promotionAux: DocumentLinePromotion = {
              description: promotion.description,
              discountAmountWithTax: promotion.amountPerUnitInTheInPromo[lineRelated],
              numberOfTimesApplied: promotion.timesApplied[lineRelated],
              promotionId: promotion.promotionId,
              referredLineNumber: lineRelated + 1,
              timesApplied: promotion.timesApplied,
              amountPerUnitInTheInPromo: promotion.amountPerUnitInTheInPromo
            };
            if (this.currentDocument.lines[lineRelated].appliedPromotionList == undefined) {
              this.currentDocument.lines[lineRelated].appliedPromotionList = [];
            }
            this.currentDocument.lines[lineRelated].appliedPromotionList.push(promotionAux);
            this.currentDocument.lines[lineRelated].isPromoted = true;
            if (this.currentDocument.lines[lineRelated].discountAmountWithTax == undefined) {
              this.currentDocument.lines[lineRelated].discountAmountWithTax = 0;
            }
            this.currentDocument.lines[lineRelated].discountAmountWithTax =
              promotionAux.discountAmountWithTax * promotionAux.numberOfTimesApplied;

          }
        }
        if (this.currentDocument.lines[promotion.referredLineNumber - 1].appliedPromotionListHTML == undefined) {
          this.currentDocument.lines[promotion.referredLineNumber - 1].appliedPromotionListHTML = [];
        }
        this.currentDocument.lines[promotion.referredLineNumber - 1].appliedPromotionListHTML.push(promotion);
        totalDiscountByPromotions += promotion.discountAmountWithTax;
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
          lineAux.discountPercentage = 0;
          // lineAux.appliedPromotionList = [];
          this.currentDocument.lines[promotion.referredLineNumber - 1].quantity =
            this.currentDocument.lines[promotion.referredLineNumber - 1].quantity - lineAux.quantity;
          this.currentDocument.lines[promotion.referredLineNumber - 1].totalAmountWithTax =
            // tslint:disable-next-line:max-line-length
            this.currentDocument.lines[promotion.referredLineNumber - 1].quantity * this.currentDocument.lines[promotion.referredLineNumber - 1].priceWithTax;
          this._documentInternalService.publishLineData(lineAux);
        }
        else {
          this.currentDocument.lines[promotion.referredLineNumber - 1].PVPLocal = true;
          this.currentDocument.lines[promotion.referredLineNumber - 1].discountPercentage = 0;
          this.currentDocument.lines[promotion.referredLineNumber - 1].priceWithTax = this._roundPipe.transformInBaseCurrency(
            // tslint:disable-next-line:max-line-length
            this.currentDocument.lines[promotion.referredLineNumber - 1].originalPriceWithTax - (promotion.discountAmountWithTax / promotion.numberOfTimesApplied));
          this.currentDocument.lines[promotion.referredLineNumber - 1].totalAmountWithTax =
            // tslint:disable-next-line:max-line-length
            this.currentDocument.lines[promotion.referredLineNumber - 1].priceWithTax * this.currentDocument.lines[promotion.referredLineNumber - 1].quantity;
        }
      }
    });
    if (receivedPromotionList.length > 0) {
      this._documentInternalService.notifyPromotionAdded();
    }
    if (isTarifa) {  // Recalcular el totalAmountWithTax despues del aplicar la tarifa local
      let sumTotalLineAux = 0;
      this.currentDocument.lines.forEach(line => {
        sumTotalLineAux += line.totalAmountWithTax;
      });
      this.currentDocument.totalAmountWithTax = sumTotalLineAux;
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
  }
*/

  // Vacía las promociones aplicadas al documento actual
  private _clearPromotions() {
    this.globalPromo = 0;
    if (this.currentDocument.paymentDetails != undefined) {
      // tslint:disable-next-line:max-line-length
      this.currentDocument.paymentDetails = this.currentDocument.paymentDetails.filter(pD => pD.paymentMethodId.substring(5) != PaymentMethodType.promotion.toString());
    }
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

  public creaBtn() {
    const headTab = document.getElementsByClassName('mat-tab-header');
    // (headTab[0] as HTMLElement).style.backgroundImage = 'linear-gradient(124deg, rgb(255, 180, 26) 20%, rgb(234, 231, 228) 19%)';
    (headTab[0] as HTMLElement).style.backgroundColor = '#EAE7E4';
    const element = document.createElement('button');
    element.id = 'btnmas';
    element.className = 'mat-tab-label mat-tab-label1';
    element.innerText = '+';
    element.addEventListener('click', (evt) => {
      this.npestana++;
      this._setInitialData();
      this.selectedDocumentIndex = this.npestana - 1;
      this._changedPaymnetInternalSvc.fnChangedPayment(this.currentChange);
    });
    const tab = document.getElementsByClassName('mat-tab-labels');
    tab[0].appendChild(element);
    (tab[0] as HTMLElement).style.display = 'inline';
  }

  // inicializacion de los datos generales de todos los documentos
  public _setInitialData(): void {
    // datos de la divisa
    this.baseCurrency = this._appDataConfig.baseCurrency;
    let currencyId;
    if (this.baseCurrency != undefined) {
      currencyId = this.baseCurrency.id;
    } else {
      this._logHelper.trace('DocumentComponent-> WARNING: No se ha podido recuperar la divisa base');
    }
    // inicializamos documentos que habrán

    // for (let i = 0; i < this._appDataConfig.numberOfDocuments; i++) {
    if (this.npestana <= this._appDataConfig.numberOfDocuments) {
      this.documents.push({
        series: undefined,
        lines: [],
        totalAmountWithTax: 0.00,
        operator: undefined,
        customer: undefined,
        showAlertInsertOperator: false,
        showAlertInsertCustomer: false,
        usedDefaultOperator: false,
        currencyId: currencyId,
        isatend: '',
        isLocked: false,
        posId: undefined
      });

      this.arrayChanged.push({
        ticket: '', total: 0, isCharged: false, isTicket: false, totalChange: 0, changePend: 0, selectedIndex: this.npestana - 1,
        typeCall: 0, customerId: '', counterSecond: 0, isStop: false, isButtonHidden: true, isButtonFactura: true, isButtonTicket: true
      });
    }
    if (this.npestana >= this._appDataConfig.numberOfDocuments) {
      const tab = document.getElementsByClassName('mat-tab-labels');
      const label = document.getElementById('btnmas');
      tab[0].removeChild(label);
    }
    // }
    this._documentInternalService.currentDocumentList = this.documents;
    this.selectedDocumentIndex = this.selectedDocumentIndex;
    this._documentInternalService.setLinesFromDocument(this.countLinesDocuments());
    /*
    this._changedPaymnetInternalSvc.currentChangedtList =  this.arrayChanged;
    this._changedPaymnetInternalSvc.selectedDocumentIndex =  this.selectedDocumentIndex;
    */
  }

  // Inicialización de los datos iniciales del documento actual
  private _setInitialDocumentData(): void {
    if (this.documents && this.selectedDocumentIndex != undefined) {
      // informamos de operador y cliente al cambiar de ticket

      if (this.documents.length == this.selectedDocumentIndex + 1 && this.selectedDocumentIndex != 0 &&
        this.documents[this.selectedDocumentIndex].operator == undefined) {
        const valor = this.selectedDocumentIndex - 1;
        this.currentDocument.operator = this.documents[valor].operator;
        this._operatorInternalService.currentOperator = this.currentDocument.operator;
        this._customerInternalService.currentCustomer = this.currentDocument.customer;
      } else {
        this._operatorInternalService.currentOperator = this.currentDocument.operator;
        this._customerInternalService.currentCustomer = this.currentDocument.customer;
      }
      if (!this.isCloseSession) {
        this._requestOperatorCustomer();
      }
      // petición de operador y cliente
    }
  }

  // notifica al TPV que la PLU debe estar visible
  private _setPluVisible() {
    this._tpvMainService.setPluVisible(true);
  }

  // limpiar las promociones aplicadas en el documento actual
  private _deleteDocumentPromotions() {
    this.currentDocument.lines.forEach(line => {
      line.appliedPromotionList = [];
      line.appliedPromotionListHTML = [];
      line.isPromoted = false;
    });
    if (this.currentDocument.lines.length == 0) {
      this._isPreviewPromotionsApplied = true;
    } else {
      this._isPreviewPromotionsApplied = false;
    }
    this.promotionsCalculated = false;
  }

  // indica si hay promociones aplicadas en el doucmento actual
  hasPromotions(): boolean {
    let promotion: boolean = false;
    this.currentDocument.lines.forEach(line => {
      if (line.appliedPromotionList.length > 0) {
        promotion = true;
      }
    });
    return promotion;
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
    return currentDocument;
  }
  moverProducto(Valor: string) {
    const tabla = document.getElementsByClassName('divOverflow')[0];
    if (Valor == 'A') {
      tabla.scrollTop = tabla.scrollTop - 50;
    }
    else {
      tabla.scrollTop = tabla.scrollTop + 50;
    }
  }
  visibleButtons(): boolean {
    return this.currentDocument.lines.length >= 5;
  }

  _llenarButons(valor: MdTabChangeEvent) {
    const tab = valor.index;

    this.documentsTab[0] = this.documents[tab];

    this.operador = this.documentsTab[0].operator.name;
    this.customer_businessName = this.documentsTab[0].customer.businessName;
    this.customer_matricula = this.documentsTab[0].customer.matricula;

  }

  // Pana - Cajon y Visor - 12/03/2019
  private _btnWriteDisplaySiguiente() {
    this._OPOS_WriteDisplay(this.getLiteral('document_component', 'OPOS_WriteDisplayCustomerNext'), '')
      .first().subscribe(response => {
        /*if (response) {
          this._statusBarService.publishMessage('mensaje enviado');
        } else {
          this._statusBarService.publishMessage('no se ha podido establecer comunicacion con el visor');
        }*/
      });
  }

  // talonsoc 14/10/19 añadir decimales cuando el importe es entero
  private _btnWriteDisplayArticle(newline: DocumentLine) {
    this._OPOS_WriteDisplay(newline.description, newline.typeArticle.includes('COMBU') ?
      newline.quantity.toString() + ' L'
      : newline.quantity.toString() + ' x ' + (newline.pricelocal != undefined ? GenericHelper.ToStringWithDecimals(newline.pricelocal) :
      GenericHelper.ToStringWithDecimals(newline.priceWithTax)) + ' ' + this._appDataConfig.baseCurrency.symbol)
      .first().subscribe(response => {
        /*if (response) {
          this._statusBarService.publishMessage('mensaje enviado');
        } else {
          this._statusBarService.publishMessage('no se ha podido establecer comunicacion con el visor');
        }*/
      });
  }

  private _OPOS_WriteDisplay(strLinea1: string, strLinea2: string): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      Promise.resolve(this._signalROPOSService.OPOSWriteDisplay(strLinea1, strLinea2.replace('.', ',')).then(responseOPOS => {
        if (responseOPOS.status === OPOSWriteDisplayResponseStatuses.successful) {
          observer.next(true);
        } else if (responseOPOS.status === OPOSWriteDisplayResponseStatuses.genericError) {
          observer.next(false);
        }
      }));
    });
  }

  filterAcentos(str: string) {
    return str.replace('Ó', 'O').replace('ó', 'o').replace('É', 'E').replace('é', 'e').replace('Á', 'A').
      replace('á', 'a').replace('Í', 'I').replace('Í', 'i').replace('Ú', 'U').replace('Ú', 'u');
  }

  backG(ind: number, pos: number) {
    if (this.contador == this.documents.length) {
      if (this.currentDocument.lines.length >= 5) {
        const tabla = document.getElementsByClassName('divOverflow')[0];
        tabla.scrollTop = (jQuery('#tableDocuments' + this.documentAct + ' tbody tr').length
          * jQuery('#tableDocuments' + this.documentAct + ' tbody tr').height()
        ) + 100;
      }
      this.contador = this.contador + 1;
    } else if (this.contador <= this.documents.length) {
      this.contador = this.contador + 1;
    }
  }

  resetAllDocument() {
    try {
      this.selectedDocumentIndex = 0;
      const firstdocument = this.documents[0];
      firstdocument.totalAmountWithTax = 0;
      firstdocument.lines = [];
      this.documents = [];
      this.documents.push(firstdocument);
      this.npestana = 1;

      const btnmas = document.getElementById('btnmas');
      if (isNullOrUndefined(btnmas) && this.npestana <= this._appDataConfig.numberOfDocuments) {
        this.creaBtn();
      }
      const tab = new MdTabChangeEvent();
      tab.index = 0;
      this.documentSelected(tab);
    } catch (ex) {
      this._logHelper.trace('DocumentComponent -> resetAllDocument -> catch -> ' + ex);
    }
  }

  oldFuntionBackup() {
    // const tab = new MdTabChangeEvent();
    // tab.index = 0;
    // this.documentSelected(tab);

    // this.documents.forEach((element, index) => {
    //   // limpia y borra pestañas (tickets/documentos) desde la ultima hasta la actual
    //   this._logHelper.trace('====================' + index + '========================');
    //   this._logHelper.trace(JSON.stringify(element.lines.length));
    //   this._logHelper.trace('====================' + index + '========================');
    //   // this.selectedDocumentIndex = this.npestana - 1;

    //   this.selectedDocumentIndex = index;
    //   this.ResetDocumnentData(true, false, false);
    //   // this.npestana--;
    //   // if (this.documents.length >= 1) {
    //   // if (index != 0) {
    //   //   this.npestana--;
    //   //   this.documents.splice(index, 1);
    //   //   this.selectedDocumentIndex = 0;
    //   //   const tab = new MdTabChangeEvent();
    //   //   tab.index = 0;
    //   //   // this.documentSelected(tab);
    //   // }
    // });
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

  getMargin(valor: number) {
    let conteo;
    let monto;
    if (valor != 0) {
      const valores = valor.toString();
      monto = valores.split('.');
      conteo = monto[0].length;

      if (conteo <= 2) {
        return '0px';
      } else {
        return '-48px';
      }
    } else {
      return '0px';
    }

  }

  getWidth(valor: number) {
    let conteo;
    let monto;
    if (valor != 0) {
      const valores = valor.toString();
      monto = valores.split('.');
      conteo = monto[0].length;

      if (conteo <= 2) {
        return '33.33333333%';
      } else {
        return '40%';
      }
    } else {
      return '33.33333333%';
    }
  }

  // Nuevas Promociones: Se emplea este método para gestionar las promociones que incluyen a artículos que no reciben descuento.
  // Estas son en la práctica de dos tipos:
  // "N x M"   y  "Xº unidad con % descuento"
  // el método devuelve un array análogo al TimesApplied, pero que solo cuenta los artículos Promocionados Y con descuento
  // NOTA: La promocíon viene con quantity ( NumberOfTimesApplied) igual a 1
  public getTimesAppliedWithDiscount(promoLine: DocumentLinePromotion): Array<any> {
    // comprobar que es alguno de estos tipos arriba mencionados
    let dtoTotalTeorico = 0;
    for (let i = 0; i < promoLine.timesApplied.length; i++) {
      dtoTotalTeorico += promoLine.timesApplied[i] * promoLine.amountPerUnitInTheInPromo[i];
    }
    // si no lo es, volver
    if (dtoTotalTeorico != promoLine.discountAmountWithTax) {
      return promoLine.timesApplied;
    }
    const timesAppliedWithDiscount = promoLine.timesApplied;
    let dtoRealPromo = 0;
    for (let line = 0; line < timesAppliedWithDiscount.length; line++) {
      if (timesAppliedWithDiscount[line] > 0) {
        timesAppliedWithDiscount[line] = (promoLine.amountPerUnitInTheInPromo[line] > 0) ? 1 : 0;
        dtoRealPromo += promoLine.amountPerUnitInTheInPromo[line];
      }
    }
    // añadimos articulos hasta llegar al descuento promocional.
    // por orden creciente de precio: la promo aplica a los más baratos, y si dos articulos tienen igual Pvp
    // tomamos el que esté más abajo en el ticket
    // let linesWithDiscount = this._documentInternalService.cloneDocument(this.currentDocument).lines;
    // linesWithDiscount = linesWithDiscount.filter(l => )
    const documentLines = this.currentDocument.lines;
    while (dtoRealPromo < promoLine.discountAmountWithTax) {
      // obtener linea que lleva descuento Y con Pvp minimo
      let linesWithDiscount = this.currentDocument.lines.filter(line =>
        timesAppliedWithDiscount[documentLines.indexOf(line)] < promoLine.timesApplied[documentLines.indexOf(line)]);
      const pvpMin = Math.min.apply(undefined, linesWithDiscount.map(l => l.priceWithTax));
      linesWithDiscount = linesWithDiscount.filter(l => l.priceWithTax === pvpMin);
      const lineaADescontar = documentLines.indexOf(linesWithDiscount[linesWithDiscount.length - 1]);
      timesAppliedWithDiscount[lineaADescontar]++;
      dtoRealPromo += promoLine.amountPerUnitInTheInPromo[lineaADescontar];
    }
    return timesAppliedWithDiscount;
  }

  // Sin agrupar lineas de promo
  private _setPromotions(receivedPromotionList: Array<DocumentLinePromotion>) {
    this._logHelper.trace(`Se aplicarán las siguientes PROMOCIONES:`);
    this._logHelper.trace(receivedPromotionList.toString());
    let totalDiscountByPromotions: number = 0;
    let isTarifa: boolean = false;
    this._clearPromotions();
    // recorrer lista de promociones para ir desglosando líneas del ticket si están incluidas en diferentes promociones
    // NUEVAS PROMOS: Primero, comprobamos si existe promocion de tipo Cantidad Fija por Importe Minimo a aplicar. Estas son las que se refieren
    // a una linea de ticket ficticia ( -1). Se tratan al final del método, para pintarlas al final del ticket
    const promoGlobal = receivedPromotionList.filter(p => p.referredLineNumber < 0).length > 0 ?
                              receivedPromotionList.filter(p => p.referredLineNumber < 0)[0] : undefined;
    receivedPromotionList = receivedPromotionList.filter(p => p.referredLineNumber > 0);

    // calcular cantidades promocionadas con descuento
    receivedPromotionList.filter(p => p.referredLineNumber > 0  && p.description != 'tarifa local').
      forEach(promotion => {
        promotion.timesAppliedWithDiscount = this._promotionsService.getTimesAppliedWithDiscount(this.currentDocument, promotion);
      });

    // eliminar las promociones que no vencen a descuentos
    // receivedPromotionList = receivedPromotionList.filter(promo => promo.description == 'tarifa local'  ||
    //                  this._promotionsService.esPromoMejorQueDescuentos(this.currentDocument, promo));

    receivedPromotionList.forEach(promotion => {
      if (promotion.description != 'tarifa local') {
        const numIteration = promotion.timesAppliedWithDiscount.length;
        for (let i = 0; i < numIteration; i++) {
          if (promotion.timesAppliedWithDiscount[i] > 0) {
            // const line = this.currentDocument.lines[i];
            /*
            if (this.currentDocument.lines[i].isPromoted === undefined || !this.currentDocument.lines[i].isPromoted) {
              this.currentDocument.lines[i].isPromoted = true;
            }
            */
            if (this.currentDocument.lines[i].quantity == promotion.timesAppliedWithDiscount[i]) {
              this.currentDocument.lines[i].isPromoted = true;
            } else {
              // numLineasDesglosadas++;
              // Creamos la linea a la que se le aplica la promoción
              const lineAux = this._documentInternalService.cloneDocument(this.currentDocument).lines[i];
              lineAux.quantity = promotion.timesAppliedWithDiscount[i];
              lineAux.totalAmountWithTax = lineAux.priceWithTax * lineAux.quantity;
              lineAux.isPromoted = true;

              // Quitamos los posibles descuentos que tuviese
              let lineNoAplicaPromo: any;
              if (this.currentDocument.lines[i].discountPercentage != 0) {
                lineAux.discountPercentage = 0;
                lineAux.discountAmountWithTax = 0;
                lineAux.discountAmountWithoutTax = 0;

                // Creamos la linea a la que no se aplica la promoción pero es necesaria para que exista dicha promoción
                lineNoAplicaPromo = this._documentInternalService.cloneDocument(this.currentDocument).lines[i];
                lineNoAplicaPromo.quantity = promotion.timesApplied[i] - promotion.timesAppliedWithDiscount[i];
                lineNoAplicaPromo.totalAmountWithTax = lineNoAplicaPromo.priceWithTax * lineNoAplicaPromo.quantity;
                lineNoAplicaPromo.isPromoted = true;
                lineNoAplicaPromo.discountPercentage = 0;
                lineNoAplicaPromo.discountAmountWithTax = 0;
                lineNoAplicaPromo.discountAmountWithoutTax = 0;
              }

              let promoQuantity: number = lineAux.quantity;
              if (lineNoAplicaPromo != undefined) { promoQuantity += lineNoAplicaPromo.quantity; }

              // Quitamos los articulos que hemos desglosado de la linea original
              this.currentDocument.lines[i].quantity =
                this.currentDocument.lines[i].quantity - promoQuantity;
              // Si tenía descuento se lo seguimos aplicando a la linea
              if (this.currentDocument.lines[i].discountPercentage != 0) {
                this.currentDocument.lines[i].totalAmountWithTax =
                  this.currentDocument.lines[i].quantity *
                  (this.currentDocument.lines[i].priceWithTax * ((100 - this.currentDocument.lines[i].discountPercentage) / 100));
              } else {
                this.currentDocument.lines[i].totalAmountWithTax =
                  this.currentDocument.lines[i].quantity * this.currentDocument.lines[i].priceWithTax;
              }

              // Si no hay articulos en la linea original dejamos la que esta dentro de la promo pero no se aplica
              if (this.currentDocument.lines[i].quantity == 0 && lineNoAplicaPromo != undefined) {
                this.currentDocument.lines[i] = lineNoAplicaPromo;
              } else if (lineNoAplicaPromo != undefined) { // En caso de que existan la añadimos debajo
                this._documentInternalService.publishLineDataForSetPromotion(lineNoAplicaPromo);
              }
              this._documentInternalService.publishLineDataForSetPromotion(lineAux);

              // ajustar arrays al desglose de lineas
              promotion.referredLineNumber = this.currentDocument.lines.length;
              promotion.timesAppliedWithDiscount[this.currentDocument.lines.length - 1] = promotion.timesAppliedWithDiscount[i];
              promotion.timesAppliedWithDiscount[i] = 0;
              promotion.timesApplied[i] = 0;
              promotion.amountPerUnitInTheInPromo[this.currentDocument.lines.length - 1] = promotion.amountPerUnitInTheInPromo[i];
              promotion.amountPerUnitInTheInPromo[i] = 0;
              // aumento los vectores para las demás promociones recibidas, de modo que todos tengan longitud igual a la del ticket, que crece:
              // receivedPromotionList.filter(p => p.timesApplied.length < promotion.timesApplied.length).forEach(
              //  promoParaAjustar => {
              //    promoParaAjustar.timesApplied.concat(0);
              //    promoParaAjustar.amountPerUnitInTheInPromo.concat(0);
              //  }
              // );

              // Reajustamos el precio total
              let sumTotalLineAux = 0;
              this.currentDocument.lines.forEach(line => {
                sumTotalLineAux += line.totalAmountWithTax;
              });
              this.currentDocument.totalAmountWithTax = sumTotalLineAux;
            }
          }
        }
      }
    });
    // ajustar arrays
    receivedPromotionList.filter(promo => promo.description != 'tarifa local') .forEach(
      promotion => {
        for (let line = 0; line < this.currentDocument.lines.length ; line++) {
          if (promotion.timesAppliedWithDiscount[line] == undefined) {
            promotion.timesAppliedWithDiscount[line] = 0;
            promotion.amountPerUnitInTheInPromo[line] = 0;
          }
        }
      }
    );
    receivedPromotionList.forEach(promotion => {
      if (promotion.description != 'tarifa local') { // Si es una promocio
        // const timesAppliedWithDiscount  = this._promotionsService.getTimesAppliedWithDiscount(this.currentDocument, promotion);
        for (let i = 0; i < promotion.timesAppliedWithDiscount.length; i++) {
          if (promotion.timesAppliedWithDiscount[i] > 0) {
            const lineRelated = i;
            if (this.currentDocument.lines[lineRelated].appliedPromotionList == undefined) {
              this.currentDocument.lines[lineRelated].appliedPromotionList = [];
            }
            // creamos dos lineas informativas: una con descuento y otra sin
            const promotionAuxConDesc: DocumentLinePromotion = {
              description: promotion.description,
              discountAmountWithTax: promotion.amountPerUnitInTheInPromo[lineRelated],
              // numberOfTimesApplied: timesAppliedWithDiscount[lineRelated],
              numberOfTimesApplied: promotion.timesAppliedWithDiscount[lineRelated],
              promotionId: promotion.promotionId,
              referredLineNumber: lineRelated + 1,
              timesApplied: promotion.timesApplied,
              timesAppliedWithDiscount: promotion.timesAppliedWithDiscount,
              amountPerUnitInTheInPromo: promotion.amountPerUnitInTheInPromo
            };
            /*  DEJAMOS FUERA LAS PROMOCIONES QUE NO APLICAN DESCUENTO A ESTE ARTICULO
            const promotionAuxSinDesc: DocumentLinePromotion = {
              description: promotion.description,
              discountAmountWithTax: 0,
              numberOfTimesApplied: promotion.timesApplied[lineRelated] - timesAppliedWithDiscount[lineRelated],
              promotionId: promotion.promotionId,
              referredLineNumber: lineRelated + 1,
              timesApplied: promotion.timesApplied,
              amountPerUnitInTheInPromo: promotion.amountPerUnitInTheInPromo
            };
            */
            if (promotionAuxConDesc.discountAmountWithTax != 0) {
              this.currentDocument.lines[lineRelated].appliedPromotionList.push(promotionAuxConDesc);
              this.currentDocument.lines[lineRelated].isPromoted = true;
            }
            // if (promotionAuxSinDesc.numberOfTimesApplied != 0) {
            //  this.currentDocument.lines[lineRelated].appliedPromotionList.push(promotionAuxSinDesc);
            // }
            if (this.currentDocument.lines[lineRelated].discountAmountWithTax == undefined) {
              this.currentDocument.lines[lineRelated].discountAmountWithTax = 0;
            }
            this.currentDocument.lines[lineRelated].discountAmountWithTax =
            promotionAuxConDesc.discountAmountWithTax * promotionAuxConDesc.numberOfTimesApplied;
            // limpiamos descuentos
            // if (this.currentDocument.lines[lineRelated].discountPercentage != undefined) {
              // this.currentDocument.lines[lineRelated].discountPercentage = 0;
            // }
          }
        }
        if (this.currentDocument.lines[promotion.referredLineNumber - 1].appliedPromotionListHTML == undefined) {
          this.currentDocument.lines[promotion.referredLineNumber - 1].appliedPromotionListHTML = [];
        }
        this.currentDocument.lines[promotion.referredLineNumber - 1].appliedPromotionListHTML.push(promotion);
        totalDiscountByPromotions += promotion.discountAmountWithTax;
      } else {
        isTarifa = true; // si en las promociones hay una tarifa local
        if (this.currentDocument.lines[promotion.referredLineNumber - 1].quantity != promotion.numberOfTimesApplied) {
          const lineAux = this._documentInternalService.cloneDocument(this.currentDocument).lines[promotion.referredLineNumber - 1];
          lineAux.priceWithTax =
            lineAux.priceWithTax - (promotion.discountAmountWithTax / promotion.numberOfTimesApplied);
          lineAux.quantity = promotion.numberOfTimesApplied;
          lineAux.totalAmountWithTax = lineAux.priceWithTax * lineAux.quantity;
          lineAux.PVPLocal = true;
          lineAux.discountPercentage = 0;
          // lineAux.appliedPromotionList = [];
          this.currentDocument.lines[promotion.referredLineNumber - 1].quantity =
            this.currentDocument.lines[promotion.referredLineNumber - 1].quantity - lineAux.quantity;
          this.currentDocument.lines[promotion.referredLineNumber - 1].totalAmountWithTax =
            // tslint:disable-next-line:max-line-length
            this.currentDocument.lines[promotion.referredLineNumber - 1].quantity * this.currentDocument.lines[promotion.referredLineNumber - 1].priceWithTax;
           // limpiamos descuentos
           /* this.currentDocument.lines[promotion.referredLineNumber - 1].discountPercentage = 0;
           this.currentDocument.lines[promotion.referredLineNumber - 1].discountAmountWithoutTax = 0;
           this.currentDocument.lines[promotion.referredLineNumber - 1].discountAmountWithTax = 0;
           lineAux.discountAmountWithTax = 0;
           lineAux.discountPercentage = 0;
           lineAux.discountAmountWithoutTax = 0;
           */
            this._documentInternalService.publishLineDataForSetPromotion(lineAux);
        } else {
          this.currentDocument.lines[promotion.referredLineNumber - 1].PVPLocal = true;
          this.currentDocument.lines[promotion.referredLineNumber - 1].discountPercentage = 0;
          this.currentDocument.lines[promotion.referredLineNumber - 1].priceWithTax = this._roundPipe.transformInBaseCurrency(
            // tslint:disable-next-line:max-line-length
            this.currentDocument.lines[promotion.referredLineNumber - 1].originalPriceWithTax - (promotion.discountAmountWithTax / promotion.numberOfTimesApplied));
          this.currentDocument.lines[promotion.referredLineNumber - 1].totalAmountWithTax =
            // tslint:disable-next-line:max-line-length
            this.currentDocument.lines[promotion.referredLineNumber - 1].priceWithTax * this.currentDocument.lines[promotion.referredLineNumber - 1].quantity;
          // limpiamos descuentos
          /* this.currentDocument.lines[promotion.referredLineNumber - 1].discountPercentage = 0;
          this.currentDocument.lines[promotion.referredLineNumber - 1].discountAmountWithoutTax = 0;
          this.currentDocument.lines[promotion.referredLineNumber - 1].discountAmountWithTax = 0; */
        }
      }
    });
    // if (receivedPromotionList.length > 0) {
    //  this._documentInternalService.notifyPromotionAdded();
    // }
    // NUEVAS PROMOS:
    if (receivedPromotionList.length > 0  || promoGlobal != undefined) {
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
      // Guardamos la promo de ticket como un nuevo medio de pago (Solo puede haber una promo global)
      const promoPM = this._appDataConfig.getPaymentMethodByType(PaymentMethodType.promotion);
      const baseCurrency: Currency = this._appDataConfig.currencyList.find(c => c.priorityType == CurrencyPriorityType.base);
      this.currentDocument.paymentDetails = [{
        paymentMethodId: promoPM.id,
        paymentDateTime: FormatHelper.formatToUTCDateFromLocalDate(new Date()),
        changeFactorFromBase: 1,
        currencyId: baseCurrency.id,
        primaryCurrencyGivenAmount: 0,
        primaryCurrencyTakenAmount: promoGlobal.discountAmountWithTax,
        extraData: { ['AuthorizationText']: '' != undefined ? '' : '' },
        method: promoPM
      }];
      // Guardamos el descuento en una variable para mostrar el total con dicho descuento
      // pero que no modifique el totalDiscountByPromotions que es el total a pagar
      this.globalPromo = promoGlobal.discountAmountWithTax;

      // para la visualizacion del descuento global al final del ticket, lo añadimos al ultimo articulo del ticket
      // Pero Sólo al array de visualizacion, no al array para el informe de promociones
      this.currentDocument.lines[this.currentDocument.lines.length - 1].appliedPromotionListHTML =
        this.currentDocument.lines[this.currentDocument.lines.length - 1].appliedPromotionListHTML.concat(promoGlobal);
    }
    this._logHelper.trace(`Total descuento aplicado al documento con las promociones: ${totalDiscountByPromotions.toString()}`);
    this.currentDocument.totalAmountWithTax = this._roundPipe.transformInBaseCurrency(
      this.currentDocument.totalAmountWithTax - totalDiscountByPromotions
    );
    if (this.currentDocument.discountAmountWithTax == undefined) {
      this.currentDocument.discountAmountWithTax = 0;
    }
    this.currentDocument.discountAmountWithTax += this._roundPipe.transformInBaseCurrency(totalDiscountByPromotions);
    // LogHelper.trace(`Documento DESPUES de completar insercion de lineas de promocion: ${JSON.stringify(this.currentDocument)}`);
  }
}
