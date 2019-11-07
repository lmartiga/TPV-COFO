import { Operator } from 'app/shared/operator/operator';
import { DocumentLine } from 'app/shared/document/document-line';
import { Customer } from 'app/shared/customer/customer';
import { Series } from 'app/shared/series/series';
import { PaymentDetail } from 'app/shared/payments/payment-detail';
import { LoyaltyAttributionInformation } from 'app/shared/loyalty/loyalty-attribution-information';
import { IDictionaryStringKey } from 'app/shared/idictionary';
import { DocumentLineTax } from './document-line-tax';

export interface Document {
  lines: Array<DocumentLine>;
  taxableAmountList?: Array<DocumentLineTax>;
  totalAmountWithTax: number;
  operator: Operator;
  customer: Customer;
  showAlertInsertOperator?: boolean;
  showAlertInsertCustomer?: boolean;
  usedDefaultOperator?: boolean;
  documentId?: string;
  documentNumber?: string;
  provisionalId?: number;
  referencedProvisionalIdList?: Array<number>;
  referencedDocumentIdList?: Array<string>;
  referencedDocumentNumberList?: Array<string>;
  series: Series;
  paymentDetails?: Array<PaymentDetail>;
  emissionLocalDateTime?: Date;
  emissionUTCDateTime?: Date;
  kilometers?: number;
  currencyId?: string;
  discountPercentage?: number;
  discountAmountWithTax?: number;
  totalTaxableAmount?: number;
  totalTaxAmount?: number;
  taxableAmount?: number;
  totalTaxList?: IDictionaryStringKey<number>;
  extraData?: IDictionaryStringKey<string>;
  changeDelivered?: number;
  pendingAmountWithTax?: number; // para tickets con importe pendiente
  loyaltyAttributionInfo?: LoyaltyAttributionInformation;
  isatend?: string;
  subTotal?: number;
  /**
   *  Matricula habitual.
   * (ej: la asociada a Tarjeta Flota).
   *  Null en caso contrario
   */
  plate?: string;
  contactId?: string;
  Nfactura?: string;
  NAnulacionFactura?: string;

  /**
   * indica si el documento esta bloqueado
   * (ej: previene insercion de lineas)
   */
  isLocked?: boolean;

  cambio?: number;

  isRunAway?: boolean;
  isDeuda?: boolean;
  isCobro?: boolean;
  ticketFactura?: boolean;
  bloqClient?: boolean;
  isAnull?: boolean;
  isCopia?: boolean;
  posId: string;
  BarcodeStatus?: boolean;
  isPrinted?: boolean;
}
