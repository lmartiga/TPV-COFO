import { DocumentLine } from 'app/shared/document/document-line';
import { PaymentDetail } from 'app/shared/payments/payment-detail';
import { IbusinessSpecificLine } from 'app/shared/ibusiness-specific-line';
import { isNumber } from 'util';

export class GenericHelper {


  // Proporciona una lista de anchos de columna deacuerdo a una propuesta de organización de botones (X botones por filas de ancho Y)
  public static generateButtonColumnWidthsList(totalWidth: number, itemsPerRow: number, totalItems: number): string[] {
    const result: string[] = [];
    const itemsInLastRow: number = totalItems % itemsPerRow;
    const widthInLastRow: string = Math.ceil(totalWidth / itemsInLastRow).toString();
    const itemsInFullRow: number = totalItems - itemsInLastRow;
    const widthInFullRow: string = Math.ceil(totalWidth / itemsPerRow).toString();

    for (let i = 0; i < itemsInFullRow; i++) {
      result.push(widthInFullRow);
    }
    for (let i = 0; i < itemsInLastRow; i++) {
      result.push(widthInLastRow);
    }

    return result;
  }

  // TODO: Se deja de momento, pero cambiando el decimalPipe por el
  // nuevo pipe nuestro RoundPipe esto ya no haría falta
  // a no ser de que se emplee en la UI en un futuro
  // este formato solo era para emplear decimal Pipe
  public static formatPipeTransformDigitsFromDecimalPositions(decimalPositions: number): string {
    return '1.' + decimalPositions + '-' + decimalPositions;
  }

  public static getQueryStringValue(key: string, url: string): string {
    return decodeURIComponent(
      url.replace(new RegExp('^(?:.*[&\\?]' +
        encodeURIComponent(key).replace(/[\.\+\*]/g, '\\$&') +
        '(?:\\=([^&]*))?)?.*$', 'i'), '$1')
    );
  }
  /**
   * @description Devuelve los estilos necesarios en función del procentage
   * del ancho del componente
   * @static
   * @param {number} widthPercentage
   * @returns {string}
   * @memberof GenericHelper
   */
  public static getStylesConfigByWidthPrecentage(widthPercentage: number): string {
    const bigScreenColSize = (widthPercentage / 100 * 12).toFixed(0);
    const smallScreenColSize = (widthPercentage / 100 * 18).toFixed(0);
    let styles: string;
    styles += `col-lg-${bigScreenColSize} col-md-${bigScreenColSize} col-sm-${smallScreenColSize} col-xs-12`;
    return styles;
  }

  /**
   * Hace una copia del objeto de manera recursiva
   *
   * @static
   * @param {*} objectToCopy
   * @returns {*}
   * @memberof GenericHelper
   */
  public static deepCopy(objectToCopy: any): any {
    let copy: any;

    // Handle the 3 simple types, and null or undefined
    if (objectToCopy == undefined || typeof objectToCopy != 'object') {
      return objectToCopy;
    }

    // no duplicamos esta estructura, puede provocar overflow
    if (objectToCopy instanceof IbusinessSpecificLine) {
      return undefined;
    }
    // Handle Date
    if (objectToCopy instanceof Date) {
      copy = new Date();
      copy.setTime(objectToCopy.getTime());
      return copy;
    }

    // Handle Array
    if (objectToCopy instanceof Array) {
      copy = [];
      for (let i = 0, len = objectToCopy.length; i < len; i++) {
        copy[i] = this.deepCopy(objectToCopy[i]);
      }
      return copy;
    }

    // Handle Object
    if (objectToCopy instanceof Object) {
      copy = {};
      for (const attr in objectToCopy) {
        if (objectToCopy.hasOwnProperty(attr)) {
          copy[attr] = this.deepCopy(objectToCopy[attr]);
        }
      }
      return copy;
    }
  }

