import { CashboxRecordReason } from 'app/shared/cashbox/cashbox-record-Reason';
import { CashboxRecordType } from 'app/shared/cashbox/cashbox-record-type.enum';
import { Company } from 'app/shared/company';
import { Currency } from 'app/shared/currency/currency';
import { Customer } from 'app/shared/customer/customer';
import { Document } from 'app/shared/document/document';
import { DocumentLine } from 'app/shared/document/document-line';
import { Operator } from 'app/shared/operator/operator';
import { PaymentDetail } from 'app/shared/payments/payment-detail';
import { PaymentMethod } from 'app/shared/payments/payment-method';
import { SearchCriteriaRelationshipType } from 'app/shared/search-criteria-relationship-type.enum';
import { SearchOperatorCriteriaFieldType } from 'app/shared/operator/search-operator-criteria-field-type.enum';
import { SearchOperatorCriteriaMatchingType } from 'app/shared/operator/search-operator-criteria-matching-type.enum';
import { SearchCustomerCriteriaFieldType } from 'app/shared/customer/search-customer-criteria-field-type.enum';
import { SearchCustomerCriteriaMatchingType } from 'app/shared/customer/search-customer-criteria-matching-type.enum';
import { SearchPluProductCriteriaFieldType } from 'app/shared/plu/search-plu-product-criteria-field-type.enum';
import { SearchPluProductCriteriaMatchingType } from 'app/shared/plu/search-plu-product-criteria-matching-type.enum';
import { Shop } from 'app/shared/shop';
import { UsageType } from '../shared/document-search/usage-type.enum';
import { SearchDocumentMode } from 'app/shared/document-search/search-document-mode.enum';
import { CashboxRecordData } from 'app/shared/cashbox/cashbox-record-data';
import { FuellingPointTestData } from 'app/shared/fuelling-point/fuelling-point-test-data';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';
import { CreatePaymentUsageType } from 'app/shared/payments/create-payment-usage-type.enum';
import { DocumentLinePromotion } from 'app/shared/document/document-line-promotion';
import { Address } from 'app/shared/address/address';
import { LoyaltyActionType } from 'app/shared/loyalty/loyalty-action-type.enum';
import { UsecasePrintingConfiguration } from 'app/shared/printing/usecase-printing-configuration';
import { IDictionaryStringKey } from 'app/shared/idictionary';
import { RoundPipe } from 'app/pipes/round.pipe';
import { GetDocumentResponseStatuses } from 'app/shared/web-api-responses/get-document-response-statuses.enum';
import { SearchDocumentResponseStatuses } from 'app/shared/web-api-responses/search-document-response-statuses.enum';
import { FuellingLimitType } from 'app/shared/fuelling-point/fuelling-limit-type.enum';
import { DocumentGroup } from 'app/src/custom/models/DocumentGroup';
import { InformeVentasRecaudacion } from 'app/shared/document/InformeVentasRecaudacion';
import { InformeVentasResumen } from 'app/shared/document/InformeVentasResumen';
import { InformeVentasCategorias } from 'app/shared/document/InformeVentasCategorias';
import { InformeVentasCategoriasPrint } from 'app/shared/document/InformeVentasCategoriasPrint';
import { InformeVentasCategoriasPrintFin } from 'app/shared/document/InformeVentasCategoriasPrintFin';

import { InformeVentasRecaudacionPrint } from 'app/shared/document/InformeVentasRecaudacionPrint';
import { CarburanteContingencia } from 'app/src/custom/models/CarburanteContingencia';
import { DatePipe } from '@angular/common';
import { DocumentLineTax } from 'app/shared/document/document-line-tax';
import { LogHelper } from './log-helper';

// import { filter } from 'rxjs/operator/filter';
// import * as moment from 'moment';


// import { PaymentMethodType } from '../shared/payments/payment-method-type.enum';


export class FormatHelper {

  SubTotal: number;
  SubTotalConsigna: number;
  SubTotalDeudas: number;
  SubTotalInformeRecaudacion: number = 0;
  static _logHelper: LogHelper;
  /**
   *
   */
  constructor(
    private _logHelperProvider: LogHelper
  ) {
    FormatHelper._logHelper = this._logHelperProvider;
  }

  public static SearchDocumentModeToUsageType(searchMode: SearchDocumentMode): UsageType {
    switch (searchMode) {
      case SearchDocumentMode.Cancel: return UsageType.Rectify;
      case SearchDocumentMode.Copy: return UsageType.PrintCopy;
      case SearchDocumentMode.Pending:
      case SearchDocumentMode.Runaway: return UsageType.PayPending;
      case SearchDocumentMode.PendingMassive: return UsageType.PayPendingMassive; // llamará a nuestro componente de pagos mixtos masivos
      default: return UsageType.Other;
    }
  }
  // DOCUMENTO
  /////////////////////

  // parsea una lista de documentos para su envío al servicio
  public static formatDocumentListToServiceExpectedObject(documentList: Array<Document>, posId: string): Array<any> {
    const documentListData: Array<any> = [];
    documentList.forEach((document, index) => {
      // const _documentlines = document.lines.filter(x => x.quantity > 0 != false && x.isRemoved != false);
      // document.lines = _documentlines.concat(document.lines.filter(x => x.quantity < 0 && x.isRemoved != true));
      // RAMOS document.lines = _documentlines.concat(document.lines.filter(x => x.isRemoved == false));

      documentListData.push(
        {
          provisionalId: FormatHelper.formatNumber(document.provisionalId),
          plate: document.plate,
          referencedDocumentIdList: document.referencedDocumentIdList,
          serieId: document.series.id,
          emissionLocalDateTime: FormatHelper.dateToISOString(document.emissionLocalDateTime),
          emissionUTCDateTime: FormatHelper.dateToISOString(
            FormatHelper.formatToUTCDateFromLocalDate(document.emissionLocalDateTime)
          ),
          taxableAmount: FormatHelper.formatNumber(document.taxableAmount),
          totalTaxList: document.totalTaxList,
          taxableAmountList: document.taxableAmountList,
          totalAmountWithTax: FormatHelper.formatNumber(document.totalAmountWithTax),
          discountAmountWithTax: FormatHelper.formatNumber(document.discountAmountWithTax),
          paymentDetailList: FormatHelper.formatPaymentDetailToServiceExpectedObject(document.paymentDetails),
          changeDelivered: FormatHelper.formatNumber(document.changeDelivered),
          lineList: FormatHelper.formatDocumentLinesToServiceExpectedObject(document.lines),
          operatorId: document.operator != undefined ? document.operator.id : 0,
          customerId: document.customer != undefined ? document.customer.id : 0,
          extraData: document.extraData,
          currencyId: document.currencyId,
          posId: posId,
          contactId: document.contactId,
          kilometers: FormatHelper.formatNumber(document.kilometers),
          isatend: document.isatend
        }
      );
    });
    return documentListData;
  }

  // parsea un documento para su envío al servicio
  public static formatDocumentToServiceExpectedObject(document: Document, posId: string): any {
    if (document.isRunAway == undefined || document.isRunAway == false) {
      try {
        return {
          Id: document.documentId,
          operatorName: document.operator.name,
          ContactId: document.contactId !== undefined ? document.contactId : '',
          provisionalId: FormatHelper.formatNumber(document.provisionalId),
          plate: document.plate,
          referencedDocumentIdList: document.referencedDocumentIdList,
          seriesId: document.series.id,
          seriesType: document.series.type,
          emissionLocalDateTime: FormatHelper.dateToISOString(document.emissionLocalDateTime),
          emissionUTCDateTime: FormatHelper.dateToISOString(document.emissionLocalDateTime),
          taxableAmount: FormatHelper.formatNumber(document.taxableAmount),
          totalTaxList: document.totalTaxList, // TODO: Aplicar un map con transformación a Number
          taxableAmountList: document.taxableAmountList,
          totalAmountWithTax: FormatHelper.formatNumber(document.totalAmountWithTax),
          paymentDetailList: FormatHelper.formatPaymentDetailToServiceExpectedObject(document.paymentDetails),
          changeDelivered: FormatHelper.formatNumber(document.cambio), // document.changeDelivered
          lineList: FormatHelper.formatDocumentLinesToServiceExpectedObject(document.lines),
          operatorId: document.operator.id,
          customer: FormatHelper.formatCustomerToServiceExpectedObject(document.customer),
          extraData: document.extraData,
          currencyId: document.currencyId,
          posId: posId,
          contactId: document.customer.cardInformation != undefined ? document.customer.cardInformation.contactId : undefined,
          kilometers: document.kilometers !== undefined ? FormatHelper.formatNumber(document.kilometers) : 0
        };
      } catch (e) {
       //  this._logHelper.logError(e);
        // const errorMessage = `ERROR. No ha sido posible transformar el documento de entrada. [ENTRADA: ${JSON.stringify(document)} | ERROR: ${e}`;
        // this._logHelper.trace(errorMessage);
      }
    } else {
      try {
        return {
          Id: document.documentId,
          operatorName: document.operator.name,
          ContactId: document.contactId,
          provisionalId: FormatHelper.formatNumber(document.provisionalId),
          plate: document.plate,
          referencedDocumentIdList: document.referencedDocumentIdList,
          seriesId: document.series.id,
          seriesType: document.series.type,
          emissionLocalDateTime: FormatHelper.dateToISOString(document.emissionLocalDateTime),
          emissionUTCDateTime: FormatHelper.dateToISOString(document.emissionLocalDateTime),
          taxableAmount: FormatHelper.formatNumber(document.taxableAmount),
          totalTaxList: document.totalTaxList, // TODO: Aplicar un map con transformación a Number
          taxableAmountList: document.taxableAmountList,
          totalAmountWithTax: FormatHelper.formatNumber(document.totalAmountWithTax),
          paymentDetailList: FormatHelper.formatPaymentDetailToServiceExpectedObject(document.paymentDetails),
          changeDelivered: FormatHelper.formatNumber(document.cambio), // changeDelivered
          lineList: FormatHelper.formatDocumentLinesToServiceExpectedObject(document.lines),
          operatorId: document.operator.id,
          customer: FormatHelper.formatCustomerToServiceExpectedObject(
            {
              id: document.customer.id,
              businessName: document.customer.businessName,
              customerMessage: undefined,
              tin: document.customer.tin,
              tinTypeId: undefined,
              addressList: [
                {
                  city:
                  {
                    name: undefined,
                    provinceName: undefined,
                    postalCode: ''
                  }, country: {
                    id: undefined,
                    name: ''
                  }, street: ' ca',
                  type: 1
                }],
              isDischarged: document.customer.isDischarged,
              cardInformation: {
                balance: undefined,
                balanceCurrencyId: undefined,
                contactId: undefined,
                documentTypeId: undefined,
                drivenDistance: undefined,
                driverName: undefined,
                isFleet: false,
                plate: undefined
              },
              customerType: undefined,
              phoneNumber: document.customer.phoneNumber,
              riesgo1: 0,
              riesgo2: 0
            }
          ),
          // FormatHelper.formatCustomerToServiceExpectedObject(document.customer),
          extraData: document.extraData,
          currencyId: document.currencyId,
          posId: posId,
          contactId: document.customer.cardInformation != undefined ? document.customer.cardInformation.contactId : undefined,
          kilometers: FormatHelper.formatNumber(document.kilometers)
        };
      } catch (e) {
        // this._logHelper.logError(e);
      }
    }
  }

