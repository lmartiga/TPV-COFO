import { Company } from 'app/shared/company';
import { Currency } from 'app/shared/currency/currency';
import { Operator } from 'app/shared/operator/operator';
import { PaymentMethod } from 'app/shared/payments/payment-method';
import { Shop } from 'app/shared/shop';
import { UsecasePrintingConfiguration } from 'app/shared/printing/usecase-printing-configuration';
import { IDictionaryStringKey } from 'app/shared/idictionary';
import { Posinformation } from 'app/shared/posinformation';
import { CashboxRecordTypeOffline } from '../shared/shared-cierre-diferido/cashbox-record-offline-type.enum';
import { CashboxRecordReasonOff } from '../shared/shared-cierre-diferido/cashbox-record-off-Reason';
import { CashboxRecordDataOffline } from '../shared/shared-cierre-diferido/cashbox-record-offline-data';
import { CashboxClosureSummaryOffline } from '../shared/shared-cierre-diferido/cashbox-closure-offline-summary';
/*import { FuelSales } from '../shared/shared-cierre-diferido/fuel-sales';
import { EfectivoCajaFuerte } from '../shared/shared-cierre-diferido/efectivo-caja-fuerte';
import { ResumenRecaudacion } from '../shared/shared-cierre-diferido/resumen-recaudacion';
import { VentasPorCategorias } from '../shared/shared-cierre-diferido/ventas-por-categorias';
import { EntradasCajon } from '../shared/shared-cierre-diferido/entradas-cajon'; */

export class FormatHelperCierre {

