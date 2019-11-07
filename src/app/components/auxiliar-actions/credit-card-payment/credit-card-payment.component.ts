import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { Document } from 'app/shared/document/document';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { CreditCardPaymentService } from 'app/services/payments/credit-card-payment.service';
import { SignalRPaymentTerminalService } from 'app/services/signalr/signalr-payment-terminal.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { ConfigurationParameterType } from 'app/shared/configuration-parameter-type.enum';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { Currency } from 'app/shared/currency/currency';
import { CurrencyPriorityType } from 'app/shared/currency/currency-priority-type.enum';
import { PaymentTerminalResponse } from 'app/shared/signalr-server-responses/paymentTerminalHub/payment-terminal-reponse';
import { PaymentTerminalResponseStatuses } from 'app/shared/signalr-server-responses/paymentTerminalHub/payment-terminal-response-statuses.enum';
import { SignalRTMEService } from 'app/services/signalr/signalr-tme.service';
import { endSaleType } from 'app/shared/endSaleType';
import { LanguageService } from 'app/services/language/language.service';
import { LogHelper } from 'app/helpers/log-helper';
import { TMEApplicationInitResponseStatuses } from 'app/shared/hubble-pos-signalr-responses/tme-application-init-response-statuses.enum';

@Component({
  selector: 'tpv-credit-card',
  templateUrl: './credit-card-payment.component.html',
  styleUrls: ['./credit-card-payment.component.scss']
})
export class CreditCardPaymentComponent implements OnInit, OnDestroy, IActionFinalizable<boolean> {
  @HostBinding('class') class = 'tpv-credit-card';

  private _onCreditCardPayment: Subject<boolean> = new Subject();
  private _subscriptions: Subscription[] = [];
  private _stringedTerminalResponse: string = '';
  private _invoice = false;
  private _paymentTerminalResponse: boolean = false;
  /**
   * Indica que se ha lanzado la peticion de sendSale, evita la repeticion de llamadas
   */
  private _requestingSendSale: boolean = false;
  titulo: string;
  subtitulo: string;
  imageURL: string;
  textButton: string;
  currentDocument: Document;
  _totalCreditCard: any;
  baseCurrency: Currency;
  paymentFailedLiteral: string;
  acceptLiteral: string;
  errorHeaderLiteral: string;
  paymentSucceedLiteral: string;
  mainTextComponentLiteral: string;
  requestingPaymentLiteral: string;
  clickOnFinishLiteral: string;
  ventaTipo: endSaleType = endSaleType.creditCard;
  btnFinalizarVisible: boolean = true;

  constructor(
    private _appDataConfig: AppDataConfiguration,
    private _creditCardService: CreditCardPaymentService,
    private _SignalRPaymentTerminalService: SignalRPaymentTerminalService,
    private _confirmActionService: ConfirmActionService,
    private _statusBarService: StatusBarService,
    private _signalRTMEService: SignalRTMEService,
    private _languageService: LanguageService,
    private  _logHelper: LogHelper) {
    this.paymentFailedLiteral = this.getLiteral('credit_card_payment_component', 'paymentFailedLiteral');
    this.acceptLiteral = this.getLiteral('common', 'aceptar');
    this.errorHeaderLiteral = this.getLiteral('common', 'error');
    this.paymentSucceedLiteral = this.getLiteral('credit_card_payment_component', 'paymentSucceedLiteral');
    this.mainTextComponentLiteral = this.getLiteral('credit_card_payment_component', 'literal_CreditCardPayment_FinishUsingTerminal');
    this.requestingPaymentLiteral = this.getLiteral('credit_card_payment_component', 'requestingPaymentLiteral');
    this.clickOnFinishLiteral = this.getLiteral('credit_card_payment_component', 'finishLiteral_CreditCardPayment_button');
    this.titulo = this.getLiteral('credit_card_payment_component', 'header_CreditCardPayment');
    this.subtitulo = this.getLiteral('credit_card_payment_component', 'literal_CreditCardPayment_Pending');
    // TODO conseguir la url de la imagen desde el demonio
    // this.imageURL = 'https://preproduccion.everilion.com/maquetas/tpv-repsol/v6/css/images/img_yomova.png';
    // this.imageURL = 'https://testenv.everilion.com/maquetas/tpv-repsol/v6/css/images/img_yomova.png';
    // this.imageURL = 'https://testenv.everilion.com/maquetas/tpv-repsol/v6/css/images/img_yomova.png';
    this.imageURL = 'assets/images/img_yomova.png';
    this.textButton = this.getLiteral('credit_card_payment_component', 'bottomButton_CreditCardPayment_Finish');
  }