  public static formatDocumentToCalculatePromotionsServiceExpectedObject(document: Document, posId: string, isAttend: boolean = false): any {
    const _documentlines = document.lines;
    return {
      provisionalId: FormatHelper.formatNumber(document.provisionalId),
      referencedDocumentIdList: document.referencedDocumentIdList,
      serieId: undefined, // document.series.id,
      seriesType: undefined,  // document.series.type,
      emissionLocalDateTime: isAttend == false ? FormatHelper.dateToISOString(document.emissionLocalDateTime) : undefined,
      emissionUTCDateTime: isAttend == false ? FormatHelper.dateToISOString(document.emissionLocalDateTime) : undefined,
      taxableAmount: FormatHelper.formatNumber(document.taxableAmount),
      totalTaxList: document.totalTaxList, // TODO: Aplicar un map con transformación a Number
      taxableAmountList: document.taxableAmountList,
      totalAmountWithTax: FormatHelper.formatNumber(document.totalAmountWithTax),
      paymentDetailList: FormatHelper.formatPaymentDetailToServiceExpectedObject(document.paymentDetails, isAttend),
      changeDelivered: FormatHelper.formatNumber(document.changeDelivered),
      lineList: FormatHelper.formatDocumentLinesToCalculatePromotionsServiceExpectedObject(_documentlines).filter((
        x: { quantity: number; isRemoved: boolean; }) => x.isRemoved != false),
      operatorId: document.operator.id,
      customer: FormatHelper.formatCustomerToServiceExpectedObject(document.customer),
      extraData: document.extraData,
      currencyId: document.currencyId,
      posId: posId,
      contactId: document.customer.cardInformation != undefined ? document.customer.cardInformation.contactId : undefined,
      kilometers: FormatHelper.formatNumber(document.kilometers)
    };
  }

  public static formatDocumentLinesToCalculatePromotionsServiceExpectedObject(documentLines: DocumentLine[]): any {
    if (documentLines == undefined) {
      return {};
    }

    const output: DocumentLine[] = [];

    documentLines.forEach(l => {
      if (l.isLoyaltyRedemption == undefined || l.isLoyaltyRedemption === false) {
        output.push({
          businessSpecificLineInfo: l.businessSpecificLineInfo,
          description: l.description,
          discountAmountWithoutTax: l.discountAmountWithoutTax,
          discountAmountWithTax: l.discountAmountWithTax,
          discountPercentage: l.discountPercentage,
          isLoyaltyRedemption: l.isLoyaltyRedemption,
          priceWithoutTax: l.priceWithoutTax,
          priceWithTax: l.priceWithTax,
          originalPriceWithTax: l.priceWithTax,
          productId: l.productId,
          quantity: l.quantity,
          totalAmountWithTax: l.totalAmountWithTax,
          taxPercentage: l.taxPercentage,
          taxAmount: l.taxAmount,
          appliedPromotionList: FormatHelper.formatDocumentLinePromotionsToServiceExpectedObject(l.appliedPromotionList),
          idCategoria: '',
          nameCategoria: '',
          isRemoved: l.isRemoved
        });
      }
    });

    return output.map((documentLine, index) => {
      return {
        lineNumber: index + 1,
        productId: documentLine.productId,
        quantity: FormatHelper.formatNumber(documentLine.quantity),
        unitaryPriceWithTax: FormatHelper.formatNumber(documentLine.priceWithTax),
        discountPercentage: FormatHelper.formatNumber(documentLine.discountPercentage),
        discountAmountWithTax: FormatHelper.formatNumber(documentLine.discountAmountWithTax),
        taxPercentage: FormatHelper.formatNumber(documentLine.taxPercentage),
        taxAmount: FormatHelper.formatNumber(documentLine.taxAmount),
        productName: documentLine.description,
        totalAmountWithTax: FormatHelper.formatNumber(documentLine.totalAmountWithTax),
        priceWithoutTax: FormatHelper.formatNumber(documentLine.priceWithoutTax),
        appliedPromotionList: FormatHelper.formatDocumentLinePromotionsToServiceExpectedObject(documentLine.appliedPromotionList),
        isRemoved: documentLine.isRemoved,
      };
    });
  }

  // parsea el documento para su envío al servicio
  public static formatDocumentToPrintingModuleHubExpectedObject(
    document: Document,
    identity: string,
    availablePaymentMethods: Array<PaymentMethod>,
    availableCurrencies: Array<Currency>,
    baseCurrency: Currency,
    company: Company,
    shop: Shop,
    tpv: string,
    ticketsMode: any)
    : any {
    /*if (document.cambio == undefined && document.pendingAmountWithTax != undefined) {
      if ( document.pendingAmountWithTax < 0) {
        document.cambio = -(document.pendingAmountWithTax);
      } else {
        document.cambio = document.pendingAmountWithTax;
      }
    }*/

    // SE CALCULA EL IMPORTE PAGADO PARA DEUDAS
    this.prototype.SubTotalDeudas = 0;
    document.paymentDetails.forEach((paymentDetailCalc: { primaryCurrencyGivenAmount: number; }) => {
      this.prototype.SubTotalDeudas += paymentDetailCalc.primaryCurrencyGivenAmount;
    });

    const documentData: any = {
      lines: (document.extraData != undefined && FormatHelper.nFacturaExtraData(document.extraData)) ?
        FormatHelper.formatDocumentLinesToPrintingModuleHubExpectedObject(document.lines, baseCurrency, document.isAnull, true)
        : FormatHelper.formatDocumentLinesToPrintingModuleHubExpectedObject(document.lines, baseCurrency, document.isAnull, false),
      linesConsigna: FormatHelper.formatDocumentLinesToPrintingModuleHubExpectedObjectConsigna(document.lines, baseCurrency),
      linesRetunsFuels: FormatHelper.formatDocumentLinesToPrintingModuleHubExpectedObjectFuels(document.lines, baseCurrency),
      totalAmountWithTax: document.totalAmountWithTax +
                          (document.totalTaxableAmount > 0 ? 0.00 : (document.discountAmountWithTax != undefined ?
                           document.discountAmountWithTax : 0.00)),
      plate: document.plate,
      operator: document.operator,
      customer: document.customer,
      showAlertInsertOperator: document.showAlertInsertOperator,
      showAlertInsertCustomer: document.showAlertInsertCustomer,
      usedDefaultOperator: document.usedDefaultOperator,
      documentId: document.documentId.substring(5),
      documentNumber: document.documentNumber != undefined ? document.documentNumber : document.documentId.substring(5),
      provisionalId: document.provisionalId,
      referencedProvisionalIdList: document.referencedProvisionalIdList,
      referencedDocumentIdList: FormatHelper.formatReferencedDocumentIdListToExpectedObject(document.referencedDocumentIdList),
      referencedDocumentNumberList: FormatHelper.formatReferencedDocumentNumberListToExpectedObject(document.referencedDocumentNumberList),
      serieId: document.series.id,
      paymentDetails: FormatHelper.formatPaymentDetailToPrintingModuleHubExpectedObject(
        document.paymentDetails,
        availablePaymentMethods,
        availableCurrencies),
      emissionLocalDateTime: FormatHelper.dateToISOString(document.emissionLocalDateTime != undefined ?
        document.emissionLocalDateTime : document.paymentDetails[0].paymentDateTime),
      emissionUTCDateTime: FormatHelper.dateToISOString(
        FormatHelper.formatToUTCDateFromLocalDate(document.emissionLocalDateTime)
      ),
      contactId: document.customer.cardInformation != undefined ? document.customer.cardInformation.contactId : undefined,
      kilometers: document.kilometers,
      currencyId: document.currencyId,
      discountPercentage: document.discountPercentage,
      discountAmountWithTax: document.isCopia ? document.discountAmountWithTax : // document.discountAmountWithTax
        (document.discountAmountWithTax == undefined || document.discountAmountWithTax == 0 ? 0.00 : (document.discountAmountWithTax)),
      totalTaxableAmount: document.totalTaxableAmount,
      totalTaxAmount: FormatHelper.calculateTotalTaxAmount(document.totalTaxList),
      taxableAmount: document.totalAmountWithTax - FormatHelper.calculateTotalTaxAmount(document.totalTaxList),
      totalTaxList: FormatHelper.formatIDictionaryStringToKeyValueForm(document.totalTaxList),
      taxableAmountList: document.taxableAmountList,
      visibleTaxableAmount: FormatHelper.countTaxableAmount(document.taxableAmountList) > 0 ? true : false,
      extraData: FormatHelper.formatIDictionaryStringToKeyValueForm(document.extraData),
      changeDelivered: document.cambio == undefined || document.cambio == 0 ? 0.00 : document.cambio,
      pendingAmountWithTax: document.pendingAmountWithTax,
      baseCurrencySymbol: baseCurrency.symbol,
      loyaltyInformation:
        document.loyaltyAttributionInfo != undefined ?
          document.loyaltyAttributionInfo.actionType == LoyaltyActionType.accumulation ?
            `${ticketsMode.loyaltyTexto}: ${document.loyaltyAttributionInfo.benefitAmount}
            ${ticketsMode.accumulatedinTexto} ${document.loyaltyAttributionInfo.benefitName}` :
            `${ticketsMode.loyaltyTexto}: ${document.loyaltyAttributionInfo.amountToRedeem}
            ${ticketsMode.redeemedfromTexto} ${document.loyaltyAttributionInfo.benefitName}` :
          '',
      isatend: document.isatend,
      subTotal: this.prototype.SubTotal + (document.totalTaxableAmount > 0 ? 0.00 :
                (document.discountAmountWithTax != undefined ? document.discountAmountWithTax : 0.00)),
      subTotalConsigna: this.prototype.SubTotalConsigna,
      company: company,
      shop: shop,
      visibleLinesConsigna: (FormatHelper.countLines(document.lines, true) > 0),
      visibleLines: (FormatHelper.countLines(document.lines, false) > 0),
      titleTicket: (document.isAnull != undefined && document.isAnull) ? ticketsMode.ticketVentaDevolucion :
        ((FormatHelper.countLines(document.lines, false) > 0
          && (document.ticketFactura == undefined || document.ticketFactura != true)) ?
          ticketsMode.facturaSimplificada : ticketsMode.ticketTexto),
      visibleFacSimpli: (document.ticketFactura == undefined && document.ticketFactura != true),
      isFuga: document.isRunAway != undefined && document.isRunAway ? true : false,
      isDeuda: document.isDeuda != undefined && document.isDeuda ? true : false,
      isNotDeuda: (document.isDeuda == undefined || !document.isDeuda ? true : false),
      isNotFuga: (document.isRunAway == undefined || !document.isRunAway ? true : false),
      importeFuga: document.isRunAway != undefined && document.isRunAway ? document.paymentDetails[0].primaryCurrencyGivenAmount : 0,
      importeEuros: this.importeLegible(document),
        // se modifica para que no tenga en cuenta el descuento en el total pagado del ticket

      matriculaFuga: document.plate != undefined ? document.plate : '',
      fechatickets: document.emissionLocalDateTime != undefined ?
        this.FormatDateToStringDatePipe(document.emissionLocalDateTime) :
        this.FormatDateToStringDatePipe(document.paymentDetails[0].paymentDateTime),
      visibleCantidadSuministrada: document.lines.length == 1 && // document.lines[0].businessSpecificLineInfo != undefined &&
        document.lines[0].businessSpecificLineInfo != undefined &&
        document.lines[0].businessSpecificLineInfo.supplyTransaction != undefined ? true : false,
      importeDeudaFuga: this.prototype.SubTotalDeudas,
      posId: document.posId != undefined ?
        document.posId.length >= 6 ?
          document.posId.substring(5) : document.posId : tpv.length >= 6 ? tpv.substring(5) : tpv
    };
    return documentData;
  }

