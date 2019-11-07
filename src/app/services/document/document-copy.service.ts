import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { LogHelper } from 'app/helpers/log-helper';
// import { SignalRPrintingService } from 'app/services/signalr/signalr-printing.service';
import { Document } from 'app/shared/document/document';
import { PrintResponse } from 'app/shared/signalr-server-responses/printingModuleHub/print-response';
import { PrintResponseStatuses } from 'app/shared/signalr-server-responses/printingModuleHub/print-response-statuses.enum';
import { DocumentService } from 'app/services/document/document.service';
import { PaymentMethodType } from 'app/shared/payments/payment-method-type.enum';
import { IDictionaryStringKey } from 'app/shared/idictionary';
import { RoundPipe } from 'app/pipes/round.pipe';
import { PaymentDetail } from 'app/shared/payments/payment-detail';
import { PrintingService } from '../printing/printing.service';



@Injectable()
export class DocumentCopyService {

  constructor(
    // private _printService: SignalRPrintingService,
    private _printService: PrintingService,
    private _documentService: DocumentService,
    private _roundPipe: RoundPipe,
    private _logHelper: LogHelper,
  ) {
  }


  copySaleDocument(document: Document): Observable<boolean> {

    this.ComprobarFugaDeudaLimpiar(document);

    let aux = 'SALE_COFO';

    const isCredito = document.paymentDetails.filter(x =>
      x.paymentMethodId.substring(5) === PaymentMethodType.localcredit.toString()).length > 0;

      if (document.totalAmountWithTax < 0 ) {
        const _lineSupply = document.lines.filter(x => x.quantity < 0 && x.businessSpecificLineInfo != undefined);
        if (_lineSupply.length > 0) {
          for (const lineS of _lineSupply) {
            if (lineS.businessSpecificLineInfo.supplyTransaction != undefined ||
               (lineS.typeArticle != undefined  && lineS.typeArticle.includes('COMBU'))) {
              aux = 'REFUNDFUEL';

              document.paymentDetails[0].primaryCurrencyTakenAmount = -document.paymentDetails[0].primaryCurrencyTakenAmount;              
              if (lineS.businessSpecificLineInfo.supplyTransaction != undefined) {
                const money: number = document.lines[0].businessSpecificLineInfo.supplyTransaction.money;
                const fuellingLimitValue: number = document.lines[0].businessSpecificLineInfo.supplyTransaction.fuellingLimitValue;
                document.lines[0].businessSpecificLineInfo.supplyTransaction.fuellingLimitValue = money - fuellingLimitValue;
              }
              break;
            }
          }
        }
      } else {
        if (isCredito && (document.Nfactura == undefined  || document.Nfactura == '')) {
          aux = 'SALE_CREDITO_COFO';
        } else { /*FUGA*/
          // Se obtiene el Id del Medio de Pago tipo Fuga
          let idMedioFuga: string = '';
          this._roundPipe.appConfiguration.paymentMethodList.forEach(medio => {
            if (medio.description == 'FUGA') {
              idMedioFuga = medio.id;
            }
          });
          // Comprobamos si existe un medio de pago tipo Fuga
          if (document.paymentDetails.filter(x => x.paymentMethodId == idMedioFuga).length > 0) {
            document.isRunAway = true;
            aux = 'SALE_FUGADEUDA_COFO';
          } else { /*DEUDA*/
            let Amount = 0;
            let totalAmountTicket = 0;
            let totalDiscountTicket = 0;
            document.lines.forEach(line =>{
              totalAmountTicket += line.totalAmountWithTax
              line.appliedPromotionList.forEach(a => totalDiscountTicket += a.discountAmountWithTax);
            });
            totalAmountTicket -= totalDiscountTicket;
            document.paymentDetails.forEach(a => Amount += Math.round(a.primaryCurrencyTakenAmount * 100) / 100);
            if (aux != 'REFUNDFUEL' && totalAmountTicket > Amount) {
              document.isDeuda = true;
              if (document.pendingAmountWithTax == 0) {
                let totalPagado: number = 0;

                document.paymentDetails.forEach(pago => {
                  totalPagado += pago.primaryCurrencyTakenAmount;
                });

                document.pendingAmountWithTax = document.totalAmountWithTax - totalPagado;
              }
              // tslint:disable-next-line:no-unused-expression
              /* UsecasePrintingConfiguration: usecase */
              aux = 'SALE_FUGADEUDA_COFO';
            }
          }
        }
      }

    return this._copyDocument(document, aux);
  }

  private ComprobarFugaDeudaLimpiar(documento: Document) {
    let esFugaCobrada: Boolean = false;
    let esFuga: Boolean = false;
    let esDeuda: Boolean = false;
    let idMedioFuga: string = '';
    let listaAux: PaymentDetail[] = [];

    this._roundPipe.appConfiguration.paymentMethodList.forEach(medio => {
      if (medio.description == 'FUGA') {
        idMedioFuga = medio.id;
      }
    });

    documento.paymentDetails.forEach(pago => {
      if(!esFugaCobrada){
        if (pago.paymentMethodId == idMedioFuga) {
          if(documento.paymentDetails.length == 1 )
          {
            listaAux = [];
            listaAux.push(pago);
            esFuga = true;
            esDeuda = false;
          }else
          {
            esFugaCobrada = true;
          }
        } else {
          if (pago.paymentDateTime != undefined &&
            documento.emissionLocalDateTime.toLocaleString() != pago.paymentDateTime.toLocaleString()) {
            esDeuda = true;
          }
          else {
            listaAux.push(pago);
          }
        }
      }else{
        listaAux.push(pago);
      }
    });

    if (esFugaCobrada)
    {
      documento.cambio = 0;
      documento.paymentDetails = listaAux;
    }
    if (esFuga) {
      documento.cambio = 0;
      documento.isRunAway = true;
      documento.paymentDetails = listaAux;
    }

    if (esDeuda) {
      documento.cambio = 0;
      documento.isDeuda = true;
      documento.paymentDetails = listaAux;
    }
  }

  private _copyDocument(document: Document, useCase: string): Observable<boolean> {
    let dic1: IDictionaryStringKey<number>;
    let dic2: IDictionaryStringKey<number>;
    dic1 = document.totalTaxList;
    this._documentService.completCopyDocument(document);
    dic2 = document.totalTaxList;
    this.recalculateTaxList(dic1, dic2);
    document.totalTaxList = dic2;

    return Observable.create((observer: Subscriber<boolean>) => {

      let numeroCopias: number;

      if (document.isDeuda != undefined && document.isDeuda) {
        numeroCopias = 2;
      }

      this._printService.printDocument(document, useCase, numeroCopias, undefined, false)
      .first().subscribe((printResponse: PrintResponse) => {
        if (printResponse.status == PrintResponseStatuses.successful) {
          // Si la respuesta de ambas solicitudes es positiva, reportamos ok al llamante
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

  private recalculateTaxList(dic1: IDictionaryStringKey<number>, dic2: IDictionaryStringKey<number>) {
    for (const key in dic2) {
      if (dic2.hasOwnProperty(key)) {
        dic2[key] = dic1[key + '.0000'];
      }
    }
  }
}
