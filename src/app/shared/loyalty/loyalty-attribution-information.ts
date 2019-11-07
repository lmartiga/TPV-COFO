import { LoyaltyActionType } from 'app/shared/loyalty/loyalty-action-type.enum';

export interface LoyaltyAttributionInformation {
  actionType: LoyaltyActionType;
  cardNumber: string;
  benefitId: number;
  benefitName: string;
  currencyId: string;
  benefitAmount: number;
  localDateTime: Date;
  documentTotalAmount: number;
  amountToRedeem?: number;
}