  public static importeLegible(doc: Document): number {
    let amount = 0;

    if (doc.isRunAway == undefined || !doc.isRunAway) {
      if (doc.pendingAmountWithTax != undefined && doc.pendingAmountWithTax != 0) {
        amount += doc.totalAmountWithTax - doc.pendingAmountWithTax;
      } else {
        amount += doc.totalAmountWithTax + doc.cambio;

        if (doc.paymentDetails.find(pay => pay.paymentMethodId.substring(5) === '11') !== undefined
        && doc.paymentDetails.find(pay => pay.paymentMethodId.substring(5) === '01') !== undefined) {
          amount -= doc.paymentDetails.find(pay => pay.paymentMethodId.substring(5) === '11').primaryCurrencyTakenAmount;
        }

      }

    }

    // descuentos
    if (doc.totalTaxableAmount <= 0 ) {
      if (doc.discountAmountWithTax != undefined) {
        amount += doc.discountAmountWithTax;
      }
    }
    return amount;
  }

  // PARSEA EL DOCUMENTO DE JUSTIFICANTE DE PAGO DE VARIAS DEUDAS PARA SU ENVÍO AL SERVICIO
  public static formatDocumentDeudasMasivaToPrintingModuleHubExpectedObject(
    documentGroup: DocumentGroup,
    identity: string,
    paymentMethodDeudasMasiva: Array<PaymentMethod>,
    availableCurrencies: Array<Currency>,
    baseCurrency: Currency,
    company: Company,
    shop: Shop,
    tpv: string,
    paymentDetailList: PaymentDetail[])
    : any {

    let tieneContingencia: boolean = false;

    documentGroup.paymentDetailList.forEach(pago => {
      if (pago.method.description == 'CONTINGENCIA') {
        tieneContingencia = true;
      }
    });

    if (tieneContingencia) {
      this.CrearCarburantesContingencia(documentGroup);
    }

    const fechaImpresion: Date = new Date();
    const documentData: any = {
      company: company,
      shop: shop,
      tpv: tpv,
      fechatickets: {
        date: this.FormatDateToStringDatePipe(fechaImpresion),
        time: fechaImpresion.toTimeString().split(' G')[0]
      },
      customer: documentGroup.cliente,
      documentsPayment: documentGroup.documentIdList,
      paymentDetails: FormatHelper.formatPaymentDetailToPrintingModuleHubExpectedObject(
        documentGroup.paymentDetailList,
        paymentMethodDeudasMasiva,
        availableCurrencies),
      importeDeudas: documentGroup.pendingAmountWithTax, // importe de todas las deudas
      importeTotalTickets: documentGroup.totalAmountWithTax, // importe total original de los tickets
      changeDelivered: documentGroup.cambio == undefined || documentGroup.cambio == 0 ? 0.00 : (documentGroup.cambio),
      operator: documentGroup.operator,
      posId: tpv.length >= 6 ? tpv.substring(5) : tpv,
      carburantesContingencia: documentGroup.carburantesContingencia,
      visibleCarburantesContingencia: (documentGroup.carburantesContingencia != undefined &&
        documentGroup.carburantesContingencia.length > 0)
    };
    return documentData;
  }


  private static CrearCarburantesContingencia(grupoDocumento: DocumentGroup) {

    // Creamos nuestra lista inicial de Carburantes Contingencia.
    grupoDocumento.carburantesContingencia = [];
    let existeCarburante: boolean = false;

    grupoDocumento.documentIdList.forEach(docGru => {
      docGru.supplyTransactionList.forEach(sumi => {
        existeCarburante = false;

        grupoDocumento.carburantesContingencia.forEach(carbuConti => {
          if (sumi.gradeReference == carbuConti.idProducto) {
            carbuConti.volumen += sumi.volume;
            carbuConti.importe += sumi.money;

            existeCarburante = true;
          }
        });

        if (existeCarburante == false) {
          const nuevoCaburante: CarburanteContingencia = new CarburanteContingencia();

          nuevoCaburante.idProducto = sumi.gradeReference;
          nuevoCaburante.descripcion = sumi.description;
          nuevoCaburante.volumen = sumi.volume;
          nuevoCaburante.importe = sumi.money;
          nuevoCaburante.precioUnitario = sumi.gradeUnitPrice;

          grupoDocumento.carburantesContingencia.push(nuevoCaburante);
        }
      });
    });

    // Preparamos cuales van a ser los totales que van a poder rellenar dichos carburantes.
    let sumaTotalContigencia: number = 0;
    let cantidadYaPagada: number;

    grupoDocumento.paymentDetailList.forEach(pago => {
      if (pago.method.description == 'CONTINGENCIA') {
        sumaTotalContigencia += pago.primaryCurrencyGivenAmount;
      }
    });

    cantidadYaPagada = grupoDocumento.totalAmountWithTax - grupoDocumento.pendingAmountWithTax;

    // Hacemos la lista definitiva de Carburantes Contigencia viendo cuanto se va pagar.
    const listaCarbuContiFinal: CarburanteContingencia[] = [];
    let calculo: number;

    grupoDocumento.carburantesContingencia.forEach(carbuConti => {
      if (cantidadYaPagada > 0) {
        calculo = carbuConti.importe - cantidadYaPagada;

        if (calculo <= 0) {
          cantidadYaPagada -= carbuConti.importe;
        }
        else {
          carbuConti.importe -= cantidadYaPagada;
          cantidadYaPagada = 0;
        }
      }

      if (sumaTotalContigencia > 0 && cantidadYaPagada == 0) {
        calculo = carbuConti.importe - sumaTotalContigencia;

        if (calculo <= 0) {
          listaCarbuContiFinal.push(carbuConti);
          sumaTotalContigencia -= carbuConti.importe;
        }
        else {
          // Redondeamos porque a veces salen resultados raros al restar: 20 - 12.04 = 7.960000000000001
          carbuConti.importe = Number(sumaTotalContigencia.toFixed(2));

          carbuConti.volumen = carbuConti.importe / carbuConti.precioUnitario;
          carbuConti.volumen = Number(carbuConti.volumen.toFixed(2));
          listaCarbuContiFinal.push(carbuConti);

          sumaTotalContigencia = 0;
        }
      }
    });

    grupoDocumento.carburantesContingencia = listaCarbuContiFinal;
  }


  private static nFacturaExtraData(extraData: IDictionaryStringKey<string>): boolean {
    let resultado: boolean = false;
    for (const key in extraData) {
      if (extraData.hasOwnProperty(key) && key == 'NFACTURA') {
        resultado = true;
      }
    }
    return resultado;
  }

  private static countLines(documentLines: Array<DocumentLine>, isConsigna: boolean): number {
    if (documentLines == undefined) {
      return 0;
    } else {
      let contador: number;
      contador = 0;
      documentLines.forEach(linea => {
        if (linea.isConsigna != undefined && linea.isConsigna == isConsigna) {
          contador++;
        }
      });
      return contador;
    }
  }
  private static countTaxableAmount(taxableAmountList: Array<DocumentLineTax>): number {
    if (taxableAmountList == undefined) {
      return 0;
    } else {
      return taxableAmountList.length;
    }
  }
  private static formatDocumentLinesToPrintingModuleHubExpectedObject(
    documentLines: Array<DocumentLine>,
    baseCurrency: Currency,
    isAnull: boolean,
    isFAC: boolean
  )
    : any {

    if (documentLines == undefined) {
      return {};
    } else {

      const documentLinesSinConsigna: DocumentLine[] = [];
      this.prototype.SubTotal = 0;

      documentLines.forEach(linea => {
        if (linea.isConsigna != true) {
          linea.totalAmountWithTax = linea.quantity > 1 ? (linea.quantity * linea.priceWithTax) : linea.totalAmountWithTax;
          documentLinesSinConsigna.push(linea);

          this.prototype.SubTotal += linea.totalAmountWithTax;
        }
      });

      documentLinesSinConsigna.forEach(linea => {
        if (isAnull != undefined && isAnull) { // Juan
          if (linea.appliedPromotionListHTML != undefined && linea.appliedPromotionListHTML.length > 0) {
            linea.appliedPromotionListHTML.forEach(promo => {
              if (promo.discountAmountWithTax <= 0) {
                promo.discountAmountWithTax = - promo.discountAmountWithTax;
              }
              if (this.prototype.SubTotal >= 0) { // este if es un apaño para imprimir la anulación parcial
                this.prototype.SubTotal += (promo.discountAmountWithTax);
              }
            });
          }
        }
        else if (linea.appliedPromotionListHTML != undefined) { // Pana
          linea.appliedPromotionListHTML.forEach(promo => {
            if (promo.discountAmountWithTax >= 0) {
              promo.discountAmountWithTax = - promo.discountAmountWithTax;
            }
            this.prototype.SubTotal += (promo.discountAmountWithTax);
          });
        }
      });

      return documentLinesSinConsigna.map(dl => {
        return {
          productId: dl.productId,
          quantity: dl.quantity,
          description: dl.description,
          priceWithTax: (dl.typeArticle != undefined && dl.typeArticle.includes('COMBU'))
            ? (dl.originalPriceWithTax !== undefined ? dl.originalPriceWithTax.toFixed(3) : dl.totalAmountWithTax)
            : (isFAC ? dl.totalAmountWithTax : dl.priceWithTax),
          priceWithoutTax: isFAC ? (dl.totalAmountWithTax - dl.taxAmount) : dl.priceWithoutTax,
          discountPercentage: dl.discountPercentage,
          taxPercentage: dl.taxPercentage,
          discountAmountWithTax: dl.discountAmountWithTax,
          discountAmountWithoutTax: dl.discountAmountWithoutTax,
          taxAmount: dl.taxAmount,
          totalAmountWithTax: dl.totalAmountWithTax,
          currencySymbol: baseCurrency.symbol,
          appliedPromotionList: isAnull !== undefined && isAnull ? dl.appliedPromotionList : dl.appliedPromotionListHTML
        };
      });
    }
  }

