import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { DocumentSeriesService } from 'app/services/document/document-series.service';
import { DocumentService } from 'app/services/document/document.service';
import { Document } from 'app/shared/document/document';
import { FinalizingDocumentFlowType } from 'app/shared/document/finalizing-document-flow-type.enum';
import { PaymentDetail } from 'app/shared/payments/payment-detail';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { PaymentPurpose } from '../../shared/payments/PaymentPurpose.enum';
import { Subscriber } from '../../../../node_modules/rxjs/Subscriber';
import { CustomerInternalService } from '../customer/customer-internal.service';
import { LogHelper } from '../../helpers/log-helper';
import { AppDataConfiguration } from '../../config/app-data.config';
import { ConfirmActionService } from '../confirm-action/confirm-action.service';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
// import { SignalRPrintingService } from 'app/services/signalr/signalr-printing.service';
import { GenericHelper } from 'app/helpers/generic-helper';
import { PaymentMethodType } from 'app/shared/payments/payment-method-type.enum';
import { PrintResponseStatuses } from 'app/shared/signalr-server-responses/printingModuleHub/print-response-statuses.enum';
import { PrintResponse } from 'app/shared/signalr-server-responses/printingModuleHub/print-response';
import { SignalRTMEService } from '../signalr/signalr-tme.service';
import { endSaleType } from 'app/shared/endSaleType';
import { CreditCardPaymentComponent } from 'app/components/auxiliar-actions/credit-card-payment/credit-card-payment.component';
import { SlideOverService } from '../slide-over/slide-over.service';
import { LanguageService } from 'app/services/language/language.service';
import { OperatorInternalService } from '../operator/operator-internal.service';
import { DocumentGroup } from 'app/src/custom/models/DocumentGroup';
import { PrintingService } from '../printing/printing.service';


@Injectable()
export class MixtPaymentService {

  private messajeconfirmAction = this.getLiteral('change_delivered_component', 'literal_messageconfirmAction');

  constructor(
    private _serieService: DocumentSeriesService,
    private _documentService: DocumentService,
    private _statusBarService: StatusBarService,
    private _customerInternalSvc: CustomerInternalService,
    private _appDataConfig: AppDataConfiguration,
    // private _signalRPrintingServ: SignalRPrintingService,
    private _printingService: PrintingService,
    private confirmActionSvc: ConfirmActionService,
    private _signalRTMEService: SignalRTMEService,
    private _slideOver: SlideOverService,
    private _languageService: LanguageService,
    private _operadorInternalService: OperatorInternalService,
    private _logHelper: LogHelper,

  ) {
  }

  requestEndSaleMulti(document: DocumentGroup, paymentDetailList: Array<PaymentDetail>,
    emitirFactura: boolean, paymentPurpose: PaymentPurpose,
    changeDelivered: number, pendintAmount: number): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      if (document == undefined || document.cliente == undefined) {
        this._logHelper.logError(undefined, 'El documento o el cliente es undefined');
        observer.next(false);
      }

      if (paymentDetailList == undefined) {
        paymentDetailList = [];
      }

      if (pendintAmount > 0) {
        const isUnknownCustomer = this._customerInternalSvc.isUnknownCustomer(document.cliente.id);
        const allowPendingPayment = this._appDataConfig.allowPendingPayment;
        if (isUnknownCustomer || !allowPendingPayment) {
          this.confirmActionSvc.promptActionConfirm(
            this._languageService.getLiteral('mixt_payment_service', 'requestEndEsale_pendingAmountNotAllowed'),
            this._languageService.getLiteral('common', 'aceptar'), undefined,
            this._languageService.getLiteral('common', 'error'),
            ConfirmActionType.Error);
          observer.next(false);
          return;
        }
      }

