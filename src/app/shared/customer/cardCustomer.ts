import { CustomerDocumentType } from './customer-document-type.enum';

export interface CardCustomer {

  /**
   * @description Matricula
   * @type {string}
   * @memberof Customer
   */
  plate?: string;

  /**
   * @description Saldo
   * @type {number}
   * @memberof Customer
   */
  balance?: number;

  /**
  *
  * @description Moneda
  * @type {string}
  * @memberof Customer
  */
  balanceCurrencyId?: string;

  /**
   * @description distancia en KM
   * @type {number}
   * @memberof Customer
   */
  drivenDistance?: number;

  /**
   * @description Nombre y Apellidos del conductor
   * @type {string}
   * @memberof Customer
   */
  driverName?: string;

  /**
   *
   * @description Número identificador de la tarjeta del contacto Cliente, NContactCli
   * @type {string}
   * @memberof Customer
   */
  contactId?: string;
  /**
   *
   * @description Tipo de documento a imprimir
   * @type {CustomerDocumentType}
   * @memberof CardCustomer
   */
  documentTypeId?: CustomerDocumentType;

  /**
   * @description es un cliente de flota ?
   * @type {boolean}
   * @memberof Customer
   */
  isFleet?: boolean;
}