  private static formatDocumentLinesToPrintingModuleHubExpectedObjectFuels(
    documentLines: Array<DocumentLine>,
    baseCurrency: Currency
  )
    : any {
    if (documentLines == undefined  ) {
      return {};
    } else {

      documentLines.forEach(linea => {
        if (linea.businessSpecificLineInfo != undefined) {
          if (linea.businessSpecificLineInfo.supplyTransaction != undefined) {
            if (linea.businessSpecificLineInfo.supplyTransaction.fuellingLimitType != undefined
              && linea.businessSpecificLineInfo.supplyTransaction.fuellingLimitType == FuellingLimitType.Volume) {
              if (linea.totalAmountWithTax < 0) {
                if (linea.businessSpecificLineInfo.supplyTransaction.fuellingLimitValue - linea.businessSpecificLineInfo.supplyTransaction.money
                  != (-linea.totalAmountWithTax)) {
                  linea.businessSpecificLineInfo.supplyTransaction.fuellingLimitValue =
                    linea.businessSpecificLineInfo.supplyTransaction.fuellingLimitValue
                    * linea.businessSpecificLineInfo.supplyTransaction.gradeUnitPrice;
                }
              }
            }

          }
        }
      });

      return documentLines.map(dl => {
        return {
          productId: dl.productId,
          quantity: dl.quantity,
          description: dl.description,
          priceWithTax: (dl.originalPriceWithTax !== undefined && dl.typeArticle !== undefined && dl.typeArticle.includes('COMBU'))
            ? dl.originalPriceWithTax.toFixed(3) : dl.priceWithTax,
          priceWithoutTax: dl.priceWithoutTax,
          discountPercentage: dl.discountPercentage,
          taxPercentage: dl.taxPercentage,
          discountAmountWithTax: dl.discountAmountWithTax,
          discountAmountWithoutTax: dl.discountAmountWithoutTax,
          taxAmount: dl.taxAmount,
          totalAmountWithTax: dl.totalAmountWithTax,
          currencySymbol: baseCurrency.symbol,
          appliedPromotionList: dl.appliedPromotionList,
          supplyTransaction: (dl.businessSpecificLineInfo != undefined
            && dl.businessSpecificLineInfo.supplyTransaction != undefined
            ? dl.businessSpecificLineInfo.supplyTransaction : 0)
        };
      });
    }
  }



  private static formatDocumentLinesToPrintingModuleHubExpectedObjectConsigna(
    documentLines: Array<DocumentLine>,
    baseCurrency: Currency
  )
    : any {
    if (documentLines == undefined) {
      return {};
    } else {

      const documentLinesConConsigna: DocumentLine[] = [];
      this.prototype.SubTotalConsigna = 0;

      documentLines.forEach(linea => {
        if (linea.isConsigna) {
          documentLinesConConsigna.push(linea);
          if (linea.businessSpecificLineInfo != undefined) {
            if (linea.businessSpecificLineInfo.supplyTransaction != undefined) {
              if (linea.businessSpecificLineInfo.supplyTransaction.fuellingLimitType != undefined
                && linea.businessSpecificLineInfo.supplyTransaction.fuellingLimitType == FuellingLimitType.Volume) {
                if (linea.totalAmountWithTax < 0) {
                  if (linea.businessSpecificLineInfo.supplyTransaction.fuellingLimitValue - linea.businessSpecificLineInfo.supplyTransaction.money
                    != (-linea.totalAmountWithTax)) {
                    linea.businessSpecificLineInfo.supplyTransaction.fuellingLimitValue =
                      linea.businessSpecificLineInfo.supplyTransaction.fuellingLimitValue
                      * linea.businessSpecificLineInfo.supplyTransaction.gradeUnitPrice;
                  }
                }
              }

            }
          }

          this.prototype.SubTotalConsigna += linea.totalAmountWithTax;
        }
      });

      return documentLinesConConsigna.map(dl => {
        return {
          productId: dl.productId,
          quantity: dl.quantity,
          description: dl.description,
          priceWithTax: (dl.originalPriceWithTax != undefined && dl.typeArticle != undefined && dl.typeArticle.includes('COMBU'))
            ? dl.originalPriceWithTax.toFixed(3) : dl.priceWithTax,
          priceWithoutTax: dl.priceWithoutTax,
          discountPercentage: dl.discountPercentage,
          taxPercentage: dl.taxPercentage,
          discountAmountWithTax: dl.discountAmountWithTax,
          discountAmountWithoutTax: dl.discountAmountWithoutTax,
          taxAmount: dl.taxAmount,
          totalAmountWithTax: dl.totalAmountWithTax,
          currencySymbol: baseCurrency.symbol,
          appliedPromotionList: dl.appliedPromotionList,
          supplyTransaction: (dl.businessSpecificLineInfo != undefined
            && dl.businessSpecificLineInfo.supplyTransaction != undefined
            ? dl.businessSpecificLineInfo.supplyTransaction : 0)
        };
      });
    }
  }

  private static formatPaymentDetailToPrintingModuleHubExpectedObject(
    paymentDetails: Array<PaymentDetail>,
    availablePaymentMethods: Array<PaymentMethod>,
    availableCurrencies: Array<Currency>)
    : any {

    if (paymentDetails == undefined) {
      return {};
    }

    return paymentDetails.map(pd => {
      const selectedPaymentMethod: PaymentMethod = availablePaymentMethods.find(pm => pm.id === pd.paymentMethodId);
      const selectedCurrency: Currency = availableCurrencies.find(c => c.id === pd.currencyId);
      return {
        paymentMethodId: pd.paymentMethodId,
        paymentMethodName: (selectedPaymentMethod.description !== undefined) ?
          (selectedPaymentMethod.description == 'Efectivo' || selectedPaymentMethod.description == 'METALICO')
            ? 'EUROS' : selectedPaymentMethod.description : '',
        currencyId: pd.currencyId,
        currencySymbol: selectedCurrency.symbol,
        changeFactorFromBase: pd.changeFactorFromBase,
        primaryCurrencyGivenAmount: pd.primaryCurrencyGivenAmount,
        primaryCurrencyTakenAmount: pd.primaryCurrencyTakenAmount,
        secondaryCurrencyGivenAmount: pd.secondaryCurrencyGivenAmount,
        secondaryCurrencyTakenAmount: pd.secondaryCurrencyTakenAmount,
        extraData: selectedPaymentMethod.description == 'FUGA' ? pd.extraData : FormatHelper.formatIDictionaryStringToKeyValueForm(pd.extraData)
      };
    });
  }

  public static formatServiceDocument(serviceDocument: any, roundPipe: RoundPipe, searchMode: SearchDocumentMode = SearchDocumentMode.Default):
    Document {
    let pendingAmountWithTaxCalc = 0;
    if (serviceDocument == undefined) {
      return undefined;
    }

    // Calculo Pendiente Pago FUGA/DEUDA
    if (searchMode == SearchDocumentMode.Runaway || searchMode == SearchDocumentMode.Pending) {
      if (serviceDocument.paymentDetailList != undefined) {
        serviceDocument.paymentDetailList.forEach((paymentDetailCalc: { primaryCurrencyGivenAmount: number; }) => {
          pendingAmountWithTaxCalc += paymentDetailCalc.primaryCurrencyGivenAmount;
        });

        if (pendingAmountWithTaxCalc == serviceDocument.totalAmountWithTax) {
          serviceDocument.pendingAmountWithTax = pendingAmountWithTaxCalc;
        } else {
          serviceDocument.pendingAmountWithTax = serviceDocument.totalAmountWithTax - pendingAmountWithTaxCalc;
        }
      }
    }

    const ret: Document = {
      documentId: serviceDocument.id,
      series: { id: serviceDocument.seriesId, type: serviceDocument.seriesType },
      documentNumber: serviceDocument.documentNumber,
      emissionLocalDateTime: new Date((serviceDocument.emissionLocalDateTime + '').replace('Z', '')),
      emissionUTCDateTime: new Date((serviceDocument.emissionUTCDateTime + '').replace('Z', '')),
      referencedDocumentIdList: serviceDocument.referencedDocumentIdList,
      totalTaxableAmount: serviceDocument.taxableAmount,
      totalAmountWithTax: serviceDocument.totalAmountWithTax,
      totalTaxList: serviceDocument.totalTaxList,
      taxableAmountList: serviceDocument.taxableAmountList,
      discountAmountWithTax: serviceDocument.discountAmountWithTax,
      changeDelivered: serviceDocument.changeDelivered,
      /*pendingAmountWithTax: searchMode == SearchDocumentMode.Runaway ?
      serviceDocument.totalAmountWithTax : serviceDocument.pendingAmountWithTax == undefined ?
      serviceDocument.paymentDetailList != undefined ?
      serviceDocument.paymentDetailList[0] != undefined ?
      roundPipe.appConfiguration.paymentMethodList.filter(x => x.id == serviceDocument.paymentDetailList[0].paymentMethodId).length > 0 ? // REFUND
      serviceDocument.paymentDetailList[0].primaryCurrencyGivenAmount != serviceDocument.totalAmountWithTax ?
      (serviceDocument.totalAmountWithTax - serviceDocument.paymentDetailList[0].primaryCurrencyGivenAmount)
      : 0.00 : undefined : undefined : undefined : undefined,*/
      pendingAmountWithTax: serviceDocument.pendingAmountWithTax !== undefined ? serviceDocument.pendingAmountWithTax : 0,
      plate: serviceDocument.plate,
      Nfactura: serviceDocument.nfactura,
      NAnulacionFactura: serviceDocument.nAnulacionFactura,
      paymentDetails: serviceDocument.paymentDetailList == undefined ? undefined : serviceDocument.paymentDetailList.map((x: any) => {
        const pd: PaymentDetail = {
          paymentMethodId: x.paymentMethodId,
          paymentDateTime: new Date((x.paymentDateTime + '').replace('Z', '')),
          currencyId: x.currencyId,
          changeFactorFromBase: x.changeFactorFromBase,
          primaryCurrencyGivenAmount: x.primaryCurrencyGivenAmount,
          primaryCurrencyTakenAmount: x.primaryCurrencyTakenAmount,
          secondaryCurrencyGivenAmount: x.secondaryCurrencyGivenAmount,
          secondaryCurrencyTakenAmount: x.secondaryCurrencyTakenAmount,
          extraData: x.extraData
        };
        return pd;
      }),
      lines: serviceDocument.lineList == undefined ? undefined : serviceDocument.lineList.map((x: any) => {
        let priceWithoutTax = 0;
        if (x.taxPercentage == undefined || x.taxPercentage == 0) {
          priceWithoutTax = roundPipe.transformInBaseCurrency(x.unitaryPriceWithTax - (x.taxAmount / x.quantity));
          x.taxPercentage = x.taxAmount === 0 ? 0 : (x.taxAmount / (x.totalAmountWithTax - x.taxAmount)) * 100;
        } else {
          priceWithoutTax = roundPipe.transformInBaseCurrency(x.unitaryPriceWithTax / (1 + (x.taxPercentage / 100)));
        }

        if (priceWithoutTax == 0 && (x.unitaryPriceWithTax != 0 || x.totalAmountWithTax != 0)) {
          throw new Error('Error en la información recibida del documento. Datos de tax incompletos.');
        }
        const retLine: DocumentLine = {
          quantity: x.quantity,
          description: x.productName,
          priceWithTax: x.unitaryPriceWithTax,
          discountPercentage: x.discountPercentage,
          discountAmountWithTax: x.discountAmountWithTax,
          totalAmountWithTax: x.totalAmountWithTax,
          productId: x.productId,
          taxPercentage: x.taxPercentage,
          priceWithoutTax: priceWithoutTax,
          taxAmount: x.taxAmount,
          businessSpecificLineInfo: x.businessSpecificLineInfo,
          typeArticle: x.typeArticle,
          isConsigna: x.isConsigna,
          originalPriceWithTax: x.unitaryPriceWithTax,
          appliedPromotionList: x.appliedPromotionList,
          idCategoria: x.idCategoria,
          nameCategoria: x.nameCategoria
        };
        return retLine;
      }), // todo info operador?
      operator: {
        id: serviceDocument.operatorId,
        name: serviceDocument.operatorName,
        tin: undefined,
        login: undefined,
        code: undefined,
        isDischarged: undefined,
        permissions: []
      },
      customer: serviceDocument.customer,
      extraData: serviceDocument.extraData,
      currencyId: serviceDocument.currencyId,
      posId: serviceDocument.posId,
      isCopia: searchMode == SearchDocumentMode.Copy

    };
    return ret;
  }