  // Cierre de caja
  /////////////////////
  public static formatToCashboxClosureInfoServiceExpectedObject(
    operador: Operator,
    metalicoReal: number,
    metalicoCierre: number,
    currentLocalDate: Date
  ): any {
    return {
      operador: operador != undefined ? operador.id : 0,
      metalicoReal: FormatHelperCierre.formatNumber(metalicoReal),
      metalicoCierre: FormatHelperCierre.formatNumber(metalicoCierre),
      fecha: FormatHelperCierre.dateToISOString(currentLocalDate),
      fechaSubida: currentLocalDate != undefined ? currentLocalDate : undefined,
      /* requestUTCDateTime: FormatHelperCierre.dateToISOString(FormatHelperCierre.formatToUTCDateFromLocalDate(currentLocalDate)) */
    };
  }
  /* IMPRESION CIERRE DIFERIDO */
  static formatClosureOfflineToPrintingModuleHubExpectedObject(
    operador: Operator,
    /* currencySymbol: Currency, */
    /*posInformation: Posinformation, */
    cashboxClosureOff: CashboxClosureSummaryOffline,
    tpv: string
    /* company: Company,
    shop: Shop, */
    /* currentLocalDate: Date, */

    /* fuelSales: FuelSales[],
    efectivoCajaFuerte: EfectivoCajaFuerte[],
    ventasPorCategorias: VentasPorCategorias[],
    resumenRecaudacion: ResumenRecaudacion[],
    /* DatosCabecera { get; set; } */
    /* entradasCajon: EntradasCajon[], */

  ): any {
    return {
      operadorName: operador.name == undefined ? '' : operador.name,
      operador: cashboxClosureOff.operatorCode == undefined ? '' : cashboxClosureOff.operatorCode,
      /* operadorId: operador.id,
      operadorCode: operador.name, */
      company: cashboxClosureOff.companyCode == undefined ? '' : cashboxClosureOff.companyCode,
      /* operadorName: cashboxClosureOff.operatorCode == undefined ? '' : cashboxClosureOff.operatorCode, */
      idCaja: cashboxClosureOff.cashboxCode == undefined ? '' : cashboxClosureOff.cashboxCode,
      currencySymbol: cashboxClosureOff.currencySymbol == undefined ? '' : cashboxClosureOff.currencySymbol,
      /*RANGO FECHAS */
      emissionLocalDateTime: cashboxClosureOff.creationLocalDateTime == undefined ? '' : cashboxClosureOff.creationLocalDateTime,

      /* -- */
      totalEfectivoCajaFuerte: cashboxClosureOff.totalEfectivoCajaFuerte == undefined ? '' : cashboxClosureOff.totalEfectivoCajaFuerte,
      totalEntradasCajon: cashboxClosureOff.totalEntradasCajon == undefined ? '' : cashboxClosureOff.totalEntradasCajon,
      totalCategorias: cashboxClosureOff.totalCategorias == undefined ? '' : cashboxClosureOff.totalCategorias,
      totalCategoriasVentas: cashboxClosureOff.totalCategoriasVentas == undefined ? '' : cashboxClosureOff.totalCategoriasVentas,
      totalCombustible: cashboxClosureOff.totalCombustible == undefined ? '' : cashboxClosureOff.totalCombustible,
      totalResumenRecaudacion: cashboxClosureOff.totalResumenRecaudacion == undefined ? '' : cashboxClosureOff.totalResumenRecaudacion,
      diferencia: cashboxClosureOff.diferencia == undefined ? '' : cashboxClosureOff.diferencia,
      importeTotalEntrasCajon: cashboxClosureOff.importeTotalEntrasCajon == undefined ? '' : cashboxClosureOff.importeTotalEntrasCajon,
      importeTotalSalidaCajon: cashboxClosureOff.importeTotalSalidaCajon == undefined ? '' : cashboxClosureOff.importeTotalSalidaCajon,
      importeTotalOtrasEntradas: cashboxClosureOff.importeTotalOtrasEntradas == undefined ? '' : cashboxClosureOff.importeTotalOtrasEntradas,
      totalSalidaOnce: cashboxClosureOff.totalSalidaOnce == undefined ? '' : cashboxClosureOff.totalSalidaOnce,
      totalCobrosProveedor: cashboxClosureOff.totalCobrosProveedor == undefined ? '' : cashboxClosureOff.totalCobrosProveedor,
      totalPagosProveedor: cashboxClosureOff.totalPagosProveedor == undefined ? '' : cashboxClosureOff.totalPagosProveedor,
      totalResumenOtrosRetiros: cashboxClosureOff.totalResumenOtrosRetiros == undefined ? '' : cashboxClosureOff.totalResumenOtrosRetiros,
      recaudacion: cashboxClosureOff.recaudacion == undefined ? '' : cashboxClosureOff.recaudacion,
      efectivoUltimoCierreDiferido: cashboxClosureOff.efectivoUltimoCierreDiferido == undefined ? '' : cashboxClosureOff.efectivoUltimoCierreDiferido,

      entradasCajon: cashboxClosureOff.entradasCajon == undefined ? '' : cashboxClosureOff.entradasCajon,
      efectivoCajaFuerte: cashboxClosureOff.efectivoCajaFuerte == undefined ? '' : cashboxClosureOff.efectivoCajaFuerte,
      resumenRecaudacion: cashboxClosureOff.resumenRecaudacion == undefined ? '' : cashboxClosureOff.resumenRecaudacion,
      fuelSales: cashboxClosureOff.fuelSales == undefined ? '' : cashboxClosureOff.fuelSales,
      ventasPorCategorias: cashboxClosureOff.ventasPorCategorias == undefined ? '' : cashboxClosureOff.ventasPorCategorias,
      posId: tpv
    };
  }

