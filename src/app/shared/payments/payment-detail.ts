import { PaymentMethod } from 'app/shared/payments/payment-method';
import { IDictionaryStringKey } from 'app/shared/idictionary';
export interface PaymentDetail {
    paymentMethodId: string;
    paymentDateTime: Date;
    currencyId: string;
    changeFactorFromBase: number;
    primaryCurrencyGivenAmount: number;
    primaryCurrencyTakenAmount: number;
    secondaryCurrencyGivenAmount?: number;
    secondaryCurrencyTakenAmount?: number;
    method?: PaymentMethod;
    extraData?: IDictionaryStringKey<string>;
  }