  // tslint:disable-next-line:max-line-length
  public static formatServiceDocumentMassive(serviceDocuments: any[], roundPipe: RoundPipe, searchMode: SearchDocumentMode = SearchDocumentMode.Default):
    Array<Document> {
      const documentos: Array<Document> = [];
      let pendingAmountWithTaxCalc = 0;
      if (serviceDocuments == undefined) {
        return undefined;
      }

      serviceDocuments.forEach(serviceDocument => {

      // Calculo Pendiente Pago FUGA/DEUDA
      if (searchMode == SearchDocumentMode.Runaway || searchMode == SearchDocumentMode.Pending) {
        if (serviceDocument.paymentDetailList != undefined) {
          serviceDocument.paymentDetailList.forEach((paymentDetailCalc: { primaryCurrencyGivenAmount: number; }) => {
            pendingAmountWithTaxCalc += paymentDetailCalc.primaryCurrencyGivenAmount;
          });
          if (pendingAmountWithTaxCalc == serviceDocument.totalAmountWithTax) {
            serviceDocument.pendingAmountWithTax = pendingAmountWithTaxCalc;
          } else {
            serviceDocument.pendingAmountWithTax = serviceDocument.totalAmountWithTax - pendingAmountWithTaxCalc;
          }
        }
      }

      // inicio mapeado datos
      const ret: Document = {
        documentId: serviceDocument.id,
        series: { id: serviceDocument.seriesId, type: serviceDocument.seriesType },
        documentNumber: serviceDocument.documentNumber,
        emissionLocalDateTime: new Date((serviceDocument.emissionLocalDateTime + '').replace('Z', '')),
        emissionUTCDateTime: new Date((serviceDocument.emissionUTCDateTime + '').replace('Z', '')),
        referencedDocumentIdList: serviceDocument.referencedDocumentIdList,
        totalTaxableAmount: serviceDocument.taxableAmount,
        totalAmountWithTax: serviceDocument.totalAmountWithTax,
        totalTaxList: serviceDocument.totalTaxList,
        discountAmountWithTax: serviceDocument.discountAmountWithTax,
        changeDelivered: serviceDocument.changeDelivered,
        /*pendingAmountWithTax: searchMode == SearchDocumentMode.Runaway ?
        serviceDocument.totalAmountWithTax : serviceDocument.pendingAmountWithTax == undefined ?
        serviceDocument.paymentDetailList != undefined ?
        serviceDocument.paymentDetailList[0] != undefined ?
        roundPipe.appConfiguration.paymentMethodList.filter(x => x.id == serviceDocument.paymentDetailList[0].paymentMethodId).length > 0 ? // REFUND
        serviceDocument.paymentDetailList[0].primaryCurrencyGivenAmount != serviceDocument.totalAmountWithTax ?
        (serviceDocument.totalAmountWithTax - serviceDocument.paymentDetailList[0].primaryCurrencyGivenAmount)
        : 0.00 : undefined : undefined : undefined : undefined,*/
        pendingAmountWithTax: serviceDocument.pendingAmountWithTax !== undefined ? serviceDocument.pendingAmountWithTax : 0,
        plate: serviceDocument.plate,
        Nfactura: serviceDocument.nfactura,
        paymentDetails: serviceDocument.paymentDetailList == undefined ? undefined : serviceDocument.paymentDetailList.map((x: any) => {
          const pd: PaymentDetail = {
            paymentMethodId: x.paymentMethodId,
            paymentDateTime: new Date((x.paymentDateTime + '').replace('Z', '')),
            currencyId: x.currencyId,
            changeFactorFromBase: x.changeFactorFromBase,
            primaryCurrencyGivenAmount: x.primaryCurrencyGivenAmount,
            primaryCurrencyTakenAmount: x.primaryCurrencyTakenAmount,
            secondaryCurrencyGivenAmount: x.secondaryCurrencyGivenAmount,
            secondaryCurrencyTakenAmount: x.secondaryCurrencyTakenAmount,
            extraData: x.extraData
          };
          return pd;
        }),
        lines: serviceDocument.lineList == undefined ? undefined : serviceDocument.lineList.map((x: any) => {
          let priceWithoutTax = 0;
          if (x.taxPercentage == undefined || x.taxPercentage == 0) {
            priceWithoutTax = roundPipe.transformInBaseCurrency(x.unitaryPriceWithTax - (x.taxAmount / x.quantity));
            x.taxPercentage = x.taxAmount === 0 ? 0 : (x.taxAmount / (x.totalAmountWithTax - x.taxAmount)) * 100;
          } else {
            priceWithoutTax = roundPipe.transformInBaseCurrency(x.unitaryPriceWithTax / (1 + (x.taxPercentage / 100)));
          }
          if (priceWithoutTax == 0 && (x.unitaryPriceWithTax != 0 || x.totalAmountWithTax != 0)) {
            throw new Error('Error en la información recibida del documento. Datos de tax incompletos.');
          }
          const retLine: DocumentLine = {
            quantity: x.quantity,
            description: x.productName,
            priceWithTax: x.unitaryPriceWithTax,
            discountPercentage: x.discountPercentage,
            totalAmountWithTax: x.totalAmountWithTax,
            productId: x.productId,
            taxPercentage: x.taxPercentage,
            priceWithoutTax: priceWithoutTax,
            taxAmount: x.taxAmount,
            businessSpecificLineInfo: x.businessSpecificLineInfo,
            typeArticle: x.typeArticle,
            isConsigna: x.isConsigna,
            originalPriceWithTax: x.unitaryPriceWithTax,
            appliedPromotionList: x.appliedPromotionList,
            idCategoria: x.idCategoria,
            nameCategoria: x.nameCategoria
          };
          return retLine;
        }), // todo info operador?
        operator: {
          id: serviceDocument.operatorId,
          name: serviceDocument.operatorName,
          tin: undefined,
          login: undefined,
          code: undefined,
          isDischarged: undefined,
          permissions: []
        },
        customer: serviceDocument.customer,
        extraData: serviceDocument.extraData,
        currencyId: serviceDocument.currencyId,
        posId: serviceDocument.posId,
        isCopia: searchMode == SearchDocumentMode.Copy
      };

      documentos.push(ret);
    });

    return documentos;
  }

  // parsea datos de la búsqueda de documentos para pedir su búsqueda al servicio
  public static formatSearchDocumentToServiceExpectedObject(code: string): any {
    return {
      CriteriaList: [{
        text: code,
        field: 0,
        matchingType: 0
      }],
      criteriaRelationshipType: 0,
      mustIncludeDischarged: false
    };
  }

  public static formatPaymentDetailToServiceExpectedObject(paymentDetails: Array<PaymentDetail>, isAttend: boolean = false): any {
    if (paymentDetails == undefined) {
      return {};
    }
    return paymentDetails.map(pd => {
      return {
        paymentMethodId: pd.paymentMethodId,
        paymentDateTime: isAttend === false ? FormatHelper.dateToISOString(pd.paymentDateTime) : undefined,
        utcDateTime: isAttend === false ? FormatHelper.dateToISOString(FormatHelper.formatToUTCDateFromLocalDate(pd.paymentDateTime)) : undefined,
        currencyId: pd.currencyId,
        changeFactorFromBase: FormatHelper.formatNumber(pd.changeFactorFromBase),
        primaryCurrencyGivenAmount: FormatHelper.formatNumber(pd.primaryCurrencyGivenAmount),
        primaryCurrencyTakenAmount: FormatHelper.formatNumber(pd.primaryCurrencyTakenAmount),
        secondaryCurrencyGivenAmount: FormatHelper.formatNumber(pd.secondaryCurrencyGivenAmount),
        secondaryCurrencyTakenAmount: FormatHelper.formatNumber(pd.secondaryCurrencyTakenAmount),
        extraData: pd.extraData,
        usageType: CreatePaymentUsageType.pendingPayment,
      };
    });
  }

  // parsea las líneas del documento para enviarlas al servicio
  public static formatDocumentLinesToServiceExpectedObject(documentLines: Array<DocumentLine>): any {
    if (documentLines == undefined) {
      return {};
    }
    return documentLines.map((documentLine, index) => {
      return {
        DocumentId: documentLine.productId.length > 5 ? documentLine.productId.substring(0, 5) : documentLine.productId,
        lineNumber: index + 1,
        productId: documentLine.productId,
        quantity: FormatHelper.formatNumber(documentLine.quantity),
        unitaryPriceWithTax: FormatHelper.formatNumber(documentLine.priceWithTax),
        discountPercentage: FormatHelper.formatNumber(documentLine.discountPercentage),
        discountAmountWithTax: FormatHelper.formatNumber(documentLine.discountAmountWithTax),
        taxPercentage: FormatHelper.formatNumber(documentLine.taxPercentage),
        taxAmount: FormatHelper.formatNumber(documentLine.taxAmount),
        productName: documentLine.description,
        totalAmountWithTax: FormatHelper.formatNumber(documentLine.totalAmountWithTax),
        priceWithoutTax: FormatHelper.formatNumber(documentLine.priceWithoutTax),
        appliedPromotionList: documentLine.appliedPromotionList != undefined ?
          FormatHelper.formatDocumentLinePromotionsToServiceExpectedObject(documentLine.appliedPromotionList) : undefined,
        isConsigna: documentLine.isConsigna,
        TypeArticle: documentLine.typeArticle
      };
    });
  }

