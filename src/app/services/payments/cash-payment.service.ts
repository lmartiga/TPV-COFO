import { Injectable } from '@angular/core';

import { AppDataConfiguration } from 'app/config/app-data.config';
import { PaymentMethodType } from 'app/shared/payments/payment-method-type.enum';
import { FormatHelper } from 'app/helpers/format-helper';
import { Document } from 'app/shared/document/document';
import { DocumentService } from 'app/services/document/document.service';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { DocumentSeriesService } from 'app/services/document/document-series.service';
import { FinalizingDocumentFlowType } from '../../shared/document/finalizing-document-flow-type.enum';
import { Subscriber } from 'rxjs/Subscriber';
import { ChangePaymentInternalService } from 'app/services/payments/change-payment-internal.service';
import { GenericHelper } from 'app/helpers/generic-helper';
import { FuellingPointsInternalService } from '../fuelling-points/fuelling-points-internal.service';
import { SignalRMultiTPVService } from '../signalr/signalr-multitpv.service';
// import { PaymentDetail } from 'app/shared/payments/payment-detail';

@Injectable()
export class CashPaymentService {

  private _paymentFinalized: Subject<boolean> = new Subject();

  constructor(
    private _appDataConfig: AppDataConfiguration,
    private _documentService: DocumentService,
    private _statusBarService: StatusBarService,
    private _seriesService: DocumentSeriesService,
    private _ChangePaymentInternalService: ChangePaymentInternalService,
    private _fpInternalService: FuellingPointsInternalService,
    private _signalrMultitpv: SignalRMultiTPVService
  ) { }

  // solo efectivo cuando NO fideliza
  sendSale(document: Document, invoice: boolean, documentPrint: boolean = true, isanulado = false, isMixto: boolean = false) {

    if (document != undefined) {
      const cashPM = this._appDataConfig.getPaymentMethodByType(PaymentMethodType.cash);
      const CardPM = this._appDataConfig.getPaymentMethodByType(PaymentMethodType.bankcard);

      if (document.paymentDetails !== undefined) {
        document.paymentDetails.forEach(X => {
          if (X.method !== undefined) {
            if (X.method.id === CardPM.id) {
              isMixto = true;
              return;
            }
          }
        });
      }

      document.pendingAmountWithTax = document.pendingAmountWithTax != undefined ? document.pendingAmountWithTax : 0;
      document.plate = document.customer.matricula;
      document.paymentDetails = [{
        paymentMethodId: cashPM.id,
        paymentDateTime: FormatHelper.formatToUTCDateFromLocalDate(new Date()),
        currencyId: this._appDataConfig.baseCurrency.id,
        changeFactorFromBase: 1,
        primaryCurrencyGivenAmount: document.totalAmountWithTax - document.pendingAmountWithTax,
        primaryCurrencyTakenAmount: document.totalAmountWithTax - document.pendingAmountWithTax
      }];

      if (document.pendingAmountWithTax != undefined &&
        document.pendingAmountWithTax != 0 && document.totalAmountWithTax != document.pendingAmountWithTax) {
        document.isDeuda = true;
      }
      // Insertamos la serie
      // todo: importe maximo para efectivo sin identificar cliente
      document.series =
        this._seriesService.getSeriesByFlow(
          invoice ?
            FinalizingDocumentFlowType.EmittingBill :
            FinalizingDocumentFlowType.EmittingTicket,
          document.totalAmountWithTax);

      // const sendSaleFunc = invoice ?
      //  this._documentService.sendInvoiceDocuments([document])
      // : this._documentService.sendSaleDocuments([document], documentPrint);
      let sendSaleFunc: Observable<boolean>;
      if (invoice) {
        sendSaleFunc = this._documentService.sendInvoiceDocuments([document]);
      } else if (document.totalAmountWithTax == 0) {
        sendSaleFunc = this._documentService.sendSaleDocumentsSorteoEfectivo([document], false);
      } else if (document.totalAmountWithTax === document.pendingAmountWithTax) {
        sendSaleFunc = this._documentService.sendSaleDocuments([document], false);
      } else {
        sendSaleFunc = this._documentService.sendSaleDocumentsSorteoEfectivo([document], true);
      }
      sendSaleFunc
        .first().subscribe(response => {
          setTimeout(() => {
            this._statusBarService.resetProgress();
          }, 3000);
          if (!isanulado) {
            this._paymentFinalized.next(response);
            if (!isMixto) {
              this._ChangePaymentInternalService.fnEnabledTicketandFacturar(response);
            }
          }
          // Se borra transacciones de BD cuando la venta se realizo correctamente
          this.deleteTransactionsVirtuals(document);
        });
    } else {
      if (!isanulado) {
        this._paymentFinalized.next(false);
      }
    }
  }

