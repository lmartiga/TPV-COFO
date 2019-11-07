import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { FormatHelper } from 'app/helpers/format-helper';
import { LogHelper } from 'app/helpers/log-helper';
import { Document } from 'app/shared/document/document';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { DocumentSeriesService } from 'app/services/document/document-series.service';
import { DocumentService } from 'app/services/document/document.service';
import { Currency } from 'app/shared/currency/currency';
import { CurrencyPriorityType } from 'app/shared/currency/currency-priority-type.enum';
import { FinalizingDocumentFlowType } from 'app/shared/document/finalizing-document-flow-type.enum';
import { PaymentMethodType } from 'app/shared/payments/payment-method-type.enum';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { ChangePaymentInternalService } from 'app/services/payments/change-payment-internal.service';
import { endSaleType } from 'app/shared/endSaleType';
import { LanguageService } from 'app/services/language/language.service';

@Injectable()
export class CreditCardPaymentService {

  private _paymentFinalized: Subject<boolean> = new Subject();
  _isCreditCardPayment: Subject<boolean> = new Subject();
  $isCreditCardPayment: Observable<boolean> = this._isCreditCardPayment.asObservable();

  constructor(
    private _appDataConfig: AppDataConfiguration,
    private _seriesService: DocumentSeriesService,
    private _documentService: DocumentService,
    private _statusBarService: StatusBarService,
    private _ChangePaymentInternalService: ChangePaymentInternalService,
    private _languageService: LanguageService,
    private _logHelper : LogHelper,
  ) {
  }

  // solo tarjeta
  sendSale(document: Document, emitBill: boolean, terminalPrintingText: string = '') {
    if (document == undefined) {
      this._paymentFinalized.next(false);
      return;
    }
    const bankcardPM = this._appDataConfig.getPaymentMethodByType(PaymentMethodType.bankcard);
    const baseCurrency: Currency = this._appDataConfig.currencyList.find(c => c.priorityType == CurrencyPriorityType.base);
    if (baseCurrency == undefined) {
      this._logHelper.logError(undefined, 'No se ha podido recuperar la divisa base de configuración');
      this._paymentFinalized.next(false);

      return;
    }

    document.pendingAmountWithTax = document.pendingAmountWithTax != undefined ? document.pendingAmountWithTax : 0;
    document.plate = document.customer.matricula;

    if (document.paymentDetails != undefined) {
      let globalPromo = 0;
      document.paymentDetails.forEach(pD => {
        if (pD.method.type = 72) {
          globalPromo += pD.primaryCurrencyTakenAmount;
        }
      });
      document.paymentDetails.push({
        paymentMethodId: bankcardPM.id,
        paymentDateTime: FormatHelper.formatToUTCDateFromLocalDate(new Date()),
        changeFactorFromBase: 1,
        currencyId: baseCurrency.id,
        primaryCurrencyGivenAmount: document.totalAmountWithTax - document.pendingAmountWithTax,
        // tslint:disable-next-line:max-line-length
        primaryCurrencyTakenAmount: document.totalAmountWithTax - document.pendingAmountWithTax - globalPromo,
        // extraData: { ['AuthorizationText']: '' != undefined ? '' : '' },
      });
    } else {
      document.paymentDetails = [{
        paymentMethodId: bankcardPM.id,
        paymentDateTime: FormatHelper.formatToUTCDateFromLocalDate(new Date()),
        changeFactorFromBase: 1,
        currencyId: baseCurrency.id,
        primaryCurrencyGivenAmount: document.totalAmountWithTax - document.pendingAmountWithTax,
        primaryCurrencyTakenAmount: document.totalAmountWithTax - document.pendingAmountWithTax,
        extraData: { ['AuthorizationText']: terminalPrintingText != undefined ? terminalPrintingText : '' },
      }];
    }

    document.series = this._seriesService.getSeriesByFlow(
      emitBill ? FinalizingDocumentFlowType.EmittingBill : FinalizingDocumentFlowType.EmittingTicket,
      document.totalAmountWithTax);

    if (emitBill) {
      this._documentService.sendInvoiceDocuments(new Array<Document>(document))
        .first().subscribe(response => {
          setTimeout(() => {
            this._statusBarService.resetProgress();
          }, 3000);
          this._paymentFinalized.next(response);
          this._ChangePaymentInternalService.fnEnabledTicketandFacturar(response);
        });
    } else {
      this._documentService.sendSaleDocumentsTarjeta(new Array<Document>(document))
        .first().subscribe(response => {
          setTimeout(() => {
            this._statusBarService.resetProgress();
          }, 3000);
          this._paymentFinalized.next(response);
          this._ChangePaymentInternalService.fnEnabledTicketandFacturar(response);
        });
    }
  }