  // parsea la lista de promociones dentro de una línea de documento para enviar al servicio
  public static formatDocumentLinePromotionsToServiceExpectedObject(documentLinePromotions: Array<DocumentLinePromotion>): any {
    if (documentLinePromotions == undefined) {
      return {};
    }
    return documentLinePromotions.map((documentLinePromotion, index) => {
      // this._logHelper.trace('Linea del documento:');
     // this._logHelper.trace(documentLinePromotion);
      return {
        promotionId: documentLinePromotion.promotionId,
        description: documentLinePromotion.description,
        discountAmountWithTax: FormatHelper.formatNumber(documentLinePromotion.discountAmountWithTax),
        numberOfTimesApplied: FormatHelper.formatNumber(documentLinePromotion.numberOfTimesApplied),
        referredLineNumber: FormatHelper.formatNumber(documentLinePromotion.referredLineNumber)
      };
    });
  }

  // OPERADOR CLIENTE
  /////////////////////

  // parsea el customer a crear que recibe el servicio
  public static formatCustomerToServiceExpectedObject(customer: Customer): any {
    return {
      id: customer.id,
      tin: customer.tin,
      tinTypeId: customer.tinTypeId !== undefined ? customer.tinTypeId : '',
      businessName: customer.businessName,
      // TODO: El Customer sólo tiene una dirección. El Customer de 'CLIENTE DE CONTADO' NO TIENE ADDRESS por definición.
      createAddressDAOList: (customer.addressList ? customer.addressList.map(a => FormatHelper.formatAddresssToServiceExpectedObject(a)) : [])
    };
  }

  // parsea una dirección al formato esperado por el servicio
  public static formatAddresssToServiceExpectedObject(address: Address): any {
    let requestAddress: any;
    if (address.city != undefined) {
      requestAddress = {
        cityId: address.city.id,
        cityName: address.city.name,
        provinceId: FormatHelper.formatNumber(address.city.provinceId),
        provinceName: address.city.provinceName,
        countryId: FormatHelper.formatNumber(address.country.id),
        countryName: address.country.name,
        postalCode: address.city.postalCode,
        street: address.street,
        type: address.type
      };
    } else if (requestAddress !== undefined && address.country !== undefined) {
      requestAddress = {
        countryId: address.country.id !== undefined ? FormatHelper.formatNumber(address.country.id) : '',
        // address.country.id != undefined ? FormatHelper.formatNumber(address.country.id) : address.countryId,
        countryName: address.country.name,
        street: address.street,
        type: address.type
      };
    }
    return requestAddress;
  }

  /**
   *
   * @description Formatea un objeto cualquiero a un Cliente
   * @static
   * @param {*} customerSvc
   * @returns {Customer}
   * @memberof FormatHelper
   */
  public static formatCustomerFromService(customerSvc: any, isFleet: boolean, currencyList: Currency[], matricula?: string): Customer {

    let balance: string = customerSvc.balance;
    currencyList.forEach(currency => {
      if (currency.id == customerSvc.balanceCurrencyId && balance != undefined) {
        const decimalComaPosition: number = balance.length - currency.decimalPositions;
        balance = balance.slice(0, decimalComaPosition) + '.' + balance.slice(decimalComaPosition);
      }
    });

    const customer: Customer = {
      id: customerSvc.id,
      businessName: customerSvc.businessName,
      customerMessage: customerSvc.customerMessage,
      tin: customerSvc.tin,
      tinTypeId: customerSvc.tinTypeId,
      addressList: customerSvc.addressList == undefined ? [] : this.formatAddressFromService(customerSvc.addressList),
      isDischarged: customerSvc.isDischarged,
      cardInformation: {
        balance: +balance,
        balanceCurrencyId: customerSvc.balanceCurrencyId,
        contactId: customerSvc.contactId,
        documentTypeId: customerSvc.documentTypeId,
        drivenDistance: customerSvc.drivenDistance,
        driverName: customerSvc.driverName,
        isFleet: isFleet,
        plate: customerSvc.plate
      },
      customerType: customerSvc.customerType,
      phoneNumber: customerSvc.phoneNumber,
      riesgo1: customerSvc.riesgo1,
      riesgo2: customerSvc.riesgo2,
      matricula: matricula
    };
    return customer;
  }
  public static formatAddressFromService(addressList: any) {
    return addressList.map((x: any) => {
      const a: Address = {
        city: {
          name: x.cityName,
          provinceName: x.provinceName,
          postalCode: x.postalCode
        },
        country: {
          id: undefined, // no viene en la respuesta
          name: x.countryName
        },
        street: x.street,
        type: x.type,
        phoneNumber: x.phoneNumber
      };
      return a;
    });
  }

  // parsea datos del operador para pedir su búsqueda al servicio
  public static formatEstadoOperatorToServiceExpectedObject(
    idOperador: string,
    idTpv: string,
    idTienda: Shop)
    : any {
    return {
      IdOperador: idOperador,
      IdTpv: idTpv,
      IdTienda: idTienda.id
    };
  }
  // parsea datos del operador para pedir su búsqueda al servicio
  public static formatSearchOperatorToServiceExpectedObject(text: string, fieldsToSearchIn: SearchOperatorCriteriaFieldType[]): any {
    return {
      criteriaList: fieldsToSearchIn.map(field => {
        return {
          text: text,
          field: field,
          matchingType: SearchOperatorCriteriaMatchingType.exact
        };
      }),
      criteriaRelationshipType: SearchCriteriaRelationshipType.or,
      mustIncludeDischarged: false
    };
  }

  // parsea datos del cliente para pedir su búsqueda al servicio
  public static formatSearchCustomerToServiceExpectedObject(text: string, fieldsToSearchIn: SearchCustomerCriteriaFieldType[]): any {
    return {
      criteriaList: fieldsToSearchIn.map(field => {
        return {
          text: text,
          field: field,
          matchingType: this.formatSearchCustomerCriteriaMatchingType(field)
        };
      }),
      criteriaRelationshipType: SearchCriteriaRelationshipType.or,
      mustIncludeDischarged: false
    };
  }

  public static formatSearchCustomerCriteriaMatchingType(field: SearchCustomerCriteriaFieldType): SearchCustomerCriteriaMatchingType {
    switch (field) {
      case SearchCustomerCriteriaFieldType.tin:
        return SearchCustomerCriteriaMatchingType.startWith;
      default:
        return SearchCustomerCriteriaMatchingType.anywhere;
    }
  }

  // PRODUCTOS
  /////////////////////

  // parsea datos del busqueda producto para pedir su búsqueda al servicio
  public static formatSearchProductToServiceExpectedObject(text: string, fieldsToSearchIn: SearchPluProductCriteriaFieldType[]): any {
    return {
      criteriaList: fieldsToSearchIn.map(field => {
        return {
          text: text,
          field: field,
          matchingType: field != 2 ? SearchPluProductCriteriaMatchingType.anywhere : SearchPluProductCriteriaMatchingType.exact
        };
      }),
      criteriaRelationshipType: SearchCriteriaRelationshipType.or,
      mustIncludeDischarged: false
    };
  }

  public static formatSearchProductBarCode(text: string, fieldsToSearchIn: SearchPluProductCriteriaFieldType[]): any {
    return {
      criteriaList: fieldsToSearchIn.map(field => {
        return {
          text: text,
          field: field,
          matchingType: SearchPluProductCriteriaMatchingType.exact
        };
      }),
      criteriaRelationshipType: SearchCriteriaRelationshipType.and,
      mustIncludeDischarged: false
    };
  }

  // DATOS DE CLIENTE
  /////////////////////

  // search city by country name
  public static formatSearchCityByCountryToServiceExpectedObject(countryName: string): any {
    return {
      CriteriaList: [{
        text: countryName,
        field: 1,
        matchingType: 3
      }],
      criteriaRelationshipType: 0
    };
  }

  // search city by name
  public static formatSearchCityByNameToServiceExpectedObject(cityName: string): any {
    return {
      CriteriaList: [{
        text: cityName,
        field: 0,
        matchingType: 2
      }],
      criteriaRelationshipType: 0
    };
  }

  // search province by country
  public static formatSearchProvinceByCountryToServiceExpectedObject(countryName: string): any {
    return {
      CriteriaList: [{
        text: countryName,
        field: 1,
        matchingType: 3
      }],
      criteriaRelationshipType: 0
    };
  }

  // Cierre de caja
  /////////////////////
  public static formatToCashboxClosureInfoServiceExpectedObject(
    operator: Operator, countedAmount: number, extractedAmount: number, currentLocalDate: Date
  ): any {
    return {
      operatorId: operator != undefined ? operator.id : 0,
      countedAmount: FormatHelper.formatNumber(countedAmount),
      extractedAmount: FormatHelper.formatNumber(extractedAmount),
      requestLocalDateTime: FormatHelper.dateToISOString(currentLocalDate),
      requestUTCDateTime: FormatHelper.dateToISOString(FormatHelper.formatToUTCDateFromLocalDate(currentLocalDate))
    };
  }

  // Entrada-salida de caja
  /////////////////////
  public static formatTocreateCashboxRecordServiceExpectedObject(
    posId: string,
    operator: Operator,
    cashboxRecordType: CashboxRecordType,
    enteredAmount: number,
    currency: Currency,
    paymentMethod: PaymentMethod,
    cashboxRecordReason: CashboxRecordReason,
    observations: string,
    currentLocalDate: Date
  ): any {
    return {
      operatorId: operator != undefined ? operator.id : 0,
      operatorName: operator.name,
      recordType: cashboxRecordType,
      paymentMethodId: paymentMethod.id,
      amount: FormatHelper.formatNumber(enteredAmount),
      currency: currency.id,
      changeFactorFromBase: FormatHelper.formatNumber(currency.changeFactorFromBase),
      reasonId: cashboxRecordReason.id,
      observations: observations,
      requestLocalDateTime: FormatHelper.dateToISOString(currentLocalDate),
      requestUTCDateTime: FormatHelper.dateToISOString(FormatHelper.formatToUTCDateFromLocalDate(currentLocalDate))
    };
  }

  static formatCashboxRecordToPrintingModuleHubExpectedObject(
    operator: Operator,
    recordType: CashboxRecordType,
    cashboxRecordData: CashboxRecordData,
    company: Company,
    shop: Shop,
    currentLocalDate: Date,
    tpv: string,
    ticketsMode: any
  ): any {
    const titleText: string = (
      recordType === CashboxRecordType.cashEntry ? ticketsMode.entrada :
        recordType === CashboxRecordType.cashOut ? ticketsMode.salida : ''
    );
    return {
      operator: operator,
      recordType: titleText,
      recordReason: cashboxRecordData.cashboxRecordReason.caption,
      amount: cashboxRecordData.amount,
      currencySymbol: cashboxRecordData.currency.symbol,
      observations: cashboxRecordData.observations != undefined ? cashboxRecordData.observations : '',
      emissionLocalDateTime: FormatHelper.dateToISOString(currentLocalDate),
      company,
      shop,
      posId: tpv
    };
  }