  ngOnInit() {
    this.mainTextComponentLiteral = this.getLiteral('credit_card_payment_component', 'literal_CreditCardPayment_FinishUsingTerminal');
    this.btnFinalizarVisible = !this._signalRTMEService.getStatusConnection();
    // datos de la divisa
    this.baseCurrency = this._appDataConfig.currencyList.find(c => c.priorityType == CurrencyPriorityType.base);
    if (!this.baseCurrency) {
      this._logHelper.trace('DocumentComponent-> WARNING: No se ha podido recuperar la divisa base');
    }

    const isPaymentTerminalAutomaticPaymentEnabled =
      this._appDataConfig.getConfigurationParameterByType(ConfigurationParameterType.IsPaymentTerminalAutomaticPaymentEnabled);
    if (isPaymentTerminalAutomaticPaymentEnabled != undefined && isPaymentTerminalAutomaticPaymentEnabled.meaningfulStringValue == 'true') {
      this._statusBarService.publishMessage(this.requestingPaymentLiteral);
      this._paymentTerminalResponse = false;
      // this._SignalRPaymentTerminalService.salePayment(this.currentDocument.totalAmountWithTax)
      this._SignalRPaymentTerminalService.salePayment(this.currentDocument.paymentDetails.find(
        payment => payment.paymentMethodId === this._appDataConfig.getPaymentMethodByType(2).id).primaryCurrencyGivenAmount)
        .first().subscribe((result: PaymentTerminalResponse) => {
          if (result.status == PaymentTerminalResponseStatuses.successful) {
            this._statusBarService.publishMessage(this.paymentSucceedLiteral + this.clickOnFinishLiteral);
            this._logHelper.trace('Información del cobro realizado: ' + result.stringedTerminalResponse);
            this._stringedTerminalResponse = result.stringedTerminalResponse;
            this.mainTextComponentLiteral = this.paymentSucceedLiteral;
            this._paymentTerminalResponse = true;
          } else {
            this._logHelper.trace('No se pudo realizar la operación de cobro por la siguiente razón: ' + result.message);
            this._confirmActionService.promptActionConfirm(
              this.paymentFailedLiteral,
              this.acceptLiteral,
              undefined,
              this.errorHeaderLiteral,
              ConfirmActionType.Error)
              .first().subscribe(r =>
                this._onCreditCardPayment.next(false)
              );
          }
        }
        );
    } else {
      this._stringedTerminalResponse = '';
      this.mainTextComponentLiteral = this.mainTextComponentLiteral;
      this._paymentTerminalResponse = true;
    }
    this._subscriptions.push(this._creditCardService.onPaymentFinalized()
      .subscribe(success => {
        this._onPaymentFinalized(success);
      }));
    this._creditCardService.onIsCreditCardPayment(true);
  }

  ngOnDestroy() {
    this._creditCardService.onIsCreditCardPayment(false);
    this._subscriptions.forEach(s => s.unsubscribe());
  }
  setInitialData(document: Document, invoice: boolean, ventaTipo: endSaleType) {
    this.currentDocument = document;
    // Comprobamos si tiene promoGlobal para aplicarle el descuento
    let globalPromo = 0;
    if (document.paymentDetails != undefined && document.paymentDetails.length > 1) {
      document.paymentDetails.forEach(pD => {
        if (pD.method.type == 72) { globalPromo = pD.primaryCurrencyTakenAmount; }
      });
    }
    if (this.currentDocument.pendingAmountWithTax === undefined) { this.currentDocument.pendingAmountWithTax = 0; }
    if (ventaTipo === endSaleType.mixtPayment ||
      ventaTipo === endSaleType.deuda_fuga_Efectivo ||
      ventaTipo === endSaleType.deuda_fuga_EfectivoMixto ||
      ventaTipo === endSaleType.deuda_fuga_Tarjeta ||
      ventaTipo === endSaleType.deuda_fuga_TarjetaMixto) {
      if (this.currentDocument.paymentDetails !== undefined &&
        this.currentDocument.paymentDetails.length > 1 &&
        this.currentDocument.paymentDetails.find(
          payment => payment.paymentMethodId === this._appDataConfig.getPaymentMethodByType(2).id) !== undefined) {
        this._totalCreditCard = this.currentDocument.paymentDetails.find(
          payment => payment.paymentMethodId === this._appDataConfig.getPaymentMethodByType(2).id).primaryCurrencyGivenAmount;
      } else if (this.currentDocument.paymentDetails !== undefined &&
        this.currentDocument.paymentDetails.length > 1 &&
        this.currentDocument.paymentDetails.find(
          payment => payment.paymentMethodId === this._appDataConfig.getPaymentMethodByType(1).id) !== undefined
      ) {
        this._totalCreditCard = this.currentDocument.paymentDetails.find(
          payment => payment.paymentMethodId === this._appDataConfig.getPaymentMethodByType(1).id).primaryCurrencyGivenAmount - globalPromo;
      } else if (this.currentDocument.paymentDetails !== undefined &&
        this.currentDocument.paymentDetails.length == 1) {
        this._totalCreditCard = this.currentDocument.paymentDetails[0].primaryCurrencyGivenAmount;
      }
    } else if (ventaTipo === endSaleType.creditCard) {
      if (this.currentDocument.paymentDetails != undefined && this.currentDocument.paymentDetails.length == 1) {
        // tslint:disable-next-line:max-line-length
        this._totalCreditCard = this.currentDocument.totalAmountWithTax - this.currentDocument.pendingAmountWithTax - this.currentDocument.paymentDetails[0].primaryCurrencyTakenAmount;
      } else {
        this._totalCreditCard = this.currentDocument.totalAmountWithTax - this.currentDocument.pendingAmountWithTax;
      }
    }

    // Formatemos el total a 2 decimales siempre
    if (this._totalCreditCard === undefined) {
      this._totalCreditCard = this.currentDocument.totalAmountWithTax;
    }
    this._totalCreditCard = this._totalCreditCard.toFixed(2);
    this._invoice = invoice;
    this.ventaTipo = ventaTipo;
    if (this._signalRTMEService.getStatusConnection()) {
      this.sendSale();
    }
  }
  onFinish(): Observable<boolean> {
    return this._onCreditCardPayment.asObservable();
  }

