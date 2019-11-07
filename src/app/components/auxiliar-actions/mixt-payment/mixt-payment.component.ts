import { DocumentLine } from 'app/shared/document/document-line';
import { Component, OnInit, OnDestroy, HostBinding, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { RoundPipe } from 'app/pipes/round.pipe';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { Document } from 'app/shared/document/document';
import { CustomerInternalService } from 'app/services/customer/customer-internal.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { CurrencyPriorityType } from 'app/shared/currency/currency-priority-type.enum';
import { PaymentMethod } from 'app/shared/payments/payment-method';
import { PaymentMethodType } from 'app/shared/payments/payment-method-type.enum';
import { MixtPaymentService } from 'app/services/payments/mixt-payment.service';
import { Currency } from 'app/shared/currency/currency';
import { PaymentDetail } from 'app/shared/payments/payment-detail';
import { PaymentPurpose } from 'app/shared/payments/PaymentPurpose.enum';
import { StatusBarService } from '../../../services/status-bar/status-bar.service';

import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { ChangePaymentInternalService } from 'app/services/payments/change-payment-internal.service';
import { buttonStatus } from 'app/shared/button-status.enum';
import { changedPayment } from 'app/shared/payments/changed-payment';
import { DocumentSearchInternalService } from 'app/services/document/document-search-internal.service';
import { SearchDocumentMode } from 'app/shared/document-search/search-document-mode.enum';
import { GetDocumentResponseStatuses } from 'app/shared/web-api-responses/get-document-response-statuses.enum';
import { SignalRTMEService } from 'app/services/signalr/signalr-tme.service';

import { LanguageService } from 'app/services/language/language.service';
import { TpvStatusCheckerService } from 'app/services/tpv-status-checker.service';
import { DocumentService } from 'app/services/document/document.service';
import { KeyboardInternalService } from 'app/services/keyboard/keyboard-internal.service';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';
import { LogHelper } from 'app/helpers/log-helper';

enum CollectionButtonVisibilty {
  collection = 0,
  invoice = 1,
  both = 2
}
@Component({
  selector: 'tpv-mixt-payment',
  templateUrl: './mixt-payment.component.html',
  styleUrls: ['./mixt-payment.component.scss']
})
export class MixtPaymentComponent implements OnInit, OnDestroy, IActionFinalizable<boolean>, AfterViewInit {
  @HostBinding('class') class = 'tpv-mixt-payment';
  // para poner el foco en el input
  @ViewChild('inputPayment') inputPayment: ElementRef;

  private _onMixtPayment: Subject<boolean> = new Subject();
  private _paymentPurpose: PaymentPurpose;
  private _currentDocument: Document;
  private allowPending: boolean;
  private invoiceMandatory: boolean = false;
  private _requestingSendSale: boolean = false;
  collectionButtonVisibility: CollectionButtonVisibilty = 2;
  currencySelected: Currency;
  baseCurrency: Currency;
  secondaryCurrency: Currency;
  paymentMethodTypeWithSecondaryCurrency: PaymentMethodType;
  isUnknownCustomer: boolean = false;
  titulo: string;
  pendiente: number;
  SubTotalDeudas: number;
  changeDelivered: number;
  inputNumber: string;
  inputNumberInBaseCurrency: number;
  showActions: boolean;
  paymentMethodList: Array<PaymentMethod>;
  listOfPayments: Array<PaymentDetail> = [];
  changeFactorFromSecondary: number;
  selectedIndex: number;
  MsgValidateDebt: boolean = false;
  MsgValidateDebtTex: string = '';
  currentChanged: changedPayment = {
    selectedIndex: -1, typeCall: 0, isTicket: false, ticket: '', total: 0, isCharged: false, totalChange: 0, changePend: 0
    , customerId: '', paymentType: 0, counterSecond: 0, isStop: false, isButtonHidden: true, isButtonFactura: true, isButtonTicket: true
  };
  private messajeconfirmAction = this.getLiteral('mixt_payment_component', 'literal_messajeconfirmAction');
  private messajeconfirmActionDeuda = this.getLiteral('mixt_payment_component', 'literal_messajeconfirmActionDeuda');
  private messajeconfirmMatricula = this.getLiteral('mixt_payment_component', 'messageconfirmMatricula');
  messajeErrorDeudaArticulo: string = this.getLiteral('mixt_payment_component', 'literal_messajeErrorDeudaArticulo');
  private bolContingenciaSeleccionado = false;
  private bolNoReclamadoSeleccionado = false;

  constructor(
    private _appDataConfig: AppDataConfiguration,
    // private _creditCardPaymentService: CreditCardPaymentService,
    private _mixtPaymentService: MixtPaymentService,
    private _roundPipe: RoundPipe,
    private _customerInternalService: CustomerInternalService,
    private _statusBarService: StatusBarService,
    private _confirmActionSvc: ConfirmActionService,
    private _changeDelivered: ChangePaymentInternalService,
    private _documentSearchInternal: DocumentSearchInternalService,
    private _signalRTMEService: SignalRTMEService,
    private _languageService: LanguageService,
    private _tpvStatusCheckerService: TpvStatusCheckerService,
    private _documentService: DocumentService,
    private _keyboardInternalService: KeyboardInternalService,
    private _documentInternalSvc: DocumentInternalService,
    private _electronicJournal: ElectronicJournalService,
    private  _logHelper: LogHelper
  ) {
    window.addEventListener('resize', () => this._setMixtHeight());
    this.allowPending = _appDataConfig.allowPendingPayment;
  }
  /**
   * Inicializa los valores para este componente
   * @param document contiene la informacion del pago
   * @param paymentPurpose indica el proposito del pago
   * @param invoiceMandatory indica si es obligatorio la emision de factura
   */
  setDocumentAndPaymentPurpose(document: Document, paymentPurpose: PaymentPurpose, invoiceMandatory: boolean) {
    this._currentDocument = document;
    this._paymentPurpose = paymentPurpose;
    this.invoiceMandatory = invoiceMandatory;
    this._initialize();
  }
  setInputFocus() {
    if (this.inputPayment) {
      (this.inputPayment.nativeElement as HTMLElement).focus();
      (this.inputPayment.nativeElement as HTMLElement).click();
    }
  }

  ngOnInit() {
    this._keyboardInternalService.ShowTwoPoints(false);
  }

  ngOnDestroy() {
  }

  ngAfterViewInit(): void {
    this._setMixtHeight();
    // NOTA: hack timeout para ejecutar funciones estando ya renderizado el HTML
    setTimeout(() => {
      this.setInputFocus();
    }, 0);
    if (this._currentDocument.paymentDetails != undefined
      && this._currentDocument.paymentDetails.length > 0) {
      this._currentDocument.paymentDetails.forEach(pD => {
        if (+pD.paymentMethodId.substring(5) == PaymentMethodType.promotion) {
          // this.listOfPayments.unshift(pD);
          // tslint:disable-next-line:max-line-length
          // this._insertPayment(pD.method, pD.primaryCurrencyTakenAmount, this._currentDocument.pendingAmountWithTax - pD.primaryCurrencyTakenAmount);
          this._insertPayment(pD.method, pD.primaryCurrencyTakenAmount, 27 - pD.primaryCurrencyTakenAmount);
          this.pendiente -= Number(pD.primaryCurrencyTakenAmount);
          this.pendiente = this._roundPipe.transformInBaseCurrency(this.pendiente);
          this.inputNumber = this._roundPipe.transformInBaseCurrency(this.pendiente).toString();
        }
      });
    }
    // al inicializarse la vista hago click en el input para que aparezca el teclado
    this.triggleClickEventOnInput();
  }


  onFinish(): Observable<boolean> {
    return this._onMixtPayment.asObservable();
  }

  forceFinish(): void {
    this._onMixtPayment.next(undefined);
  }

  setInputNumber(numero: string): void {
    const str: string = this.inputNumber.toString() + numero;
    this.inputNumber = str;
  }

  // al clicar en un método de pago le sugiere la cantidad exacta que falta por pagar
  payment(index: number) {
    if (this.pendiente > 0 && this._paymentPurpose !== PaymentPurpose.Refund) {
      this.triggleClickEventOnInput();
      this.selectedIndex = index;
      this.inputNumber = this._roundPipe.transformInBaseCurrency(this.pendiente).toString();
      if (this.paymentMethodList && this.paymentMethodList[index] &&
        // CAMBIAR CODIGO MEDIO DE PAGO POR CONSTANTE
        this.paymentMethodList[index].id.substring(5) == PaymentMethodType.localcredit.toString()) {
        if (this.pendiente == this._currentDocument.totalAmountWithTax) {
          // Comprobar si el cliente tiene el credito activado y saldo suficiente, si no lo tiene no ejecutar this.setPayment();
          this.setPayment();
        } else {
          this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixPayment_MeansPayLocalNotMixed'));
          // Quitamos La Selección de Credito local y ponemos el valor por defecto
          this.selectedIndex = 0;
        }
      } else if (this.paymentMethodList && this.paymentMethodList[index] &&
        this.paymentMethodList[index].id.substring(5) == PaymentMethodType.otherBanks.toString()) {
        this.setPayment();
      } else
        // si es segunda divisa se calcula la cantidad a sugerir en dicha divisa
        if (this.paymentMethodList && this.paymentMethodList[index] &&
          this.paymentMethodList[index].currencyType == CurrencyPriorityType.secondary) {
          this.currencySelected = this._appDataConfig.getCurrencyByType(this.paymentMethodList[index].currencyType);
          this.inputNumber = this.inputNumberToSecundaryCurrencySupplyingPending((Number)(this.inputNumber)).toString();
          this.setInfoAboutPaymentSecondaryCurrency();
        }
      // NOTA: hack timeout para ejecutar funciones estando ya cambiado el HTML
      setTimeout(() => {
        this.setInputFocus();
      });
    }
    else if (this._paymentPurpose === PaymentPurpose.Refund && this.listOfPayments !== []) {
      if ((this.paymentMethodList[index].id === this._appDataConfig.company.id + '70') ||
        (this.paymentMethodList[index].id === this._appDataConfig.company.id + '71')) {
        // borramos todo
        this.pendiente = -this._currentDocument.totalAmountWithTax;
        this.listOfPayments = [];
        this.changeDelivered = 0;

        if (this._currentDocument.customer.id == this._appDataConfig.unknownCustomerId) {
          this._changeVisibilityActions(false);
        }
        this._changeVisibilityActions(false);

        // y agregamos el seleccionado

        // agregamos contingencia
        if ((this.paymentMethodList[index].id === this._appDataConfig.company.id + '71') && !this.bolContingenciaSeleccionado) {
          this._insertPayment(this.paymentMethodList[index], this.pendiente, this.pendiente);
          this.pendiente = 0;
          this.bolContingenciaSeleccionado = true;
        }

        // quitamos contingencia y ponemos el medio de pago original
        else if ((this.paymentMethodList[index].id === this._appDataConfig.company.id + '71') && this.bolContingenciaSeleccionado) {
          this._documentSearchInternal.getDocument(this._currentDocument.referencedDocumentIdList[0], SearchDocumentMode.Copy)
            .first()
            .subscribe(response => {
              if (response == undefined || response.status != GetDocumentResponseStatuses.Successful) {
                this._logHelper.trace(response.message);
                this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixtPayment_MeansPayLocalNotMixed'));
                return;
              }
              // this._currentDocument.paymentDetails = response.document.paymentDetails;

              this.reordenaMediosPagoDevolucion(response.document.paymentDetails);
            });

          this.bolContingenciaSeleccionado = false;
        }

        // agregamos no reclamado
        else if ((this.paymentMethodList[index].id === this._appDataConfig.company.id + '70') && !this.bolNoReclamadoSeleccionado) {
          this._insertPayment(this.paymentMethodList[index], this.pendiente, this.pendiente);
          this.pendiente = 0;
          this.bolNoReclamadoSeleccionado = true;
        }

        // quitamos no reclamado y ponemos el medio de pago original
        else if ((this.paymentMethodList[index].id === this._appDataConfig.company.id + '70') && this.bolNoReclamadoSeleccionado) {
          this._documentSearchInternal.getDocument(this._currentDocument.referencedDocumentIdList[0], SearchDocumentMode.Copy)
            .first()
            .subscribe(response => {
              if (response == undefined || response.status != GetDocumentResponseStatuses.Successful) {
                this._logHelper.trace(response.message);
                this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixtPayment_MeansPayLocalNotMixed'));
                return;
              }
              // this._currentDocument.paymentDetails = response.document.paymentDetails;

              this.reordenaMediosPagoDevolucion(response.document.paymentDetails);
            });

          this.bolNoReclamadoSeleccionado = false;
        }

        if (this.pendiente <= 0) {
          this.pendiente = 0;
          this._changeVisibilityActions(true);
        }
      }
      else {
        this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixtPayment_NotChangeMeansPayReturn'));
      }
    }
  }

  // si es la segunda divisa, se recomienda el pago en esa divisa
  // mientras no se supla la cantidad pendiente se suma la cantidad correspondiente
  inputNumberToSecundaryCurrencySupplyingPending(inputNumber: number): number {
    // cantidad a introducir a segunda divisa y con decimales posibles
    let inputNumberToSecundaryCurrency = this._convertBaseToSecondary((Number)(inputNumber));
    // convertimos ese valor a la moneda base para saber si al recortar decimales no se llega a la cantidad a pagar
    let inputNumberToBaseCurrency = this._convertSecondaryToBase((Number)(inputNumberToSecundaryCurrency));
    // si no se llega a la cantidad a pagar se empiezan a sumar decimales hasta llegar a la cantidad
    while (inputNumberToBaseCurrency < this.pendiente) {
      inputNumberToSecundaryCurrency += (1 / Math.pow(10, this.secondaryCurrency.decimalPositions));
      inputNumberToSecundaryCurrency = this._roundPipe.transformInSecondaryCurrency(inputNumberToSecundaryCurrency);
      inputNumberToBaseCurrency = this._convertSecondaryToBase((Number)(inputNumberToSecundaryCurrency));
    }
    return inputNumberToSecundaryCurrency;
  }

  // si el importe a introducir es modificado con segunda divisa,
  // se actualiza el valor del dinero pendiente mostrado en divisa base en la UI
  setInfoAboutPaymentSecondaryCurrency() {
    if (this.selectedIndex && this.paymentMethodList) {
      if (this.paymentMethodList[this.selectedIndex].currencyType == CurrencyPriorityType.secondary) {
        this.inputNumberInBaseCurrency =
          this._roundPipe.transformInBaseCurrency(this._convertSecondaryToBase((Number)(this.inputNumber)));
      }
    }
  }

  // se introduce una cantidad de dinero a pagar y se recalculan datos como el pendiente y el cambio
  setPayment(): void {
    if (this._validatePayment() == true) {
      if (this.paymentMethodList[this.selectedIndex].type !== PaymentMethodType.cash && Number(this.inputNumber) >= this.pendiente) {
        // si el medio de pago es credito local realizamos las validaciones correspondientes
        if (this.paymentMethodList[this.selectedIndex].id.substring(5) == PaymentMethodType.localcredit.toString()) {
          if (this._currentDocument.customer.riesgo1 > 0) {
            if (this._currentDocument.customer.riesgo1 >= (this.pendiente + this._currentDocument.customer.riesgo2)) {
              // si no es efectivo y se introduce más cantidad de lo que hay que pagar
              // se inserta como cantidad introducida SOLO lo que haya que pagar
              this._insertPayment(this.paymentMethodList[this.selectedIndex], this.pendiente, this.pendiente);
              this.pendiente = 0;
              this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixtPayment_PayMethodAddCorrectly'));
            } else {
              this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component',
                'message_MixtPayment_ReachedMaximumCreditHaveLeft') + ' '
                + (this._currentDocument.customer.riesgo1 - this._currentDocument.customer.riesgo2).toFixed(2) + ' €');
              // Quitamos La Selección de Credito local y ponemos el valor por defecto
              this.selectedIndex = 0;
            }
          } else {
            this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixtPayment_ClientNotHaveCreditActive'));
            // Quitamos La Selección de Credito local y ponemos el valor por defecto
            this.selectedIndex = 0;
          }
        } else {
          // si no es efectivo y se introduce más cantidad de lo que hay que pagar
          // se inserta como cantidad introducida SOLO lo que haya que pagar
          this._insertPayment(this.paymentMethodList[this.selectedIndex], this.pendiente, this.pendiente);
          this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixtPayment_PayMethodAddCorrectly'));
          this.pendiente = 0;
        }
      } else {
        // si es efectivo o se introduce una cantidad menor que el pendiente
        // se inserta como cantidad introducida la que haya sido
        // se calcula el nuevo pendiente y el posible cambio solo si es efectivo
        this._insertPayment(this.paymentMethodList[this.selectedIndex], Number(this.inputNumber), this.pendiente);
        this.pendiente -= Number(this.inputNumber);
        this.pendiente = this._roundPipe.transformInBaseCurrency(this.pendiente);
        // Se calcula el cambio en pagos mixtos
        if (this.pendiente <= 0) {
          this.changeDelivered = -(this.pendiente);
        }
        this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixtPayment_PayMethodAddCorrectly'));
      }
    }
    // si ya se ha llegado al pendiente se mira si hay cambio y se muestran acciones
    if (this.pendiente <= 0) {
      this.pendiente = 0;
      this._changeVisibilityActions(true);
    }
    this._resetPaymentIntroduction();
  }

  // se borran todos los pagos introducidos y se resetean los valores
  deleteAllPayments() {
    if (this._paymentPurpose !== PaymentPurpose.Refund) {
      if (this._currentDocument.isCobro && this._currentDocument.pendingAmountWithTax != undefined) {
        this.pendiente = +this._currentDocument.pendingAmountWithTax.toFixed(2);
      } else {
        this.pendiente = this._currentDocument.totalAmountWithTax;
      }
      this.listOfPayments = [];
      this.changeDelivered = 0;

      if (this._currentDocument.customer.id == this._appDataConfig.unknownCustomerId) {
        this._changeVisibilityActions(false);
      }
      this._changeVisibilityActions(this.pendiente <= 0);
    } else {
      this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixtPayment_NotChangeMeansPayReturn'));
    }
  }

  recalculoPendienteDeudasFugas(): number {
    this.SubTotalDeudas = 0;
    if (this.listOfPayments != undefined) {
      this.listOfPayments.forEach((paymentDetailCalc: { primaryCurrencyGivenAmount: number; }) => {
        this.SubTotalDeudas += paymentDetailCalc.primaryCurrencyGivenAmount;
      });
    }

    return (this.SubTotalDeudas);
  }


  // se actualiza el cambio, el pendiente y se dejan de mostrar los botones de finalizar acción
  deleteFromlistOfPayments(item: PaymentDetail) {
    if (this._paymentPurpose !== PaymentPurpose.Refund) {
      let sumGiven = 0, metallicPayment: PaymentDetail, indexPaymentDelete: number;
      if (this.listOfPayments != undefined) {
        sumGiven = this.recalculoPendienteDeudasFugas();
      } else {
        sumGiven = this._currentDocument.totalAmountWithTax;
      }
      // sumamos las cantidades cogidas salvo del pago a eliminar
      this.listOfPayments.forEach((payment, index) => {
        if (payment.paymentMethodId == item.paymentMethodId && payment.currencyId == item.currencyId) {
          indexPaymentDelete = index;
          // si es el metodo a eliminar, no hacemos nada
          return;
        }
        sumGiven -= payment.primaryCurrencyGivenAmount;
        if (payment.method.type == PaymentMethodType.cash) {
          metallicPayment = payment;
        }
      });
      // si el el given es superior al total del documento, existira cambio, solo si existe metalico
      if (sumGiven > this._currentDocument.totalAmountWithTax && metallicPayment != undefined) {
        this.changeDelivered = this._roundPipe.transformInBaseCurrency(sumGiven - this._currentDocument.totalAmountWithTax);
        // actualizo la cantidad taken del medio de pago metalico
        metallicPayment.primaryCurrencyTakenAmount =
          this._roundPipe.transformInBaseCurrency(metallicPayment.primaryCurrencyGivenAmount - this.changeDelivered);
        if (metallicPayment.secondaryCurrencyGivenAmount != undefined) {
          metallicPayment.secondaryCurrencyTakenAmount =
            this._roundPipe.transformInSecondaryCurrency(metallicPayment.primaryCurrencyTakenAmount * metallicPayment.changeFactorFromBase);
        }
        this.pendiente = 0;
      } else if (sumGiven == this._currentDocument.totalAmountWithTax) {
        this.pendiente = sumGiven;

        if (item.method.type == PaymentMethodType.cash) {
          this.changeDelivered = 0;
        }

      } else {

        if (item.method.type == PaymentMethodType.cash) {
          this.changeDelivered = 0;
        }

        if (metallicPayment != undefined) {
          metallicPayment.primaryCurrencyTakenAmount = metallicPayment.primaryCurrencyGivenAmount;
          if (metallicPayment.secondaryCurrencyGivenAmount != undefined) {
            metallicPayment.secondaryCurrencyTakenAmount =
              this._roundPipe.transformInSecondaryCurrency(metallicPayment.primaryCurrencyTakenAmount * metallicPayment.changeFactorFromBase);
          }
        }

      }
      this._changeVisibilityActions(this.pendiente <= 0);
      this.listOfPayments.splice(indexPaymentDelete, 1);

      if (this.listOfPayments.length !== 0) {
        this.pendiente += +item.primaryCurrencyGivenAmount.toFixed(2);
      } else {
        if (this._currentDocument.isCobro && this._currentDocument.pendingAmountWithTax != undefined) {
          this.pendiente = +this._currentDocument.pendingAmountWithTax.toFixed(2);
        } else {
          this.pendiente = +this._currentDocument.totalAmountWithTax.toFixed(2);
        }
      }

      // Redondeamos pendiente
      this.pendiente = +this.pendiente.toFixed(2);

      // actualiza cantidad ofrecida si hay método de pago seleccionado
      if (this.selectedIndex != undefined) {
        this.payment(this.selectedIndex);
      }
      this._setDefaultSelectedPaymentMethod();
    } else {
      this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixtPayment_NotChangeMeansPayReturn'));
    }
  }

  triggleClickEventOnInput() {
    // valido que el click solo se hará solo si hay dinero pendiente
    if (this.pendiente > 0 && this._paymentPurpose !== PaymentPurpose.Refund) {
      // Despacho click event en el input para que se abra el teclado
      // Create the event.
      const event = document.createEvent('Event');
      // init event
      event.initEvent('click', false, true);
      // dispatch event
      if (this.inputPayment !== undefined && this.inputPayment.nativeElement !== undefined) {
        this.inputPayment.nativeElement.dispatchEvent(event);
      }
    }
  }
  /*********************
   * VIEW COLLECT ACTIONS
   * ******************/
  requestCollectClick() {
    this.requestEndSale(false);
  }
  isButtonDisabled() {
    return this._requestingSendSale || (this.listOfPayments != undefined && this.listOfPayments.length == 0);
  }
  private _changeVisibilityActions(showActionsVisibility: boolean) {
    // muestra acciones si se permite pago pendiente a clientes identificados o si expresamente se indica
    this.showActions = (this.allowPending && !this._customerInternalService.isUnknownCustomer(this._currentDocument.customer.id))
      || showActionsVisibility;
  }

  private _validatePayment(): boolean {
    // debe de haber un método de pago seleccionado
    if (this.selectedIndex == undefined) {
      return false;
    }
    // solo se añade pago si aún queda dinero pendiente
    if (this.pendiente <= 0) {
      return false;
    }
    // no se puede introducir una cantidad 0
    const inputAmount = (Number)(this.inputNumber);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      return false;
    }
    // solo cantidades con x o menos decimales según divisa
    this._validateInputNumber();
    return true;
  }

  // no se permite introducir más decimales de los que permite la divisa
  // redondeamos el número según los decimales que si están permitidos
  private _validateInputNumber(): void {
    const inputNumberString = this.inputNumber + '';
    if (inputNumberString) {
      const decimalsOfNumber = inputNumberString.split('.')[1];
      if (decimalsOfNumber && this.currencySelected && decimalsOfNumber.length > this.currencySelected.decimalPositions) {
        if (this.currencySelected.priorityType == CurrencyPriorityType.base) {
          this.inputNumber = this._roundPipe.transformInBaseCurrency((Number)(this.inputNumber)).toString();
        } else {
          this.inputNumber = this._roundPipe.transformInSecondaryCurrency((Number)(this.inputNumber)).toString();
        }
      }
    }
  }

  // resetea datos de la introducción de un pago (pendiente y medio de pago seleccionado por defecto)
  private _resetPaymentIntroduction() {
    this.inputNumber = '0';
    this._setDefaultSelectedPaymentMethod();
  }

  // Se inserta un pago con un método de pago. Si es correcto se actualizan las cuantías pendientes y el cambio
  // Si ya se introdujo una cantidad de un método de pago, se suma a dicho método en la tabla
  // Si es a un nuevo método de pago se crea una nueva fila para dicho método
  private _insertPayment(metodo: PaymentMethod, givenInputAmount: number, pendiente: number) {
    givenInputAmount = parseFloat(givenInputAmount.toFixed(2));
    let secondaryGivenAmount, secondaryTakenAmount;
    if (metodo.currencyType === undefined) {
      metodo.currencyType = CurrencyPriorityType.base;
    }
    const currencyPaymentMethod = this._appDataConfig.getCurrencyByType(metodo.currencyType);
    // si metodo es con segunda moneda se guarda en SECONDARYAMOUNT y los datos se convierten a divisa base
    if (metodo.currencyType == CurrencyPriorityType.secondary) {
      secondaryGivenAmount = givenInputAmount;
      const pendingPayment = this._roundPipe.transformInBaseCurrency(this.pendiente);
      const inputPaymentToSupplyPending = this.inputNumberToSecundaryCurrencySupplyingPending(pendingPayment);
      secondaryTakenAmount = this._getTakenAmount(givenInputAmount, inputPaymentToSupplyPending);
      givenInputAmount = this._convertSecondaryToBase(givenInputAmount);
      // la cantidad insertada se vuelve a pasar a base para el resto de calculos
      this.inputNumber = givenInputAmount.toString();
    }
    // se obtiene el dinero dado del cliente y el obtenido finalmente por el tpv
    const takenAmount = this._getTakenAmount(givenInputAmount, pendiente);
    // se actualiza método o se introduce nuevo según si ya existe o no
    const index = this._listOfPaymentsContainsPayment(metodo.id, currencyPaymentMethod.id);
    if ((index >= 0) && (metodo.type == PaymentMethodType.cash)) {

      const roundedAmount: number | undefined = this._roundPipe.transformInBaseCurrency(
        (metodo.currencyType == CurrencyPriorityType.secondary ?
          this.listOfPayments[index].secondaryCurrencyTakenAmount :
          this.listOfPayments[index].primaryCurrencyTakenAmount));
      const roundedNewAmount: number | undefined = this._roundPipe.transformInBaseCurrency(
        (metodo.currencyType == CurrencyPriorityType.secondary ?
          this.listOfPayments[index].secondaryCurrencyTakenAmount + secondaryTakenAmount :
          this.listOfPayments[index].primaryCurrencyTakenAmount + takenAmount));
      // Electronic Journal - paymentAdded
      this._electronicJournal.writeAction({
        type: ActionType.paymentUpdated,
        selectedDocument: this._documentInternalSvc.currentDocumentIndex.toString(),
        paymentMode: metodo.type,
        amount: roundedAmount.toString() + currencyPaymentMethod.symbol,
        paymentDescription: metodo.description,
        newAmount: roundedNewAmount.toString() + currencyPaymentMethod.symbol,
      });

      this.listOfPayments[index].primaryCurrencyTakenAmount += takenAmount;
      this.listOfPayments[index].primaryCurrencyGivenAmount += givenInputAmount;
      // Redondeo a dos decimales
      this.listOfPayments[index].primaryCurrencyTakenAmount = +this.listOfPayments[index].primaryCurrencyTakenAmount.toFixed(2);
      this.listOfPayments[index].primaryCurrencyGivenAmount = +this.listOfPayments[index].primaryCurrencyGivenAmount.toFixed(2);
    } else {
      const roundedAmount: number | undefined = this._roundPipe.transformInBaseCurrency(
        (metodo.currencyType == CurrencyPriorityType.secondary ? secondaryTakenAmount : takenAmount));
      // Electronic Journal - paymentAdded // refundCaptured
      this._electronicJournal.writeAction({
        type: (this._paymentPurpose == PaymentPurpose.Refund ? ActionType.refundCaptured : ActionType.paymentAdded),
        selectedDocument: this._documentInternalSvc.currentDocumentIndex.toString(),
        paymentMode: metodo.type,
        amount: roundedAmount.toString() + currencyPaymentMethod.symbol,
        paymentDescription: metodo.description,
      });

      this.listOfPayments.unshift({
        paymentMethodId: metodo.id,
        paymentDateTime: new Date(),
        currencyId: currencyPaymentMethod.id,
        changeFactorFromBase: currencyPaymentMethod.changeFactorFromBase,
        primaryCurrencyTakenAmount: takenAmount,
        primaryCurrencyGivenAmount: givenInputAmount, // givenInputAmount > takenAmount ? takenAmount : givenInputAmount,
        secondaryCurrencyTakenAmount: secondaryTakenAmount,
        secondaryCurrencyGivenAmount: secondaryGivenAmount,
        method: metodo
      });
    }
  }

  // obtiene el valor monetario que guarda el TPV
  // si se da más dinero que el pendiente, el TPV solo guardará el pendiente
  // si se da menos dinero que el pendiente, el TPV guardará solo la cantidad introducida
  private _getTakenAmount(givenInputAmount: number, pendiente: number) {
    if (pendiente >= givenInputAmount) {
      return givenInputAmount;
    } else {
      return pendiente;
    }
  }

  // ej: si la base es €, 1 euro son 166.386 pesetas
  private _convertBaseToSecondary(amount: number): number {
    let amountInSecondaryCurrency;
    if (this.secondaryCurrency) {
      amountInSecondaryCurrency = this._roundPipe.transformInSecondaryCurrency(amount * this.secondaryCurrency.changeFactorFromBase);
    }
    return amountInSecondaryCurrency;
  }

  // ej: si la base es €, 1 euro son 166.386 pesetas
  private _convertSecondaryToBase(amount: number): number {
    let amountInBaseCurrency;
    if (this.secondaryCurrency) {
      amountInBaseCurrency = this._roundPipe.transformInBaseCurrency(amount / this.secondaryCurrency.changeFactorFromBase);
    }
    return amountInBaseCurrency;
  }

  // compruebo que el metodo de pago no esta en el array y si lo esta devuelvo el indice del mismo
  private _listOfPaymentsContainsPayment(paymentMethodId: string, currencyId: string): number {
    return this.listOfPayments.findIndex(it => it.paymentMethodId == paymentMethodId && it.currencyId == currencyId);
  }

  // inicializa los métodos de pago y otros datos (pendiente, si hay cliente contado...)
  // se añade método de pago que tenga divisa secundaria a parte de la base
  private _initialize() {
    // permite acciones si se admite el pago pendiente
    this.showActions = !this._customerInternalService.isUnknownCustomer(this._currentDocument.customer.id) && this.allowPending;

    if (this._paymentPurpose === PaymentPurpose.PendingPayment) {
      this.showActions = false;
    }

    // lista de los métodos de pago teniendo en cuenta las divisas
    if (this._appDataConfig.paymentMethodList != undefined) {
      this.paymentMethodList = this._appDataConfig.paymentMethodList.filter(p => p.type !== PaymentMethodType.runaway);
    }

    // CAMBIO DE FUNCIONALIDAD, AHORA HAY QUE OCULTAR LOS MEDIOS DE PAGO QUE NO SON "PARATPV"
    this.paymentMethodList = this.paymentMethodList.filter(p => p.paraTPV);

    // si está el TME, ocultaremos el medio de pago "DESCUENTO SOLRED"
    if (this._signalRTMEService.getStatusConnection()) {
      this.paymentMethodList = this.paymentMethodList.filter(p => p.id !== this._appDataConfig.company.id + '11');
    }

    // datos constantes
    switch (this._paymentPurpose) {
      case PaymentPurpose.NewDocument:
        this.titulo = this.getLiteral('mixt_payment_component', 'header_MixPayment_MixPayment'); // 'PAGO MIXTO';
        this.pendiente = this._currentDocument.totalAmountWithTax;
        this.collectionButtonVisibility = CollectionButtonVisibilty.both;
        this.paymentMethodList = this.paymentMethodList.filter(p => p.id !== this._appDataConfig.company.id + '70');
        break;
      case PaymentPurpose.PendingPayment:
        this.titulo = this.getLiteral('mixt_payment_component', 'header_MixPayment_PendingPayment'); // 'PAGO PENDIENTE';
        this.pendiente = parseFloat(this._currentDocument.pendingAmountWithTax.toFixed(2));
        this.collectionButtonVisibility = CollectionButtonVisibilty.collection;
        this.paymentMethodList = this.paymentMethodList.filter(p => p.id !== this._appDataConfig.company.id + '70');
        break;
      case PaymentPurpose.Refund:
        this.titulo = this.getLiteral('mixt_payment_component', 'header_MixPayment_Refund'); // 'DEVOLUCIÓN';
        this.pendiente = 0;
        this.collectionButtonVisibility = CollectionButtonVisibilty.collection;
        break;
      default:
    }
    if (this.invoiceMandatory) {
      this.collectionButtonVisibility = CollectionButtonVisibilty.invoice;
    }
    if (this._paymentPurpose === PaymentPurpose.Refund) {
      // recuperar los medios de pago a mostrar
      this._documentSearchInternal.getDocument(this._currentDocument.referencedDocumentIdList[0], SearchDocumentMode.Copy)
        .first()
        .subscribe(response => {
          if (response == undefined || response.status != GetDocumentResponseStatuses.Successful) {
            this._logHelper.trace(response.message);
            this._statusBarService.publishMessage(this.getLiteral('mixt_payment_component', 'message_MixtPayment_ErrorGetMeansPay'));
            return;
          }
          // this._currentDocument.paymentDetails = response.document.paymentDetails;
          this.pendiente = -this._currentDocument.totalAmountWithTax;
          this.reordenaMediosPagoDevolucion(response.document.paymentDetails);

          if (this.pendiente <= 0) {
            this.pendiente = 0;
            this._changeVisibilityActions(true);
          }
        });
    } else {
      this.listOfPayments = [];
    }
    this.changeDelivered = 0;
    this.inputNumber = '0';
    // divisas
    this.currencySelected = this.baseCurrency = this._appDataConfig.baseCurrency;
    this.secondaryCurrency = this._appDataConfig.secondaryCurrency;
    this.paymentMethodTypeWithSecondaryCurrency = PaymentMethodType.cash;
    // pendiente y saber si el cliente es contado o no
    if (this._currentDocument != undefined) {
      this.isUnknownCustomer = this._currentDocument.customer == undefined ?
        true
        : this._customerInternalService.isUnknownCustomer(this._currentDocument.customer.id);
    }
    // pagos con segunda divisa
    this._addTypeCurrencyPaymentMethod();
    if (this.secondaryCurrency) {
      this._addPaymentMethodSecondaryCurrency(this.paymentMethodTypeWithSecondaryCurrency);
    }
    this._setDefaultSelectedPaymentMethod();
    this.collectionButtonVisibility = 3;
  }


  // medio de pago seleccionado por defecto y actualiza cantidad recomendada a introducir como próximo pago
  private _setDefaultSelectedPaymentMethod() {
    if (this.paymentMethodList && this.paymentMethodList.length > 0 && this.pendiente > 0) {
      this.selectedIndex = 1;
      this.payment(this.selectedIndex);
    } else {
      this.selectedIndex = undefined;
    }
  }

  // se especifica el tipo de divisa para cada método de pago
  // si en lista divisas hay segunda divisa, se añade a los tipos de pago
  private _addTypeCurrencyPaymentMethod() {
    this.paymentMethodList.forEach(paymentMethod => {
      paymentMethod.currencyType = CurrencyPriorityType.base;
    });
    if (this.secondaryCurrency) {
      this.changeFactorFromSecondary = this._roundPipe.transformInBaseCurrency(1 / this.secondaryCurrency.changeFactorFromBase);
    }
  }

  // duplica el método de pago, uno con la divisa base y otro con la secundaria
  // NOTA: la segunda divisa de momento solo para el pago en efectivo
  private _addPaymentMethodSecondaryCurrency(paymentMethodTypeWithSecondaryCurrency: PaymentMethodType) {
    const paymentMethod: PaymentMethod = this._appDataConfig.getPaymentMethodByType(paymentMethodTypeWithSecondaryCurrency);
    const paymentMethodSecondary: PaymentMethod = Object.assign({}, paymentMethod);
    if (paymentMethodSecondary && this.paymentMethodList != undefined) {
      // tipo de divisa
      paymentMethodSecondary.currencyType = this.secondaryCurrency.priorityType;
      paymentMethod.currencyType = this._appDataConfig.baseCurrency.priorityType;
      // cambiamos la descripción para que se vea en UI el símbolo divisa
      paymentMethodSecondary.panelDescription = this.secondaryCurrency.symbol;
      paymentMethod.panelDescription = this.baseCurrency.symbol;
      // se elimina el tipo de pago original y se añaden los dos (con divisa base y con secundaria)
      this.paymentMethodList = this.paymentMethodList.filter(p => p.id !== paymentMethod.id);
      this.paymentMethodList.unshift(paymentMethodSecondary);
      this.paymentMethodList.unshift(paymentMethod);
    }
  }

  // se envia la venta con los métodos de pago y cuantías que se hayan elegido
  private requestEndSale(emitirFactura: boolean) {

    if (this.pendiente != undefined && this.pendiente > 0) {
      if (this.ComprobarLimpiarLineasArt(this._currentDocument)) {
        this._confirmActionSvc.promptActionConfirm(
          this.messajeErrorDeudaArticulo,
          this.getLiteral('mixt_payment_component', 'literal_promptActionConfirm_Accept'), undefined,
          this.getLiteral('mixt_payment_component', 'literal_promptActionConfirm_MessageInfo'),
          ConfirmActionType.Error);
      } else {
        this._confirmActionSvc.promptActionConfirmTelefonoDeuda(
          this.messajeconfirmActionDeuda,
          this.getLiteral('mixt_payment_component', 'literal_promptActionConfirm_Yes'),
          this.getLiteral('mixt_payment_component', 'literal_promptActionConfirm_Not'),
          this.getLiteral('mixt_payment_component', 'literal_promptActionConfirm_Message'),
          ConfirmActionType.Question,
          this._currentDocument)
          .subscribe(response => {
            if (response) {
              // en caso de error TMS mandar a cobros
              try {
                // AGREGAR LA PANTALLA DE INTEGRACION LIGERA CON EL TMS
                this._requestEndSaleCOFO(emitirFactura);
              } catch (error) {
                this._changeDelivered.fnButtonDisable(buttonStatus.OPTIONADITIONALCHARGED);
                this._onMixtPayment.next(false);
              }
            } else {
              // this._changeDelivered.fnButtonDisable(buttonStatus.OPTIONADITIONALCHARGED);
              // this._onMixtPayment.next(false);
            }
          });
      }
    } else {
      this._requestEndSaleCOFO(emitirFactura);
    }
  }

  private _requestEndSaleCOFO(emitirFactura: boolean) {
    this._currentDocument.cambio = this.changeDelivered != undefined ? this.changeDelivered : 0.00;
    // se ha eliminado la parte de factura por que no se genera desde esta funcionalidad

    if (this._requestingSendSale) {
      return;
    }

    if (this._paymentPurpose == PaymentPurpose.NewDocument) {
      this.ComprobarVentaMatricula(this._currentDocument, this.listOfPayments)
        .subscribe(response => {
          if (response) {
            this._requestingSendSale = true;
            this.SolicitudFinalVenta(emitirFactura);
          }
        });
    }
    else {
      this._requestingSendSale = true;
      this.SolicitudFinalVenta(emitirFactura);
    }

  }


  SolicitudFinalVenta(emitirFactura: boolean) {
    this._mixtPaymentService
      .requestEndSale(this._currentDocument, this.listOfPayments, emitirFactura,
        this._paymentPurpose, this.changeDelivered, this.pendiente)
      .first().subscribe(endSaleResult => {
        // this._appDataConfig.paymentMethodList = this.paymentMethodListOriginal;
        this._mixtPaymentService.manageSaleEnded(endSaleResult);
        this._requestingSendSale = false;
        this._onMixtPayment.next(endSaleResult);
      });
  }


  ComprobarVentaMatricula(documento: Document, listaPagos: PaymentDetail[]): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {

      let esCreditoLocal: boolean = false;

      listaPagos.forEach(pago => {
        if (pago.paymentMethodId.substring(5) == PaymentMethodType.localcredit.toString()) {
          esCreditoLocal = true;
        }
      });

      if (esCreditoLocal && this._tpvStatusCheckerService.tipoConectado == true &&
        (documento.customer.matricula == undefined || documento.customer.matricula.trim() == '')) {

        // Comprobamos si la tienda tiene "VentaMatricula".
        this._documentService.ComprobarVentaMatriculaCOFO()
          .first().subscribe(responseVal => {
            if (responseVal != undefined && responseVal == true) {

              this._confirmActionSvc.promptActionConfirmMatriculaCliente(
                this.messajeconfirmMatricula,
                this.getLiteral('mixt_payment_component', 'literal_promptActionConfirm_Yes'),
                this.getLiteral('mixt_payment_component', 'literal_promptActionConfirm_Not'),
                this.getLiteral('mixt_payment_component', 'literal_promptActionConfirm_Message'),
                ConfirmActionType.Question,
                this._currentDocument)
                .subscribe(responseComp => {
                  if (responseComp) {
                    observer.next(true);
                  }
                });

            }
            else {
              observer.next(true);
            }
          });
      }
      else {
        observer.next(true);
      }

    });
  }


  private _setMixtHeight() {
    setTimeout(() => {
      const calcBtnHeight = Number(jQuery('.tpv-mixt-payment .tpv-mixt-input').css('height').replace('px', ''));
      const calcBtnBottomHeight = Number(jQuery('.tpv-mixt-payment .button-bottom').css('height').replace('px', ''));
      const calcTitleHeight = Number(jQuery('.tpv-mixt-payment .auxiliar-action-title').css('height').replace('px', ''));
      const calcHeight = jQuery('.tpv-slide-over').height() -
        (calcBtnHeight + calcTitleHeight + calcBtnBottomHeight +
          jQuery('.tpv-mixt-payment .tpv-mixt-payment-method').height() +
          jQuery('.tpv-mixt-payment .tpv-mixt-payment-amount').height());
      jQuery('.tpv-mixt-payment .divOverflow').css('height', calcHeight);
    }, 500);
  }

  sendTypeCobro() {
    const ncompany = this._appDataConfig.company.id;

    this.listOfPayments.forEach(element => {
      // PONER POR TARJETA ENUM 09--
      if (this.FormatCodePortion(element.method.id, ncompany) == this.formatStringZero(PaymentMethodType.freeSale)) {
        // AGREGAR LA PANTALLA DE INTEGRACION LIGERA CON EL TMS
        this.requestCollectClick();
        // en caso de error TMS mandar a cobros -- momentaneamente se tiene un tiempo de 5 sec para abrir cobros
        /* setTimeout(() => {
           this._changeDelivered.fnButtonDisable(buttonStatus.OPTIONADITIONALCHARGED);
           this._onMixtPayment.next(false);
         }, 5000);*/
        // PONER POR METALICO ENUM 01--
      } else if (this.FormatCodePortion(element.method.id, ncompany) == this.formatStringZero(PaymentMethodType.cash)) {
        this._confirmActionSvc.promptActionConfirm(
          this.messajeconfirmAction,
          this.getLiteral('mixt_payment_component', 'literal_promptActionConfirm_Yes'),
          this.getLiteral('mixt_payment_component', 'literal_promptActionConfirm_Not'),
          this.getLiteral('mixt_payment_component', 'literal_promptActionConfirm_Message'),
          ConfirmActionType.Question)
          .subscribe(response => {
            if (response) {
              // en caso de error TMS mandar a cobros
              try {
                // AGREGAR LA PANTALLA DE INTEGRACION LIGERA CON EL TMS
                this.requestCollectClick();
              } catch (error) {
                this._changeDelivered.fnButtonDisable(buttonStatus.OPTIONADITIONALCHARGED);
                this._onMixtPayment.next(false);
              }
            } else if (!response) {
              this._changeDelivered.fnButtonDisable(buttonStatus.OPTIONADITIONALCHARGED);
              this._onMixtPayment.next(false);
            }
          });
        // PONER POR CREDITO LOCAL ENUM 13 --
      } else if (this.FormatCodePortion(element.method.id, ncompany) == this.formatStringZero(PaymentMethodType.giftCard)) {

      } else {
        this._changeDelivered.fnButtonDisable(buttonStatus.OPTIONADITIONALCHARGED);
        this._onMixtPayment.next(false);
      }
    });
  }

  private FormatCodePortion(entityMultitenantId: string, companyId: string): string {
    let output = entityMultitenantId;
    try {
      if (entityMultitenantId != undefined && entityMultitenantId.length > companyId.length && entityMultitenantId.startsWith(companyId)) {
        output = entityMultitenantId.substring(companyId.length, entityMultitenantId.length);
      }
      return output;
    } catch (e) {
      this._logHelper.trace('Error' + e);
      return output;
    }
  }
  private formatStringZero(value: any): string {
    if (value) {
      if (value.toString().length == 1) {
        return value = '0' + value;
      }
      return value.toString();
    } else {
      return undefined;
    }
  }

  private reordenaMediosPagoDevolucion(payments: PaymentDetail[]) {
    // borramos todo
    this.pendiente = -this._currentDocument.totalAmountWithTax;
    this.listOfPayments = [];
    this.changeDelivered = 0;

    // comprobamos si tiene tarjeta
    let pagoTarjeta =
      payments.find(payment => payment.paymentMethodId === this._appDataConfig.defaultBankCardId);
    /*if (pagoTarjeta === undefined) {
      pagoTarjeta = payments.find(paymentSolred => paymentSolred.paymentMethodId === '0353516');
    }*/

    let contador: number = 16;
    while (pagoTarjeta === undefined && contador < 66) {
      pagoTarjeta = payments.find(payment => payment.paymentMethodId === this._appDataConfig.company.id + contador);
      contador++;
    }

    if (pagoTarjeta !== undefined) {
      // comprobaremos si la tarjeta supera el importe pendiente
      if (pagoTarjeta.primaryCurrencyTakenAmount >= this.pendiente) {
        // agregamos tarjeta por el importe pendiente
        this._insertPayment(this._appDataConfig.paymentMethodList.find(pm => pm.id === pagoTarjeta.paymentMethodId), this.pendiente, this.pendiente);
        this.pendiente = 0;
      }
      else { // agregamos tarjeta por el importe pagado en tarjeta
        this._insertPayment(this._appDataConfig.paymentMethodList.find(pm => pm.id === pagoTarjeta.paymentMethodId),
          pagoTarjeta.primaryCurrencyTakenAmount, pagoTarjeta.primaryCurrencyTakenAmount);
        this.pendiente -= pagoTarjeta.primaryCurrencyTakenAmount;
      }
    }

    // comprobamos si tiene efectivo
    const pagoEfectivo = payments.find(payment => payment.paymentMethodId === this._appDataConfig.company.id + '01');
    if (pagoEfectivo !== undefined && this.pendiente > 0) {
      // comprobaremos si el efectivo supera el importe pendiente
      if (pagoEfectivo.primaryCurrencyTakenAmount >= this.pendiente) {
        // agregamos tarjeta por el importe pendiente
        this._insertPayment(this._appDataConfig.paymentMethodList.find(pm => pm.id === pagoEfectivo.paymentMethodId), this.pendiente, this.pendiente);
        this.pendiente = 0;
      }
      else { // agregamos tarjeta por el importe pagado en tarjeta
        this._insertPayment(this._appDataConfig.paymentMethodList.find(pm => pm.id === pagoEfectivo.paymentMethodId),
          pagoEfectivo.primaryCurrencyTakenAmount, pagoEfectivo.primaryCurrencyTakenAmount);
        this.pendiente -= pagoEfectivo.primaryCurrencyTakenAmount;
      }
    }
    if (this.pendiente > 0) {
      // agregamos los demas en orden (quitando el descuento, tarjeta y efectivo)
      payments.filter(f =>
        f.paymentMethodId !== this._appDataConfig.defaultBankCardId &&
          pagoTarjeta !== undefined ? f.paymentMethodId !== pagoTarjeta.paymentMethodId : true &&
          f.paymentMethodId !== this._appDataConfig.company.id + '01')
        // && f.paymentMethodId !== this._appDataConfig.company.id + '11')
        .forEach(p => {
          if (p.primaryCurrencyTakenAmount >= this.pendiente) {
            this._insertPayment(this._appDataConfig.paymentMethodList.find(pm =>
              pm.id === p.paymentMethodId), this.pendiente, this.pendiente);
            this.pendiente = 0;
          } else {
            this._insertPayment(this._appDataConfig.paymentMethodList.find(pm =>
              pm.id === p.paymentMethodId), p.primaryCurrencyTakenAmount, p.primaryCurrencyTakenAmount);
            this.pendiente -= p.primaryCurrencyTakenAmount;
          }
        });
    }

    if (this.pendiente <= 0) {
      this.pendiente = 0;
      this._changeVisibilityActions(true);
    }
  }

  // * Comprobamos si hay lineas de articulos que han sido anuladas en la venta
  //   y si el total neto de cantidades de artículos de un tipo es positivo.
  // * Si solo hay carburantes en el neto, limpiamos el resto de cosas.
  ComprobarLimpiarLineasArt(documento: Document): boolean {
    let hayArtTienda = false;

    const listaAux: DocumentLine[] = [];
    const listaNeg: DocumentLine[] = [];
    const listaPos: DocumentLine[] = [];

    let banderaElim: boolean = false;

    documento.lines.forEach(linea => {
      if (linea.quantity < 0) {
        listaNeg.push(linea);
      }
      else {
        listaPos.push(linea);
      }
    });

    listaPos.forEach(lineaPos => {

      listaNeg.forEach((lineaNeg, index) => {

        if (banderaElim == false &&
          (lineaPos.appliedPromotionList == undefined || lineaPos.appliedPromotionList.length == 0) &&
          lineaPos.productId == lineaNeg.productId && lineaPos.quantity == -lineaNeg.quantity) {
          banderaElim = true;
          listaNeg.splice(index, 1);
        }

      });

      if (banderaElim == false) {
        listaAux.push(lineaPos);
      }

      banderaElim = false;
    });

    if (listaAux.filter((item) => item.typeArticle.indexOf('TIEN') > 0).length > 0) {
      hayArtTienda = true;
    }
    else {
      documento.lines = listaAux;
    }

    return hayArtTienda;
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
