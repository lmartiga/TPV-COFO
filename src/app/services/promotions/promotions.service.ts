import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { IresponseStatusWithObject } from 'app/shared/iresponse-status-with-object';
import { DocumentLinePromotion } from 'app/shared/document/document-line-promotion';
import { Subscriber } from 'rxjs/Subscriber';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { FormatHelper } from 'app/helpers/format-helper';
import { HttpService } from '../http/http.service';
import { CalculatePromotionsResponse } from 'app/shared/web-api-responses/calculate-promotions-response';
import { CalculatePromotionsResponseStatuses } from 'app/shared/web-api-responses/calculate-promotions-response-statuses.enum';
import { RoundPipe } from 'app/pipes/round.pipe';
import { Document } from 'app/shared/document/document';
import { LogHelper } from 'app/helpers/log-helper';
import { DocumentLine } from 'app/shared/document/document-line';
import { ResponseStatus } from 'app/shared/response-status.enum';
import { PaymentMethodType } from 'app/shared/payments/payment-method-type.enum';

@Injectable()
export class PromotionsService {

  constructor(
    private _appDataConfig: AppDataConfiguration,
    private _http: HttpService,
    private _roundPipe: RoundPipe,
    private _logHelper : LogHelper,
  ) { }

  // solicita al servicio el cálculo de promociones para un determinado documento. Se obtendrá la lista de promociones aplicables al mismo
  calculatePromotions(inputDocument: Document, isAttend: boolean = false): Observable<IresponseStatusWithObject<Array<DocumentLinePromotion>>> {
    // const documentCopy: Document = GenericHelper.deepCopy(inputDocument);
    // documentCopy.lines = documentCopy.lines.filter(x => this.canApplyPromotion(x));
    this._clearPromotions(inputDocument);
    return Observable.create((observer: Subscriber<IresponseStatusWithObject<Array<DocumentLinePromotion>>>) => {
      const request = {
        identity: this._appDataConfig.userConfiguration.Identity,
        document:
          FormatHelper.formatDocumentToCalculatePromotionsServiceExpectedObject(inputDocument, this._appDataConfig.userConfiguration.PosId, isAttend)
      };
      this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/CalculatePromotions`, request)
        .first()
        .subscribe(
          (response: CalculatePromotionsResponse) => {
            if (response.status == CalculatePromotionsResponseStatuses.successful) {
              response.availablePromotions.forEach(promotion => {
                // agrego redondeo a las promociones
                promotion.discountAmountWithTax = this._roundPipe.transformInBaseCurrency(promotion.discountAmountWithTax);
              });
              observer.next({
                status: ResponseStatus.success,
                object: response.availablePromotions
              });
            } else {
              this._logHelper.logError(response.status,
                `La respuesta ha sido negativa: ${CalculatePromotionsResponseStatuses[response.status]}. Mensaje: ${response.message}`);
              observer.next({
                status: ResponseStatus.error,
                object: undefined
              });
            }
          },
          error => {
            this._logHelper.logError(undefined,
              `Se produjo un error al solicitar la ejecución del servicio CalculatePromotions: ${error}`);
            observer.next({
              status: ResponseStatus.error,
              object: undefined
            });
          });
    });
  }

  private _clearPromotions(currentDocument: any) {
    if (currentDocument.paymentDetails != undefined) {
      // tslint:disable-next-line:max-line-length
      currentDocument.paymentDetails = currentDocument.paymentDetails.filter((payment: any) => payment.paymentMethodId.substring(5) != PaymentMethodType.promotion);
    }
    let calculatedTotalAmountWithTax: number = 0;
    if (currentDocument && currentDocument.lines) {
      currentDocument.lines.forEach((line: any) => {
        if (line.appliedPromotionList) {
          line.appliedPromotionList = [];
        }
        if (line.appliedPromotionListHTML) {
          line.appliedPromotionListHTML = [];
        }
        calculatedTotalAmountWithTax += line.totalAmountWithTax;
      });
      currentDocument.totalAmountWithTax = this._roundPipe.transformInBaseCurrency(calculatedTotalAmountWithTax);
    }
  }

  // Calculamos las promociones sin limpiarlas antes
  calculatePromotionsWithoutClear(inputDocument: Document, isAttend: boolean = false):
    Observable<IresponseStatusWithObject<Array<DocumentLinePromotion>>> {
    return Observable.create((observer: Subscriber<IresponseStatusWithObject<Array<DocumentLinePromotion>>>) => {
      const request = {
        identity: this._appDataConfig.userConfiguration.Identity,
        document:
          FormatHelper.formatDocumentToCalculatePromotionsServiceExpectedObject(inputDocument, this._appDataConfig.userConfiguration.PosId, isAttend)
      };
      this._http.postJsonObservable(`${this._appDataConfig.apiUrl}/CalculatePromotions`, request)
        .first()
        .subscribe(
          (response: CalculatePromotionsResponse) => {
            if (response.status == CalculatePromotionsResponseStatuses.successful) {
              response.availablePromotions.forEach(promotion => {
                // agrego redondeo a las promociones
                promotion.discountAmountWithTax = this._roundPipe.transformInBaseCurrency(promotion.discountAmountWithTax);
              });
              observer.next({
                status: ResponseStatus.success,
                object: response.availablePromotions
              });
            } else {
              this._logHelper.logError(response.status,
                `La respuesta ha sido negativa: ${CalculatePromotionsResponseStatuses[response.status]}. Mensaje: ${response.message}`);
              observer.next({
                status: ResponseStatus.error,
                object: undefined
              });
            }
          },
          error => {
            this._logHelper.logError(undefined,
              `Se produjo un error al solicitar la ejecución del servicio CalculatePromotions: ${error}`);
            observer.next({
              status: ResponseStatus.error,
              object: undefined
            });
          });
    });
  }

  canApplyPromotion(line: DocumentLine): boolean {
    // return (line.priceWithTax === line.originalPriceWithTax && line.discountPercentage === 0);
    return (line.priceWithTax === line.originalPriceWithTax && line.discountPercentage < 0.5);
  }

  cleanLocalTarif(inputDocument: Document) {
    inputDocument.lines.forEach(line => {
      if (line.PVPLocal) { // Si la linea es de tarifa local, pon el procio original para enviar el documento correcto al servicio
        line.priceWithTax = line.originalPriceWithTax;
        line.totalAmountWithTax = line.priceWithTax * line.quantity;
      }
    });
  }

  // Nuevas Promociones: Se emplea este método para gestionar las promociones que incluyen a artículos que no reciben descuento.
  // Estas son en la práctica de dos tipos:
  // "N x M"   y  "Xº unidad con % descuento"
  // el método devuelve un array análogo al TimesApplied, pero que solo cuenta los artículos Promocionados Y con descuento
  // NOTA: La promocíon viene con quantity ( NumberOfTimesApplied) igual a 1
  getTimesAppliedWithDiscount(currentDocument: Document, promoLine: DocumentLinePromotion): Array<any> {
    // comprobar que es alguno de estos tipos arriba mencionados
    /* let dtoTotalTeorico = 0;
    for (let i = 0; i < promoLine.timesApplied.length; i++) {
      dtoTotalTeorico += promoLine.timesApplied[i] * promoLine.amountPerUnitInTheInPromo[i];
    }
    // si no lo es, volver
    if (dtoTotalTeorico == promoLine.discountAmountWithTax) {
      return promoLine.timesApplied;
    }
    */
    const timesAppliedWithDiscount = promoLine.timesApplied.map(t => t);
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
    const documentLines = currentDocument.lines;
    while (dtoRealPromo < promoLine.discountAmountWithTax * promoLine.numberOfTimesApplied) {
      // obtener linea que lleva descuento Y con Pvp minimo
      let linesWithDiscount = currentDocument.lines.filter(line =>
        timesAppliedWithDiscount[documentLines.indexOf(line)] < promoLine.timesApplied[documentLines.indexOf(line)]);
      const pvpMin = Math.min.apply(undefined, linesWithDiscount.map(l => l.priceWithTax));
      linesWithDiscount = linesWithDiscount.filter(l => l.priceWithTax === pvpMin);
      const lineaADescontar = documentLines.indexOf(linesWithDiscount[linesWithDiscount.length - 1]);
      timesAppliedWithDiscount[lineaADescontar]++;
      dtoRealPromo += promoLine.amountPerUnitInTheInPromo[lineaADescontar];
    }
    return timesAppliedWithDiscount;
  }

  // devuelve true si la promocion mejora los descuentos de los articulos que incluye
  esPromoMejorQueDescuentos(document: Document, promotion: DocumentLinePromotion): boolean {
    let importeDescuentos = 0;
    for (let lineNumber = 0; lineNumber < document.lines.length; lineNumber++) {
      if (promotion.timesAppliedWithDiscount[lineNumber] > 0  &&  document.lines[lineNumber].discountAmountWithTax != undefined){
        importeDescuentos += document.lines[lineNumber].discountAmountWithTax * promotion.timesAppliedWithDiscount[lineNumber];
      }
    }
    if (promotion.discountAmountWithTax >= importeDescuentos) {
      return true;
    }
    else {
      return false;
    }
  }
}