   // Entrada-salida de caja OFFLINE
  /////////////////////
  public static formatTocreateCashboxRecordOnlineServiceExpectedObject(
    /* let operadorId: Operator; */
    operadorName: Operator,
    /* let id: number; */
    idCaja: string,
    /* let nanotacion: number; */
    tanotacion: CashboxRecordTypeOffline,
    fecha: Date,
    importe: number,
    medio: PaymentMethod,
    descripcion: string,
    /* let ndocumento: string;
    let tdocumento: string;
    let divisa: Currency;
    let contabilizado: boolean; */
    tapunte: CashboxRecordReasonOff,
    /* let ndocumento_pro: string;
    let ntraspaso: string;
    let cierre: string;
    let porgasto: number;
    let nbalance: string; */
    tienda: string,
    /*change_Currency: number;
    /*let totalChange: number;*/
    fechaNegocio: Date,
    online: boolean,
  ): any {
    return {
      /* operadorId: operadorId != undefined ? operadorId.id : 0, */
      operadorName: operadorName != undefined ? operadorName.name : 0,
      /* id: id, */
      idCaja: idCaja,
      /* nanotacion: nanotacion, */
      tanotacion: tanotacion,
      fecha: FormatHelperCierre.dateToISOString(fecha),
      importe: FormatHelperCierre.formatNumber(importe),
      medio: medio.id,
      descripcion: descripcion,
      /* ndocumento: ndocumento, */
      /* tdocumento: tdocumento, */
     /*  divisa: divisa.id,
      contabilizado: contabilizado, */
      tapunte: tapunte.codigo,
      /* ndocumento_pro: ndocumento_pro,
      ntraspaso: ntraspaso,
      cierre: cierre,
      porgasto: porgasto,
      nbalance: nbalance, */
      tienda: tienda,
      /*changeCurrency: FormatHelperCierre.formatNumber(divisa.changeFactorFromBase), */
     /*  totalChange: totalChange, */
      fechaNegocio: fecha != undefined ? fecha : undefined,
      online: online
      /* FormatHelper.dateToISOString(FormatHelper.formatToUTCDateFromLocalDate(currentLocalDate)) */ /*borrar al pasar a nullable */
    };
  }
  // Entrada-salida de caja OFFLINE
  /////////////////////
  public static formatTocreateCashboxRecordOfflineServiceExpectedObject(
    posId: string,
    operador: Operator,
    cashboxRecordType: CashboxRecordTypeOffline,
    enteredAmount: number,
    divisa: Currency,
    medio: PaymentMethod,
    cashboxRecordReason: CashboxRecordReasonOff,
    descripcion: string,
    currentLocalDate: Date
    /*codigo: string, descripcion: string, serie: string, tienda: string */
  ): any {
    return {
      operadorId: operador != undefined ? operador.id : 0,
      tanotacion: cashboxRecordType,
      medio: medio.id,
      importe: FormatHelperCierre.formatNumber(enteredAmount),
      divisa: divisa.id,
      changeCurrency: FormatHelperCierre.formatNumber(divisa.changeFactorFromBase),
      tapunte: cashboxRecordReason.codigo,
      descripcion: descripcion,
      fecha: FormatHelperCierre.dateToISOString(currentLocalDate),
      fechaNegocio: currentLocalDate != undefined ? currentLocalDate : undefined
      /* FormatHelper.dateToISOString(FormatHelper.formatToUTCDateFromLocalDate(currentLocalDate)) */ /*borrar al pasar a nullable */
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
    tpv: string,
    ticketsMode: any
  ): any {
    const titleText: string = (
      tanotacion === CashboxRecordTypeOffline.cashEntry ? ticketsMode.entrada :
      tanotacion === CashboxRecordTypeOffline.cashOut ? ticketsMode.salida : ''
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
      emissionLocalDateTime: FormatHelperCierre.dateToISOString(currentLocalDate),
      changeCurrency: cashboxRecordData.divisa.changeFactorFromBase = cashboxRecordData.importe,
      valor: cashboxRecordData.cashboxRecordReasonOffline.valor,
      company,
      shop,
      posId: tpv
    };
  }
  // TOKENS
  /////////////////////

  public static exchangeKeysByValuesForIframeUrl(url: string, operatorId: string, customerId: String,
    posGUID: string, companyID: string, signToken: string): string {
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
        documentId: d
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
}
