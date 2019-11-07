import { Address } from 'app/shared/address/address';
import { CardCustomer } from 'app/shared/customer/cardCustomer';

export interface Customer {
  /**
   *
   * @description Identificador (NCompany + Code)
   * @type {string}
   * @memberof Customer
   */
  id: string;

  /**
   *
   * @description Número de identificador fiscal. (Ej: 22123456Z en el caso de un NIF).
   * @type {string}
   * @memberof Customer
   */
  tin: string;

  /**
   *
   * @description [Opcional] Identificador (NComapny + Code) del tipo de número de identificación fiscal.
   * Null si no está especificado.
   * (Ej: 027636 podría ser el identificador de tipo de TIN que indicase que es un RUC)
   * @type {string}
   * @memberof Customer
   */
  tinTypeId?: string;

  /**
   *
   * @description [Opcional], Razon Social, Null si no existe
   * @type {string}
   * @memberof Customer
   */
  businessName?: string;

  /**
   *
   * @description Lista de direcciones, Vacía si no existen
   * @type {Array<Address>}
   * @memberof Customer
   */
  addressList: Array<Address>;

  /**
   *
   * @description Credito del Cliente
   * @type {number}
   * @memberof Customer
   */
  riesgo1: number;

  /**
   *
   * @description Riesgo Alcanzado
   * @type {number}
   * @memberof Customer
   */
  riesgo2: number;


  /**
   *
   * @description [Opcional], Número de teléfono, Null si no existe
   * @type {string}
   * @memberof Customer
   */
  phoneNumber?: string;

  /**
   *
   * @description ¿Está dado de baja actualmente?
   * @type {string}
   * @memberof Customer
   */
  isDischarged?: string;

  /**
   *
   * @description Mensaje asociado al cliente
   * @type {string}
   * @memberof Customer
   */
  customerMessage?: string;

  /**
   *
   * @description Nulo si no hay TIPO_CLIENTE
   * @type {string}
   * @memberof Customer
   */
  customerType?: string;
  /**
   *
   * @description información de la tarjeta, puede ser nulo
   * @type {CardCustomer}
   * @memberof Customer
   */
  cardInformation?: CardCustomer;



  matricula?: string;


  activo?: boolean;


}