      document.pendingAmountWithTax = pendintAmount;
      let sendSubscription: Observable<boolean>;
      switch (paymentPurpose) {
        case PaymentPurpose.PendingPayment:
          sendSubscription = this.sendPaymentDetailMulti(document, paymentDetailList);
          break;
        default:
      }
      sendSubscription.first().subscribe(sendResult => {
        observer.next(sendResult);
      });
    });
  }

  private sendPaymentDetailMulti(document: DocumentGroup, paymentDetailList: Array<PaymentDetail>): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      /**POR UN LADO NECESITAMOS SUSCRIBIRNOS AL TME
       * Y POR OTRO LADO NECESITAMOS SABER SI VA O NO EL PAGO PENDIENTE AL TME
       * BENJA
       */

      let pendienteOriginal: number = 0;
      pendienteOriginal = document.totalAmountWithTax;

      document.paymentDetailList = JSON.parse(JSON.stringify(paymentDetailList));

      // Metodo para metodos de pago y id documento.
      const documentPayment: DocumentGroup = this.GetDocumentPayment(document, paymentDetailList);

      // documentPayment.documentIdList.forEach(doc => {
      //   this._documentService.sendPaymentDetailMassive(this._appDataConfig.company.id + doc.id, doc.paymentDetailList)
      //     .first().subscribe(responsePaymentDetail => {
      //       observer.next(responsePaymentDetail);
      //     });
      // });

      this._documentService.sendPaymentDetailMassive(documentPayment.documentIdList)
        .first().subscribe(responsePaymentDetail => {
          observer.next(responsePaymentDetail);
        });

      this._printingService.printDocumentDeudasMasiva(documentPayment, 'COBRO_DEUDAS_MASIVA', paymentDetailList)
        .first().subscribe((printResponse: PrintResponse) => {
          if (printResponse.status == PrintResponseStatuses.successful) {
            // Si la respuesta de ambas solicitudes es positiva, reportamos ok al llamante
            this._documentService.DocumentPagoPendiente = undefined;
            observer.next(true);
          } else {
            this._logHelper.trace(
              `La respuesta ha sido positiva, pero la impresión falló: ` +
              `${PrintResponseStatuses[printResponse.status]}. Mensaje: ${printResponse.message}`);
            observer.next(false);
          }
        });
    });
  }

  GetDocumentPayment(document: DocumentGroup, paymentDetailList: Array<PaymentDetail>): DocumentGroup {
    let indexDelete: number[] = [];
    document.documentIdList.forEach(x => {
      let pending = x.pendingAmountWithTax;
      document.pendingAmountWithTax += x.pendingAmountWithTax;
      // Eliminamos los detalles ya repartidos.
      indexDelete.forEach(w => {
        paymentDetailList.splice(w, 1);
      });
      indexDelete = [];
      paymentDetailList.forEach((y, index) => {
        if (pending > 0) {
          if (y.primaryCurrencyGivenAmount > pending) {
            const details = JSON.parse(JSON.stringify(y));
            details.primaryCurrencyGivenAmount = pending;
            details.primaryCurrencyTakenAmount = pending;
            x.paymentDetailList.push(details);
            y.primaryCurrencyGivenAmount = y.primaryCurrencyGivenAmount - pending;
            y.primaryCurrencyTakenAmount = y.primaryCurrencyTakenAmount - pending;
            pending = 0;
          } else if (y.primaryCurrencyGivenAmount === pending) {
            x.paymentDetailList.push(y);
            indexDelete.push(index);
            pending = 0;
          } else {
            x.paymentDetailList.push(y);
            indexDelete.push(index);
            pending = pending - y.primaryCurrencyGivenAmount;
          }
        }
      });
    });

    return document;
  }

  requestEndSale(document: Document, paymentDetailList: Array<PaymentDetail>,
    emitirFactura: boolean, paymentPurpose: PaymentPurpose,
    changeDelivered: number, pendintAmount: number): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      if (document == undefined || document.customer == undefined) {
        this._logHelper.logError(undefined, 'El documento o el cliente es undefined');
        observer.next(false);
      }

      if (paymentDetailList == undefined) {
        paymentDetailList = [];
      }

      if (pendintAmount > 0) {
        const isUnknownCustomer = this._customerInternalSvc.isUnknownCustomer(document.customer.id);
        const allowPendingPayment = this._appDataConfig.allowPendingPayment;
        if (isUnknownCustomer || !allowPendingPayment) {
          this.confirmActionSvc.promptActionConfirm(
            this._languageService.getLiteral('mixt_payment_service', 'requestEndEsale_pendingAmountNotAllowed'),
            this._languageService.getLiteral('common', 'aceptar'), undefined,
            this._languageService.getLiteral('common', 'error'),
            ConfirmActionType.Error);
          observer.next(false);
          return;
        }
      }
      document.customer.matricula = document.customer.matricula === undefined
        || document.customer.matricula === '' ? document.plate : document.customer.matricula;
      document.plate = document.customer.matricula != undefined ? document.customer.matricula : '';

      document.pendingAmountWithTax = pendintAmount;
      let sendSubscription: Observable<boolean>;
      switch (paymentPurpose) {
        case PaymentPurpose.NewDocument:
          sendSubscription = this.sendSale(document, paymentDetailList, emitirFactura, changeDelivered);
          break;
        case PaymentPurpose.PendingPayment:
          // Traemos el TPV y el operador para la impresion del ticket.
          document.posId = this._appDataConfig.userConfiguration.PosId;
          document.operator = this._operadorInternalService.currentOperator;
          sendSubscription = this.sendPaymentDetail(document, paymentDetailList);
          break;
        case PaymentPurpose.Refund:
          sendSubscription = this.sendPaymentRefund(document, paymentDetailList);
          break;
        default:
      }
      sendSubscription.first().subscribe(sendResult => {
        observer.next(sendResult);
      });
    });
  }

  manageSaleEnded(success: boolean) {
    this._statusBarService.publishMessage(success ?
      this._languageService.getLiteral('mixt_payment_service', 'message_StatusBar_SaleFinishedSuccessfully') :
      this._languageService.getLiteral('mixt_payment_service', 'error_StatusBar_SaleCouldNotBeFinished'));
    this._logHelper.trace('Realizar venta mixta');
  }

  distinctPayments(paymentList: PaymentDetail[]): PaymentDetail[] {

    const paymentFinal: PaymentDetail[] = [];
    paymentList.forEach(pay => {
      const index = paymentFinal.findIndex(it => it.paymentMethodId == pay.paymentMethodId && it.currencyId == pay.currencyId);
      if ((index >= 0)) {
        paymentFinal[index].primaryCurrencyTakenAmount += pay.primaryCurrencyTakenAmount;
        paymentFinal[index].primaryCurrencyGivenAmount += pay.primaryCurrencyGivenAmount;
        paymentFinal[index].primaryCurrencyTakenAmount = +paymentFinal[index].primaryCurrencyTakenAmount.toFixed(2);
        paymentFinal[index].primaryCurrencyGivenAmount = +paymentFinal[index].primaryCurrencyGivenAmount.toFixed(2);
      } else {
        paymentFinal.unshift(pay);
      }
    });
    return paymentFinal;
  }

  private sendSale(document: Document, paymentDetailList: Array<PaymentDetail>,
    emitirFactura: boolean, changeDelivered: number): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      if (document == undefined) {
        observer.next(false);
        return;
      }
      // unifico en un observable tanto si hay que pedir cliente o sino, para no repetir codigo
      Observable.create((innerOperations: Subscriber<boolean>) => {
        // agrego detalles de pago proporcionados
        document.paymentDetails = this.distinctPayments(paymentDetailList);
        if (document.paymentDetails[0].paymentMethodId.substring(5) == PaymentMethodType.localcredit.toString()) {
          document.paymentDetails[0].extraData = { 'Remarks': 'CREDITO_LOCAL' };
        }
        document.changeDelivered = changeDelivered;
        if (emitirFactura) {
          // si ya tiene cliente
          if (document.customer != undefined
            && !this._customerInternalSvc.isUnknownCustomer(document.customer.id)) {
            document.series = this._serieService.getSeriesByFlow(
              FinalizingDocumentFlowType.EmittingBill,
              document.totalAmountWithTax);
            innerOperations.next(true);
            return;
          }
          // solicitamos cliente
          this._customerInternalSvc.requestCustomerForInvoice()
            .first().subscribe(customerResult => {
              if (customerResult == undefined || customerResult.customer == undefined) {
                innerOperations.next(false);
                return;
              }
              if (this._customerInternalSvc.isUnknownCustomer(customerResult.customer.id)) {
                this.confirmActionSvc.promptActionConfirm(
                  this._languageService.getLiteral('mixt_payment_service', 'sendSale_cantInvoiceToUnknownCustomer'),
                  this._languageService.getLiteral('common', 'aceptar'), undefined,
                  this._languageService.getLiteral('common', 'error'),
                  ConfirmActionType.Error);
                innerOperations.next(false);
                return;
              }
              document.plate = customerResult.plate;
              document.customer = customerResult.customer;
              // generar serie si es modo nuevo ticket
              document.series = this._serieService.getSeriesByFlow(
                FinalizingDocumentFlowType.EmittingBill,
                document.totalAmountWithTax);

              innerOperations.next(true);
            });
        } else {
          document.series = this._serieService.getSeriesByFlow(
            FinalizingDocumentFlowType.EmittingTicket,
            document.totalAmountWithTax);
          innerOperations.next(true);
        }
      }).first().subscribe((operations: boolean) => {
        if (!operations) {
          observer.next(false);
          return;
        }

        if (GenericHelper._hasPaymentId(document.paymentDetails, this._appDataConfig.company.id + '10') ||
        document.paymentDetails[0].paymentMethodId === this._appDataConfig.company.id + PaymentMethodType.otherBanks) {
          // Mixto con Tarjeta
          observer.next(true);
        } else if (GenericHelper._hasPaymentId(document.paymentDetails, this._appDataConfig.company.id + '01')) {
          // Mixto efectivo Efectivo
          observer.next(true);
        } else {
          // Mixto
          observer.next(true);
        }
      });
    });
  }

  private sendPaymentDetail(document: Document, paymentDetailList: Array<PaymentDetail>): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      /**POR UN LADO NECESITAMOS SUSCRIBIRNOS AL TME
       * Y POR OTRO LADO NECESITAMOS SABER SI VA O NO EL PAGO PENDIENTE AL TME
       * BENJA
       */

      let respuestaTME: Observable<boolean>;
      let isDeudaParcialTME: boolean = false;
      let pendienteOriginal: number = 0;
      document.paymentDetails.forEach(p => pendienteOriginal += p.primaryCurrencyTakenAmount);
      pendienteOriginal = document.totalAmountWithTax - pendienteOriginal;

      if (this._signalRTMEService.getStatusConnection()) {
        /* Comprobamos si:
        1. Es fuga
        2. Es deuda completa
        3. Es deuda parcial */

        // 3.
        if (!document.isRunAway && pendienteOriginal !== document.totalAmountWithTax &&
          (GenericHelper._hasPaymentId(document.paymentDetails, this._appDataConfig.getPaymentMethodByType(1).id) ||
            GenericHelper._hasPaymentId(document.paymentDetails, this._appDataConfig.getPaymentMethodByType(2).id))) {
          isDeudaParcialTME = true;
        }

        // 1. y 2. y 3.
        if (document.isRunAway || pendienteOriginal == document.totalAmountWithTax || isDeudaParcialTME) {
          // cambiamos los medios de pago por los introducidos en pago mixto
          document.paymentDetails = paymentDetailList;

          if (GenericHelper._hasPaymentId(paymentDetailList, this._appDataConfig.getPaymentMethodByType(2).id)) {
            // Numero de paymentDetails
            if (document.paymentDetails.length == 1) {
              // Tarjeta
              respuestaTME = this.requestTMEPaymentPendingSale(document, false, endSaleType.deuda_fuga_Tarjeta);
            } else {
              // Mixto con Tarjeta
              respuestaTME = this.requestTMEPaymentPendingSale(document, false, endSaleType.deuda_fuga_TarjetaMixto);
            }

            // suscrición TME
            respuestaTME
              .first().subscribe(response => {
                setTimeout(() => {
                  this._statusBarService.resetProgress();
                }, 3000);
                if (response) {
                  paymentDetailList = document.paymentDetails;
                  this._documentService.sendPaymentDetail(document.documentId, paymentDetailList)
                    .first().subscribe(responsePaymentDetail => {
                      observer.next(responsePaymentDetail);
                    });

                  this._printingService.printDocument(document, 'COBRO_FUGA_DEUDA', undefined, undefined, false)
                    .first().subscribe((printResponse: PrintResponse) => {
                      if (printResponse.status == PrintResponseStatuses.successful) {
                        // Si la respuesta de ambas solicitudes es positiva, reportamos ok al llamante
                        this._documentService.DocumentPagoPendiente = undefined;
                        observer.next(true);
                      } else {
                        this._logHelper.trace(
                          `La respuesta ha sido positiva, pero la impresión falló: ` +
                          `${PrintResponseStatuses[printResponse.status]}. Mensaje: ${printResponse.message}`);
                        observer.next(false);
                      }
                    });
                } else {
                  observer.next(response);
                }
              });
          } else if (GenericHelper._hasPaymentId(paymentDetailList, this._appDataConfig.getPaymentMethodByType(1).id)) {
            // preguntaremos si quiere fidelizar o no
            this.confirmActionSvc.promptActionConfirmStatic(
              this.messajeconfirmAction,
              this._languageService.getLiteral('confirm_action_component', 'literal_ConfirmAction_Yes'),
              this._languageService.getLiteral('confirm_action_component', 'literal_ConfirmAction_No'),
              this._languageService.getLiteral('confirm_action_component', 'literal_ConfirmAction_Title'),
              ConfirmActionType.Question)
              .subscribe(respondeFidelización => {
                if (respondeFidelización === undefined) { }
                else if (respondeFidelización) { // si quiere fidelizar
                  // Mixto con Tarjeta o Mixto con efectivo fidelizado
                  respuestaTME = this.requestTMEPaymentPendingSale(document, false, endSaleType.deuda_fuga_TarjetaMixto);
                } else { // no quiere fidelizar
                  // RESPUESTA FIDELIZACIÓN NO
                  if (document.paymentDetails.length == 1) {
                    // Efectivo
                    respuestaTME = this.requestTMEPaymentPendingSale(document, false, endSaleType.deuda_fuga_Efectivo);
                  } else {
                    // Mixto Efectivo
                    respuestaTME = this.requestTMEPaymentPendingSale(document, false, endSaleType.deuda_fuga_EfectivoMixto);
                  }
                }
                // suscrición TME
                respuestaTME
                  .first().subscribe(response => {
                    setTimeout(() => {
                      this._statusBarService.resetProgress();
                    }, 3000);
                    if (response) {
                      paymentDetailList = document.paymentDetails;
                      this._documentService.sendPaymentDetail(document.documentId, paymentDetailList)
                        .first().subscribe(responsePaymentDetail => {
                          observer.next(responsePaymentDetail);
                        });

                      this._printingService.printDocument(document, 'COBRO_FUGA_DEUDA', undefined, undefined, false)
                        .first().subscribe((printResponse: PrintResponse) => {
                          if (printResponse.status == PrintResponseStatuses.successful) {
                            // Si la respuesta de ambas solicitudes es positiva, reportamos ok al llamante
                            this._documentService.DocumentPagoPendiente = undefined;
                            observer.next(true);
                          } else {
                            this._logHelper.trace(
                              `La respuesta ha sido positiva, pero la impresión falló: ` +
                              `${PrintResponseStatuses[printResponse.status]}. Mensaje: ${printResponse.message}`);
                            observer.next(false);
                          }
                        });
                    } else {
                      observer.next(response);
                    }
                  });
              });
          } else { // los medios de pago no tiene tarjeta ni efectivo
            this._documentService.sendPaymentDetail(document.documentId, paymentDetailList)
              .first().subscribe(response => {
                observer.next(response);
              });

            document.paymentDetails = paymentDetailList;

            this._printingService.printDocument(document, 'COBRO_FUGA_DEUDA', undefined, undefined, false)
              .first().subscribe((printResponse: PrintResponse) => {
                if (printResponse.status == PrintResponseStatuses.successful) {
                  // Si la respuesta de ambas solicitudes es positiva, reportamos ok al llamante
                  this._documentService.DocumentPagoPendiente = undefined;
                  observer.next(true);
                } else {
                  this._logHelper.trace(
                    `La respuesta ha sido positiva, pero la impresión falló: ` +
                    `${PrintResponseStatuses[printResponse.status]}. Mensaje: ${printResponse.message}`);
                  observer.next(false);
                }
              });
          }
        } else { // es deuda parcial que ya fué al TME
          respuestaTME = Observable.create((observerSinTME: Subscriber<boolean>) => {
            observerSinTME.next(true);
          });
          document.paymentDetails = paymentDetailList;

          // suscrición TME
          respuestaTME
            .first().subscribe(response => {
              setTimeout(() => {
                this._statusBarService.resetProgress();
              }, 3000);
              if (response) {
                paymentDetailList = document.paymentDetails;
                this._documentService.sendPaymentDetail(document.documentId, paymentDetailList)
                  .first().subscribe(responsePaymentDetail => {
                    observer.next(responsePaymentDetail);
                  });

                this._printingService.printDocument(document, 'COBRO_FUGA_DEUDA', undefined, undefined, false)
                  .first().subscribe((printResponse: PrintResponse) => {
                    if (printResponse.status == PrintResponseStatuses.successful) {
                      // Si la respuesta de ambas solicitudes es positiva, reportamos ok al llamante
                      this._documentService.DocumentPagoPendiente = undefined;
                      observer.next(true);
                    } else {
                      this._logHelper.trace(
                        `La respuesta ha sido positiva, pero la impresión falló: ` +
                        `${PrintResponseStatuses[printResponse.status]}. Mensaje: ${printResponse.message}`);
                      observer.next(false);
                    }
                  });
              } else {
                observer.next(response);
              }
            });
        }
      } else { // no existe conexión con el TME
        respuestaTME = Observable.create((observerSinTME: Subscriber<boolean>) => {
          observerSinTME.next(true);
        });

        document.paymentDetails = paymentDetailList;

        // suscrición TME
        respuestaTME
          .first().subscribe(response => {
            setTimeout(() => {
              this._statusBarService.resetProgress();
            }, 3000);
            if (response) {
              paymentDetailList = document.paymentDetails;
              this._documentService.sendPaymentDetail(document.documentId, paymentDetailList)
                .first().subscribe(responsePaymentDetail => {
                  observer.next(responsePaymentDetail);
                });

              this._printingService.printDocument(document, 'COBRO_FUGA_DEUDA', undefined, undefined, false)
                .first().subscribe((printResponse: PrintResponse) => {
                  if (printResponse.status == PrintResponseStatuses.successful) {
                    // Si la respuesta de ambas solicitudes es positiva, reportamos ok al llamante
                    this._documentService.DocumentPagoPendiente = undefined;
                    observer.next(true);
                  } else {
                    this._logHelper.trace(
                      `La respuesta ha sido positiva, pero la impresión falló: ` +
                      `${PrintResponseStatuses[printResponse.status]}. Mensaje: ${printResponse.message}`);
                    observer.next(false);
                  }
                });
            } else {
              observer.next(response);
            }
          });
      }
    });
  }

  private requestTMEPaymentPendingSale(currentDocument: Document, invoice: boolean, ventaTipo: endSaleType): Observable<boolean> {
    this._logHelper.trace('AuxiliarActionsManagerService-> Se solicita pago pendiente por tarjeta');
    const componentRef = this._slideOver.openFromComponent(CreditCardPaymentComponent);
    componentRef.instance.setInitialData(currentDocument, invoice, ventaTipo);
    return componentRef.instance.onFinish();
  }

  private sendPaymentRefund(document: Document, paymentDetailList: Array<PaymentDetail>): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      document.paymentDetails = paymentDetailList;
      document.paymentDetails.forEach(paymentDetail => {
        if (paymentDetail.primaryCurrencyGivenAmount > 0) {
          paymentDetail.primaryCurrencyGivenAmount = -paymentDetail.primaryCurrencyGivenAmount;
        }
        if (paymentDetail.primaryCurrencyTakenAmount > 0) {
          paymentDetail.primaryCurrencyTakenAmount = -paymentDetail.primaryCurrencyTakenAmount;
        }
        if (paymentDetail.secondaryCurrencyGivenAmount > 0) {
          paymentDetail.secondaryCurrencyGivenAmount = -paymentDetail.secondaryCurrencyGivenAmount;
        }
        if (paymentDetail.secondaryCurrencyTakenAmount > 0) {
          paymentDetail.secondaryCurrencyTakenAmount = -paymentDetail.secondaryCurrencyTakenAmount;
        }
      });
      // CRÉDITO LOCAL
      if (document.paymentDetails[0].paymentMethodId.substring(5) == PaymentMethodType.localcredit.toString()) {
        document.paymentDetails[0].extraData = { 'Remarks': 'CREDITO_LOCAL' };
      }
      this._documentService.sendPaymentRefundDocuments([document])
        .first().subscribe(response => {
          setTimeout(() => {
            this._statusBarService.resetProgress();
          }, 3000);
          observer.next(response);
        });
    });

  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