  static formatInformeVentasToPrintingModuleHubExpectedObject(
    documentListRecaudacion: InformeVentasRecaudacion[],
    documentListVentas: InformeVentasResumen[],
    listaAPintarCategorias: InformeVentasCategorias[],
    company: Company,
    shop: Shop,
    currentLocalDate: Date,
    tpv: string,
    informeMode: any
  ): any {
    const titleText: string = (
      informeMode === 'RESUMENVENTAS' ? 'Resumen Ventas' : 'Detalles Ventas'
    );
    const typeMode: boolean = (
      informeMode === 'RESUMENVENTAS' ? true : false
    );
    // const documentListVentasString: any[] = [];

    // documentListVentas.forEach(x => {
    //   documentListVentasString.push({
    //     Fecha: FormatHelper.dateToISOString(x.Fecha),
    //     Tienda: x.Tienda,
    //     Carburante : x.Carburante,
    //     Servicios : x.Servicios,
    //     TotalDia : x.TotalDia
    //     });
    // });

    return {
      documentListRecaudacion: FormatHelper.formatInformeRecaudaciontoPrint(documentListRecaudacion),
      documentListVentas: FormatHelper.formatInformeVentastoPrint(documentListVentas),
      listaAPintarCategorias: FormatHelper.formatInformeVentasCategoriastoPrint(listaAPintarCategorias),
      titleText: titleText,
      emissionLocalDateTime: FormatHelper.dateToISOString(currentLocalDate),
      company,
      shop,
      posId: tpv,
      typeMode: typeMode,
      typeMode2: !typeMode,
      totalDetalles: FormatHelper.formatInformeVentasCategoriastoPrintTotal(listaAPintarCategorias),
      TotalRecaudacionDocumento: this.prototype.SubTotalInformeRecaudacion
    };
  }

  // Entrada-salida de caja OFFLINE
  /////////////////////
  /* public static formatTocreateCashboxRecordOfflineServiceExpectedObject(
    posId: string,
    operador: Operator,
    cashboxRecordType: CashboxRecordTypeOffline,
    enteredAmount: number,
    divisa: Currency,
    medio: PaymentMethod,
    cashboxRecordReason: CashboxRecordReasonOffline,
    descripcion: string,
    currentLocalDate: Date
    /*codigo: string, descripcion: string, serie: string, tienda: string
  ): any {
    return {
      operadorId: operador != undefined ? operador.id : 0,
      tanotacion: cashboxRecordType,
      medio: medio.id,
      importe: FormatHelper.formatNumber(enteredAmount),
      divisa: divisa.id,
      changeCurrency: FormatHelper.formatNumber(divisa.changeFactorFromBase),
      tapunte: cashboxRecordReason.id,
      descripcion: descripcion,
      fecha: FormatHelper.dateToISOString(currentLocalDate),
      fechaNegocio: currentLocalDate
      /* FormatHelper.dateToISOString(FormatHelper.formatToUTCDateFromLocalDate(currentLocalDate)) */ /*borrar al pasar a nullable
};
}

static formatCashboxRecordOfflineToPrintingModuleHubExpectedObject(
operador: Operator,
posInformation: Posinformation,
tanotacion: CashboxRecordTypeOffline,
cashboxRecordData: CashboxRecordDataOffline,
company: Company,
shop: Shop,
currentLocalDate: Date,
): any {
const titleText: string = (
tanotacion === CashboxRecordTypeOffline.cashEntry ? 'ENTRADA' :
tanotacion === CashboxRecordTypeOffline.cashOut ? 'SALIDA' : ''
);
return {
operadorId: operador.id,
operadorName: operador.name,
tanotacion: titleText,
cashBoxCode: company.id + posInformation.code,
recordReason: cashboxRecordData.cashboxRecordReasonOffline.caption,
importe: cashboxRecordData.importe,
currencySymbol: cashboxRecordData.divisa.symbol,
descripcion: cashboxRecordData.descripcion != undefined ? cashboxRecordData.descripcion : '',
emissionLocalDateTime: FormatHelper.dateToISOString(currentLocalDate),
changeCurrency: cashboxRecordData.divisa.changeFactorFromBase = cashboxRecordData.importe,
valor: cashboxRecordData.cashboxRecordReasonOffline.valor,
company,
shop,
};
} */

  // Prueba de surtidor
  /////////////////////
  static formatFuellingPointTestToPrintingModuleHubExpectedObject(
    operator: Operator,
    fuellingTestEntryData: FuellingPointTestData,
    supplyTransaction: SuplyTransaction,
    tankCaption: string,
    defaultFuellingTankCaption: string,
    tpv: string,
    currentLocalDate: Date,
    valor: Date = new Date(supplyTransaction.finishDateTime),

  ): any {
    return {
      operator: operator,
      posId: tpv,
      deviation: fuellingTestEntryData.deviation,
      observations: fuellingTestEntryData.observations,
      supplyDateTime: supplyTransaction.finishDateTime,
      fuellingPoint: supplyTransaction.fuellingPointId,
      grade: supplyTransaction.gradeReference,
      volume: supplyTransaction.volume,
      originTankCaption: defaultFuellingTankCaption,
      returnTankCaption: tankCaption,
      noozle: supplyTransaction.gradeId,
      supplyId: supplyTransaction.id,
      // ATENCIÓN: Esta es una excepción a la necesidad de conversión a ISOString.
      // el campo supplyTransaction.finishDateTime no es compatible con la función dateToISOString
      testLocalDateTime: supplyTransaction.finishDateTime,
      emissionLocalDateTime: FormatHelper.dateToISOString(currentLocalDate),
      fechatickets: currentLocalDate != undefined ?
        this.FormatDateToStringDatePipe(currentLocalDate) :
        this.FormatDateToStringDatePipe(currentLocalDate),
      fechatestLocalDateTime: valor != undefined ?
        this.formatDateToString(valor) :
        this.formatDateToString(valor),
      descripcion: supplyTransaction.description,
    };
  }

  // MENSAJES
  /////////////////////

  // segun código de error mostrará un mensaje u otro
  public static formatResponseStatusMessage(status: number): string {
    return 'Se ha producido un error.';
  }

  public static formatOperatorMessage(status: number): string {
    return 'El operador es obligatorio.';
  }

  public static formatGetDocumentResponseStatusesMessage(status: GetDocumentResponseStatuses): string {
    if (status == -1 || status == -2 || status == -3) {
      return 'Se ha producido un error.';
    } else if (status == -4) {
      return 'El documento no existe';
    } else if (status == -5) {
      return 'Error de comunicación';
    } else {
     // this._logHelper.trace(`status devuelto desconocido: ${status}`);
      return 'Se ha producido un error.';
    }
  }

  public static formatSearchDocumentResponseStatusesMessage(status: SearchDocumentResponseStatuses): string {
    if (status == -1 || status == -2 || status == -3) {
      return 'Se ha producido un error.';
    } else if (status == -4) {
      return 'Error de comunicación';
    } else {
      // this._logHelper.trace(`status devuelto desconocido: ${status}`);
      return 'Se ha producido un error.';
    }
  }

  // TOKENS
  /////////////////////

  public static exchangeKeysByValuesForIframeUrl(url: string, operatorId: string, customerId: String,
    posGUID: string, companyID: string, signToken: string, language: string): string {
    const tokens = [
      {
        key: '{currentOperatorId}',
        value: operatorId,
        preposition: 'op=',
        required: true
      },
      {
        key: '{posId}',
        value: posGUID,
        preposition: 'posId=',
        required: true
      },
      {
        key: '{currentCustomerId}',
        value: customerId,
        preposition: 'currentCustomerId=',
        required: false
      },
      {
        key: '{localDateTime}',
        value: this.dateToISOString(new Date()),
        preposition: 'localDateTime=',
        required: true
      },
      {
        key: '{localDateTimeUTC}',
        value: this.dateToISOString(this.formatToUTCDateFromLocalDate(new Date())),
        preposition: 'localDateTimeUTF=',
        required: true
      },
      {
        key: '{ncompany}',
        value: companyID,
        preposition: 'company=',
        required: false
      },
      {
        key: '{language}',
        value: language,
        preposition: 'pc=',
        required: false
      }
    ];

    let updateURL = url;

    // intercambio las keys por values, si no se puede sustituir y es obligatorio lo concateno al final
    for (let i = 0; i < tokens.length; i++) {
      if (updateURL.includes(tokens[i].key)) {
        updateURL = updateURL.replace(tokens[i].key, <any>tokens[i].value); // el <any> es para satisfacer el compilador
      } else if (tokens[i].required) {
        if (!updateURL.includes('?')) {
          updateURL = updateURL + '?' + tokens[i].preposition + tokens[i].value;
        } else {
          updateURL = updateURL + '&' + tokens[i].preposition + tokens[i].value;
        }
      }
    }

    // firmo el url
    updateURL += '&sign=' + signToken;

    return updateURL;
  }

  // FECHAS
  /////////////////////

  // Formato fecha DD/MM/AAAA
  public static formatDateToString(localDate: Date): String {
    let dateformatted = '';
    if (localDate == undefined) {
      return undefined;
    }

    if (localDate.getMonth() + 1 < 10) {
      dateformatted += '0' + (localDate.getMonth() + 1);
    } else {
      dateformatted += (localDate.getMonth() + 1);
    }

    return localDate.getDate().toString() + '/' + dateformatted + '/'
      + localDate.getFullYear().toString();
  }

  public static FormatDateToStringDatePipe(date: Date): string {
    const datePipe = new DatePipe('es-ES');
    return datePipe.transform(date, 'dd/MM/yyyy');
  }

  // Calcula la fecha-hora en formato UTC a partir de una fecha local
  public static formatToUTCDateFromLocalDate(localDate: Date): Date {
    if (localDate == undefined) {
      return undefined;
    }
    return new Date(localDate.getTime() + (localDate.getTimezoneOffset() * 60000));
  }

  // converts date to ISO format (ex: 2018-05-02T09:21:47.000Z)
  public static dateToISOString(dateToConvert: Date): String {
    let dateformatted;
    if (dateToConvert) {
      dateformatted = dateToConvert.getFullYear() + '-';
      if (dateToConvert.getMonth() + 1 < 10) {
        dateformatted += '0' + (dateToConvert.getMonth() + 1) + '-';
      } else {
        dateformatted += (dateToConvert.getMonth() + 1) + '-';
      }
      if (dateToConvert.getDate() < 10) {
        dateformatted += '0' + dateToConvert.getDate();
      } else {
        dateformatted += dateToConvert.getDate();
      }
      dateformatted += 'T';
      if (dateToConvert.getHours() == 0) {
        dateformatted += '00:';
      } else if (dateToConvert.getHours() < 10) {
        dateformatted += '0' + dateToConvert.getHours() + ':';
      } else {
        dateformatted += dateToConvert.getHours() + ':';
      }
      if (dateToConvert.getMinutes() == 0) {
        dateformatted += '00' + ':';
      } else if (dateToConvert.getMinutes() < 10) {
        dateformatted += '0' + dateToConvert.getMinutes() + ':';
      } else {
        dateformatted += dateToConvert.getMinutes() + ':';
      }
      if (dateToConvert.getSeconds() == 0) {
        dateformatted += '00';
      } else if (dateToConvert.getSeconds() < 10) {
        dateformatted += '0' + dateToConvert.getSeconds();
      } else {
        dateformatted += dateToConvert.getSeconds();
      }
      dateformatted += 'Z';
    }
    return dateformatted;
  }