  forceFinish(): void {
    this._onCreditCardPayment.next(undefined);
  }

  documentHasValue(document: Document): boolean {
    return this.currentDocument != undefined;
  }

  isButtonDisabled(): boolean {
    return this._requestingSendSale
      || !this._paymentTerminalResponse
      || this.currentDocument.totalAmountWithTax == 0;
  }

  // envia venta con tarjeta de credito a servicio
  sendSale() {
    if (this._requestingSendSale) {
      return;
    }
    this._requestingSendSale = true;
    if (!this._signalRTMEService.getStatusConnection()) {
      this.mainTextComponentLiteral = this.getLiteral('status_bar_component', 'syncTMEDatos_message');
      this._logHelper.trace('Conectando TME');
      Promise.resolve(this._signalRTMEService.startInitializationProcess()).then(response => {
        if (response.status === TMEApplicationInitResponseStatuses.successful) {
          this._signalRTMEService.setStatusConnection(true);
          this.mainTextComponentLiteral = '\n' + this.getLiteral('status_bar_component', 'tmeConnectionMessage_ok');
          this.mainTextComponentLiteral += this.getLiteral('credit_card_payment_component', 'literal_CreditCardPayment_FinishUsingTerminal');
          this._logHelper.trace('TME conectado, continue operacion en el TME');
        } else if (response.status === TMEApplicationInitResponseStatuses.genericError) {
          this._signalRTMEService.setStatusConnection(false);
          this._logHelper.trace('TME desconectado, operación desintegrada');
        }
        this._logHelper.trace('SendSale documento:');
        this._logHelper.trace(this.currentDocument);
        if (this.ventaTipo === endSaleType.creditCard) {
          this._creditCardService.sendSale(this.currentDocument, this._invoice, this._stringedTerminalResponse);
        } else if (this.ventaTipo === endSaleType.mixtPayment) {
          this._creditCardService.sendSaleMixto(this.currentDocument, this._invoice, this._stringedTerminalResponse);
        } else if (this.ventaTipo === endSaleType.deuda_fuga_Efectivo ||
          this.ventaTipo === endSaleType.deuda_fuga_EfectivoMixto ||
          this.ventaTipo === endSaleType.deuda_fuga_Tarjeta ||
          this.ventaTipo === endSaleType.deuda_fuga_TarjetaMixto) {
          this._creditCardService.sendSalePending(this.currentDocument, this.ventaTipo);
        }
      });
    } else {
      this._logHelper.trace('SendSale documento:');
      this._logHelper.trace(this.currentDocument);
      if (this.ventaTipo === endSaleType.creditCard) {
        this._creditCardService.sendSale(this.currentDocument, this._invoice, this._stringedTerminalResponse);
      } else if (this.ventaTipo === endSaleType.mixtPayment) {
        this._creditCardService.sendSaleMixto(this.currentDocument, this._invoice, this._stringedTerminalResponse);
      } else if (this.ventaTipo === endSaleType.deuda_fuga_Efectivo ||
        this.ventaTipo === endSaleType.deuda_fuga_EfectivoMixto ||
        this.ventaTipo === endSaleType.deuda_fuga_Tarjeta ||
        this.ventaTipo === endSaleType.deuda_fuga_TarjetaMixto) {
        this._creditCardService.sendSalePending(this.currentDocument, this.ventaTipo);
      }
    }
  }

  showButtonFinalizar() {
    return this.btnFinalizarVisible;
  }

  private _onPaymentFinalized(success: boolean) {
    this._paymentTerminalResponse = false;
    this._requestingSendSale = false;
    this._creditCardService.managePaymentFinalized(success);
    this._onCreditCardPayment.next(success);
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

}
