import { PaymentMethodType } from 'app/shared/payments/payment-method-type.enum';
import { CurrencyPriorityType } from 'app/shared/currency/currency-priority-type.enum';
export interface PaymentMethod {
  id: string; // id
  description: string; // general description
  panelDescription?: string; // description for UI Panel paymentMethods
  numberOfCopiesToPrint: string;
  type: PaymentMethodType; // type (cash, card...),
  paraTPV: boolean; // mostrar o no en el panel de pago mixto
  currencyType?: CurrencyPriorityType; // divisa (base, secondary, other)
}