  // Asegura que un objeto de entrada sea interpretado como numérico
  private static formatNumber(input?: any): number {
    if (input) {
      return Number(input);
    } else {
      return undefined;
    }
  }

  // PRINTING
  //////////////////////

  // Transforma una lista de objetos con forma de usecasePrintingConfiguration en una lista de usecasePrintingConfiguration
  public static formatUsecasesPrintingConfigurationListFromObject(objects: any[]): UsecasePrintingConfiguration[] {
    const usecasesPrintingConfigurationList: UsecasePrintingConfiguration[] = [];
    objects.forEach(o => {
      const usecasePrintingConfiguration: UsecasePrintingConfiguration = {
        useCase: o.UseCase,
        printingTemplatePlatformType: o.PrintingTemplatePlatformType,
        defaultNumberOfCopies: o.DefaultNumberOfCopies,
        required: o.Required,
      };
      usecasesPrintingConfigurationList.push(usecasePrintingConfiguration);
    });
    return usecasesPrintingConfigurationList;
  }

  // Trasforma un diccionario {"a": "b", "c": "d"} a [{key: "a", value: "b"}, {key: "c", value: "d"]
  public static formatIDictionaryStringToKeyValueForm(dictionary: IDictionaryStringKey<any>): any {
    const list = [];
    for (const dictionaryKey in dictionary) {
      if (dictionary.hasOwnProperty(dictionaryKey)) {
        const element = {
          key: dictionaryKey,
          value: dictionary[dictionaryKey]
        };
        list.push(element);
      }
    }
    return list;
  }

  // Añade a la lista de referencedDocumentIdList la clave documentId
  public static formatReferencedDocumentIdListToExpectedObject(referencedDocumentIdList: string[]): any {
    const expectedList: any = [];

    if (referencedDocumentIdList == undefined) {
      return expectedList;
    }
    referencedDocumentIdList.forEach(d => {
      const expectedElement = {
        documentId: d.substring(5)
      };
      expectedList.push(expectedElement);
    });
    return expectedList;
  }

  // Añade a la lista de referencedDocumentNumberList la clave documentNumber
  public static formatReferencedDocumentNumberListToExpectedObject(referencedDocumentNumberList: string[]): any {
    const expectedList: any = [];

    if (referencedDocumentNumberList == undefined) {
      return expectedList;
    }
    referencedDocumentNumberList.forEach(d => {
      const expectedElement = {
        documentNumber: d
      };
      expectedList.push(expectedElement);
    });
    return expectedList;
  }

  // suma l0s ivas de la lista
  public static calculateTotalTaxAmount(totalTaxList: IDictionaryStringKey<number>): number {
    let totalTaxAmount: number = 0;
    for (const key in totalTaxList) {
      if (totalTaxList.hasOwnProperty(key)) {
        totalTaxAmount = totalTaxAmount + totalTaxList[key];
      }
    }
    return totalTaxAmount;
  }

  public static formatInformeVentasCategoriastoPrintTotal(listaAPintarCategorias: InformeVentasCategorias[]): Number {
    const informeVentasCategImprimir: InformeVentasCategoriasPrint[] = [];
    const informeVentasCategImprimirFin: InformeVentasCategoriasPrintFin[] = [];
    const subTotalDia: any = [{ Fecha: Date, Importe: 0 }];

    listaAPintarCategorias.forEach(xCat => {
      xCat.ListaLineas.forEach(xCatDev => {
        if (informeVentasCategImprimir.filter(x => x.Fecha.toDateString() == xCatDev.Fecha.toDateString()).length > 0) {
          if (informeVentasCategImprimir.find(x => x.Fecha.toDateString() == xCatDev.Fecha.toDateString())
            .ListCategSubtotal.filter(z => z.CategoriaId == xCat.CategoriaId).length > 0
          ) {
            informeVentasCategImprimir.find(x => x.Fecha.toDateString() == xCatDev.Fecha.toDateString())
              .ListCategSubtotal.find(z => z.CategoriaId == xCat.CategoriaId).SubtotalCateg += xCatDev.Importe;

            subTotalDia.filter((z: { Fecha: Date, Importe: number }) =>
              z.Importe > 0).find((x: { Fecha: Date, Importe: number }) =>
                x.Fecha.toDateString() == xCatDev.Fecha.toDateString()).Importe += xCatDev.Importe;
          } else {
            informeVentasCategImprimir.find(x => x.Fecha.toDateString() == xCatDev.Fecha.toDateString())
              .ListCategSubtotal.push({
                CategoriaName: xCat.CategoriaName,
                FechaLinea: this.formatDateToString(xCatDev.Fecha),
                CategoriaId: xCat.CategoriaId,
                SubtotalCateg: xCatDev.Importe
              });
            subTotalDia.filter((z: { Fecha: Date, Importe: number }) =>
              z.Importe > 0).find((x: { Fecha: Date, Importe: number }) =>
                x.Fecha.toDateString() == xCatDev.Fecha.toDateString()).Importe += xCatDev.Importe;
          }
        } else {
          informeVentasCategImprimir.push({
            Fecha: xCatDev.Fecha,
            TotalDiaList: xCatDev.Importe,
            ListCategSubtotal: [{
              CategoriaName: xCat.CategoriaName,
              FechaLinea: this.formatDateToString(xCatDev.Fecha),
              CategoriaId: xCat.CategoriaId, SubtotalCateg: xCatDev.Importe
            }]
          });
          if (xCatDev.Importe > 0) {
            subTotalDia.push({
              Fecha: xCatDev.Fecha,
              Importe: xCatDev.Importe
            });
          }
        }
      });
    });

    subTotalDia.forEach((x: { Fecha: Date, Importe: number }) => {
      if (x.Importe > 0) {
        informeVentasCategImprimir.find(z => z.Fecha.toDateString() == x.Fecha.toDateString()).TotalDiaList = x.Importe;
      }
    });

    informeVentasCategImprimir.forEach(x => {
      informeVentasCategImprimirFin.push({
        Fecha: this.formatDateToString(x.Fecha),
        ListCategSubtotal: x.ListCategSubtotal,
        TotalDiaList: x.TotalDiaList
      });
    });

    const valorTotal = informeVentasCategImprimirFin.reduce(function (accumulator, line) {
      return accumulator + line.TotalDiaList;
    }, 0);

    return valorTotal;
  }


  public static formatInformeVentasCategoriastoPrint(listaAPintarCategorias: InformeVentasCategorias[]): InformeVentasCategoriasPrintFin[] {
    const informeVentasCategImprimir: InformeVentasCategoriasPrint[] = [];
    const informeVentasCategImprimirFin: InformeVentasCategoriasPrintFin[] = [];
    const subTotalDia: any = [{ Fecha: Date, Importe: 0 }];

    listaAPintarCategorias.forEach(xCat => {
      xCat.ListaLineas.forEach(xCatDev => {
        if (informeVentasCategImprimir.filter(x => x.Fecha.toDateString() == xCatDev.Fecha.toDateString()).length > 0) {
          if (informeVentasCategImprimir.find(x => x.Fecha.toDateString() == xCatDev.Fecha.toDateString())
            .ListCategSubtotal.filter(z => z.CategoriaId == xCat.CategoriaId).length > 0
          ) {
            informeVentasCategImprimir.find(x => x.Fecha.toDateString() == xCatDev.Fecha.toDateString())
              .ListCategSubtotal.find(z => z.CategoriaId == xCat.CategoriaId).SubtotalCateg += xCatDev.Importe;

            subTotalDia.filter((z: { Fecha: Date, Importe: number }) =>
              z.Importe > 0).find((x: { Fecha: Date, Importe: number }) =>
                x.Fecha.toDateString() == xCatDev.Fecha.toDateString()).Importe += xCatDev.Importe;
          } else {
            informeVentasCategImprimir.find(x => x.Fecha.toDateString() == xCatDev.Fecha.toDateString())
              .ListCategSubtotal.push({
                CategoriaName: xCat.CategoriaName,
                FechaLinea: this.formatDateToString(xCatDev.Fecha),
                CategoriaId: xCat.CategoriaId,
                SubtotalCateg: xCatDev.Importe
              });
            subTotalDia.filter((z: { Fecha: Date, Importe: number }) =>
              z.Importe > 0).find((x: { Fecha: Date, Importe: number }) =>
                x.Fecha.toDateString() == xCatDev.Fecha.toDateString()).Importe += xCatDev.Importe;
          }
        } else {
          informeVentasCategImprimir.push({
            Fecha: xCatDev.Fecha,
            TotalDiaList: xCatDev.Importe,
            ListCategSubtotal: [{
              CategoriaName: xCat.CategoriaName,
              FechaLinea: this.formatDateToString(xCatDev.Fecha),
              CategoriaId: xCat.CategoriaId, SubtotalCateg: xCatDev.Importe
            }]
          });
          if (xCatDev.Importe > 0) {
            subTotalDia.push({
              Fecha: xCatDev.Fecha,
              Importe: xCatDev.Importe
            });
          }
        }
      });
    });

    subTotalDia.forEach((x: { Fecha: Date, Importe: number }) => {
      if (x.Importe > 0) {
        informeVentasCategImprimir.find(z => z.Fecha.toDateString() == x.Fecha.toDateString()).TotalDiaList = x.Importe;
      }
    });

    informeVentasCategImprimir.forEach(x => {
      informeVentasCategImprimirFin.push({
        Fecha: this.formatDateToString(x.Fecha),
        ListCategSubtotal: x.ListCategSubtotal,
        TotalDiaList: x.TotalDiaList
      });
    });

    return informeVentasCategImprimirFin;
  }

  public static formatInformeVentastoPrint(listaAPintarCategorias: InformeVentasResumen[]): any[] {
    const informeVentasImprimir: any = [];

    listaAPintarCategorias.forEach(x => {
      informeVentasImprimir.push({
        Fecha: this.formatDateToString(x.Fecha),
        Carburante: x.Carburante,
        FechaComparar: x.FechaComparar,
        Tienda: x.Tienda,
        Servicios: x.Servicios,
        TotalDia: x.TotalDia
      });
    });

    return informeVentasImprimir;
  }

  public static formatInformeRecaudaciontoPrint(listaAPintarCategorias: InformeVentasRecaudacion[]): InformeVentasRecaudacionPrint[] {
    const informeVentasImprimir: InformeVentasRecaudacionPrint[] = [];
    let totaldia: number = 0;
    let totaldiaRec: number = 0;

    listaAPintarCategorias.forEach(x => {
      totaldia = x.ListaMedios.reduce(function (accumulator, line) {
        return accumulator + line.Importe;
      }, 0);
      totaldiaRec += x.ListaMedios.reduce(function (accumulator, line) {
        return accumulator + line.Importe;
      }, 0);
      informeVentasImprimir.push({
        Fecha: this.formatDateToString(x.Fecha),
        ListaMedios: x.ListaMedios,
        TotalDiaRecaudacion: totaldia
      });
    });

    this.prototype.SubTotalInformeRecaudacion = totaldiaRec;

    return informeVentasImprimir;
  }
}