  /**
    *
    * @description valida si el código de barras es valido o no
    * @static
    * @param {string} barcode
    * @returns {boolean}
    * @memberof GenericHelper
    */
  public static isValidBarcode(barcode: string): boolean {
    // check length
    if (barcode.length != 8 && barcode.length != 13 &&
      barcode.length != 14 && barcode.length != 18) {
      return false;
    }

    const lastDigit = Number(barcode.substring(barcode.length - 1));
    if (isNaN(lastDigit) || !isNumber(lastDigit)) { return false; } // not a valid upc/ean

    let checkSum = 0;
    let total = 0;
    const arr = barcode.substring(0, barcode.length - 1).split('').reverse();

    for (let i = 0; i < arr.length; i++) {
      if (isNaN(Number(arr[i]))) { return false; } // can't be a valid upc/ean we're checking for

      if (i % 2 == 0) { total += Number(arr[i]) * 3; }
      else { total += Number(arr[i]); }
    }
    checkSum = (10 - (total % 10)) % 10;

    // true if they are equal
    return checkSum == lastDigit;
  }

  public static _hasMoreOnePrepaid(lines: Array<DocumentLine>): Boolean {
    let numContador: number = 0;

    for (let index = 0; index < lines.length; index++) {
      if (lines[index].businessSpecificLineInfo !== undefined) {
        if (lines[index].businessSpecificLineInfo.supplyTransaction === undefined) {
          numContador++;
          if (numContador === 2) {
            return true;
          }
        }
      }
    }
    return false;
  }

  public static _hasTelecorProducts(lines: Array<DocumentLine>): Boolean {
    let respuesta: boolean = false;
    lines = lines.filter(line => line.isRemoved !== false);
    for (let index = 0; index < lines.length; index++) {
      if (lines[index].quantity > 0 &&
        lines[index].typeArticle.substring(5) === 'TIEN' &&
        (lines[index].description.toLowerCase().includes('recarga') ||
          lines[index].description.toLowerCase().includes('paysafecard'))) {
        respuesta = true;
        break;
      }
    }
    return respuesta;
  }

  public static _numberLinePrepaid(lines: Array<DocumentLine>): number {
    let numLine: number = 0;
    for (let index = 0; index < lines.length; index++) {
      if (!lines[index].businessSpecificLineInfo === undefined) {
        if (!lines[index].businessSpecificLineInfo.supplyTransaction === undefined) {
          numLine = index;
        }
      }
    }
    return numLine;
  }

  public static _hasPaymentId(payments: Array<PaymentDetail>, idCard: string): boolean {
    let bolResponse: boolean = false;

    for (let index = 0; index < payments.length; index++) {
      if (payments[index].paymentMethodId === idCard) {
        bolResponse = true;
        break;
      }
    }
    return bolResponse;
  }

  public static _fnLocationKeyboard() {
    setTimeout(function () {
      const tamKeyboard = jQuery(window).width() - jQuery('tpv-fuelling-points-root').width();
      if (jQuery(window).width() <= 800) {
        jQuery('.virtual-keyboard').css('left', 0 + 'px');
        jQuery('.virtual-keyboard').width('auto');
      } else {
        jQuery('.virtual-keyboard').css('left', jQuery('tpv-fuelling-points-root').width() + 'px');
        jQuery('.virtual-keyboard').width(tamKeyboard);
      }

      /*
      const str1 = jQuery('.virtual-keyboard').css('top').split('px');
      const posVertical: number = Number(str1[0]);
      if (posVertical > jQuery(window).height() - jQuery('.virtual-keyboard').height() - 28) {*/
      jQuery('.virtual-keyboard').css('top', jQuery(window).height() - jQuery('.virtual-keyboard').height() - 28 + 'px');
      /* }*/
    }, 10);
  }

  public static _fnResizeWidthStatusBar() {
    let lastWithElement: number = 0;
    // Se agrega el intervalo, por si el elemento sea altareado despues de ser dibujado
    const intervalEllipse = setInterval(() => {
      // Obtiene el tamaño del delemento cada 0.1 segundos
      const withFooter = jQuery('.status-message').css('width').replace('px', '');
      // Si el tamaño del elemento es diferente al del anterior intervalo
      // entonces se modifica el tamaño del texto a mostrar
      if (lastWithElement != +withFooter) {
        lastWithElement = +withFooter;
        jQuery('.status-message-ellipse').css('width', lastWithElement * 0.75);
      }
    }, 100);
    // Despues de 5seg limpia el intervalo
    setTimeout(() => {
      clearInterval(intervalEllipse);
    }, 5000);
  }


  public static ToStringWithDecimals(amount: number): string {
    console.log('El numero es entero: ' + Number.isInteger(amount));
    let output = amount.toString();
    if (!(output.includes('.') || output.includes(','))) {
      output = output.concat(',00');
    }
    return output;
  }
}