  // mixto cuando hay tarjeta
  // mixto cuando efectivo y fideliza
  // efectivo y SI quiere fidelizar/factura
  sendSaleMixto(document: Document, emitBill: boolean, terminalPrintingText: string = '') {
    if (document == undefined) {
      this._paymentFinalized.next(false);
      return;
    }

    if (document.pendingAmountWithTax != undefined &&
      document.pendingAmountWithTax != 0 && document.totalAmountWithTax != document.pendingAmountWithTax) {
      document.isDeuda = true;
    }

    document.series = this._seriesService.getSeriesByFlow(
      emitBill ? FinalizingDocumentFlowType.EmittingBill : FinalizingDocumentFlowType.EmittingTicket,
      document.totalAmountWithTax);

    if (emitBill) {
      this._documentService.sendInvoiceDocuments(new Array<Document>(document))
        .first().subscribe(response => {
          this._paymentFinalized.next(response);
          this._ChangePaymentInternalService.fnEnabledTicketandFacturar(response);
        });
    } else {
      this._documentService.sendSaleDocumentsMixto(new Array<Document>(document))
        .first().subscribe(response => {
          this._paymentFinalized.next(response);
          this._ChangePaymentInternalService.fnEnabledTicketandFacturar(response);
        });
    }
  }

  sendSalePending(document: Document, ventaTipo: endSaleType) {
    if (ventaTipo === endSaleType.deuda_fuga_Efectivo) {
      this._documentService.sendSaleDocumentPendingSorteoEfectivo([document])
        .first().subscribe(response => {
          this._paymentFinalized.next(response);
          // this._ChangePaymentInternalService.fnEnabledTicketandFacturar(response);
        });
    } else if (ventaTipo === endSaleType.deuda_fuga_EfectivoMixto) {
      this._documentService.sendSaleDocumentPendingMixtoEfectivo([document])
        .first().subscribe(response => {
          this._paymentFinalized.next(response);
          // this._ChangePaymentInternalService.fnEnabledTicketandFacturar(response);
        });
    } else if (ventaTipo === endSaleType.deuda_fuga_Tarjeta) {
      this._documentService.sendSaleDocumentPendingTarjeta([document]).first().subscribe(response => {
        this._paymentFinalized.next(response);
        // this._ChangePaymentInternalService.fnEnabledTicketandFacturar(response);
      });
    } else if (ventaTipo === endSaleType.deuda_fuga_TarjetaMixto) {
      this._documentService.sendSaleDocumentPendingMixto([document]).first().subscribe(response => {
        this._paymentFinalized.next(response);
        // this._ChangePaymentInternalService.fnEnabledTicketandFacturar(response);
      });
    }
  }

  managePaymentFinalized(success: boolean) {
    this._logHelper.trace('REALIZAR VENTA CREDIT CARD:');
    this._logHelper.trace(success);
    if (success) {
      this._statusBarService.publishMessage(this._languageService.getLiteral('credit_card_payment_component', 'SalessuccessfullyLiteral'));
    }
  }
  onPaymentFinalized(): Observable<boolean> {
    return this._paymentFinalized.asObservable();
  }

  onIsCreditCardPayment(val: boolean) {
    this._isCreditCardPayment.next(val);
  }
}