  sendSaleTicket(document: Document, invoice: boolean, documentPrint: boolean = true) {
    if (document != undefined) {
      // const cashPM = this._appDataConfig.getPaymentMethodByType(PaymentMethodType.cash);
      /* document.paymentDetails = [{
        paymentMethodId: cashPM.id,
        paymentDateTime: FormatHelper.formatToUTCDateFromLocalDate(new Date()),
        currencyId: this._appDataConfig.baseCurrency.id,
        changeFactorFromBase: 1,
        primaryCurrencyGivenAmount: document.totalAmountWithTax - document.pendingAmountWithTax,
        primaryCurrencyTakenAmount: document.totalAmountWithTax - document.pendingAmountWithTax,
      }];*/
      /*document.lines.forEach(linea => {
        let descuento: number;
        descuento = 0;
        if (linea.isConsigna == false && linea.appliedPromotionList != undefined) {
          linea.appliedPromotionList.filter(x => x.discountAmountWithTax != undefined).forEach(l => {
            descuento += l.discountAmountWithTax;
        });
        document.totalAmountWithTax += descuento;
      }
    });*/

      // Insertamos la serie
      // todo: importe maximo para efectivo sin identificar cliente
      document.series =
        this._seriesService.getSeriesByFlow(
          invoice ?
            FinalizingDocumentFlowType.EmittingBill :
            FinalizingDocumentFlowType.EmittingTicket,
          document.totalAmountWithTax);

      // const sendSaleFunc = invoice ?
      //  this._documentService.sendInvoiceDocuments([document])
      // : this._documentService.sendSaleDocuments([document], documentPrint);
      let sendSaleFunc: Observable<boolean>;
      if (document.totalAmountWithTax == 0) {
        sendSaleFunc = this._documentService.sendSaleDocuments([document], false);
      } else {
        sendSaleFunc = this._documentService.sendSaleDocuments([document], documentPrint);
      }
      sendSaleFunc
        .first().subscribe(response => {
          setTimeout(() => {
            this._statusBarService.resetProgress();
          }, 3000);
          this._paymentFinalized.next(response);
          this._ChangePaymentInternalService.fnEnabledTicketandFacturar(response);
        });
    } else {
      this._paymentFinalized.next(false);
    }
  }

  // mixto cuando hay efectivo y NO fideliza
  sendSaleMixto(document: Document, emitBill: boolean, documentPrint: boolean = true) {
    if (document == undefined) {
      this._paymentFinalized.next(false);
      return;
    }

    // Comprobamos si tiene promoGlobal para aplicarle el descuento
    let hasGlobalPromo: boolean = false;
    let sendSaleFunc: Observable<boolean>;
    document.paymentDetails.forEach(pD => {
      if (pD.method.type = 72) { hasGlobalPromo = true; }
    });
    if (hasGlobalPromo) {
      const cashPM = this._appDataConfig.getPaymentMethodByType(PaymentMethodType.cash);
      document.paymentDetails.unshift({
        paymentMethodId: cashPM.id,
        paymentDateTime: FormatHelper.formatToUTCDateFromLocalDate(new Date()),
        currencyId: this._appDataConfig.baseCurrency.id,
        changeFactorFromBase: 1,
        primaryCurrencyGivenAmount: document.totalAmountWithTax - document.pendingAmountWithTax,
        // tslint:disable-next-line:max-line-length
        primaryCurrencyTakenAmount: document.totalAmountWithTax - document.pendingAmountWithTax - document.paymentDetails[0].primaryCurrencyTakenAmount,
        method: cashPM
      });
    }

    if (document.pendingAmountWithTax != undefined &&
      document.pendingAmountWithTax != 0 && document.totalAmountWithTax != document.pendingAmountWithTax) {
      document.isDeuda = true;
    }

    document.series = this._seriesService.getSeriesByFlow(
      emitBill ? FinalizingDocumentFlowType.EmittingBill : FinalizingDocumentFlowType.EmittingTicket,
      document.totalAmountWithTax);

    if (emitBill) {
      sendSaleFunc = this._documentService.sendInvoiceDocuments(new Array<Document>(document));
    } else {
      if (GenericHelper._hasPaymentId(
        document.paymentDetails,
        this._appDataConfig.getPaymentMethodByType(1).id)) {
        sendSaleFunc = this._documentService.sendSaleDocumentsMixtoEfectivo(new Array<Document>(document));
        // mixto y no hay efectivo
      } else {
        sendSaleFunc = this._documentService.sendDocumentsNoPrintDocumentList(new Array<Document>(document));
      }
    }
    sendSaleFunc
        .first().subscribe(response => {
          this._paymentFinalized.next(response);
          this._ChangePaymentInternalService.fnEnabledTicketandFacturar(response);
          // Se borra transacciones de BD cuando la venta se realizo correctamente
          this.deleteTransactionsVirtuals(document);
        });
  }

  sendSaleAutomatic(document: Document): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      if (document != undefined) {
        if (document.pendingAmountWithTax != undefined &&
          document.pendingAmountWithTax != 0 && document.totalAmountWithTax != document.pendingAmountWithTax) {
          document.isDeuda = true;
        }
        const cashPM = this._appDataConfig.getPaymentMethodByType(PaymentMethodType.cash);
        document.paymentDetails = [{
          paymentMethodId: cashPM.id,
          paymentDateTime: FormatHelper.formatToUTCDateFromLocalDate(new Date()),
          currencyId: this._appDataConfig.baseCurrency.id,
          changeFactorFromBase: 1,
          primaryCurrencyGivenAmount: document.totalAmountWithTax,
          primaryCurrencyTakenAmount: document.totalAmountWithTax
        }];
        // Insertamos la serie
        // todo: importe maximo para efectivo sin identificar cliente
        document.series =
          this._seriesService.getSeriesByFlow(
            FinalizingDocumentFlowType.EmittingTicket,
            document.totalAmountWithTax);
        // const sendSaleFunc = this._documentService.sendSaleDocumentsSorteoEfectivo([document]);
        const sendSaleFunc = this._documentService.sendPrintAutomatic([document]);
        sendSaleFunc.first().subscribe(response => {
          setTimeout(() => {
            this._statusBarService.resetProgress();
            return observer.next(true);
          }, 3000);
        });
      } else {
        return observer.next(false);
        // this._paymentFinalized.next(false);
      }
    });
  }

  onPaymentFinalized(): Observable<boolean> {
    return this._paymentFinalized.asObservable();
  }

  managePaymentFinalized(success: boolean) {

  }
  deleteTransactionsVirtuals(document: Document) {
    if (document) {
      document.lines.forEach( li => {
        if (li.businessSpecificLineInfo) {
          if (li.businessSpecificLineInfo.supplyTransaction) {
            if (li.businessSpecificLineInfo.supplyTransaction.isVirtual) {
              const idTransaction = li.businessSpecificLineInfo.supplyTransaction.id;
              const idSurtidor = li.businessSpecificLineInfo.supplyTransaction.fuellingPointId;
              const req = { fuellingPointId: idSurtidor,
                idTransaction,
                type: 'delete'
                };
              this._signalrMultitpv.requestNotifyGenericChangesRed('changeTransactionVirtual', JSON.stringify(req))
              .subscribe( respuesta => {
                if (!respuesta) {
                  this._documentService.removeDocumentVirtualById(idTransaction).subscribe(resp => {
                    if (resp) {
                      this._fpInternalService.updateSuplyTransactionsVirtual(idSurtidor);
                    }
                  });
                }
              });
            }
          }
        }
      });
    }
  }

}
