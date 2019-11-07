import {
  ProcessLoyaltyAttributionAndRedeemBenefitResponseStatuses
} from './process-loyalty-attribution-and-redeem-benefit-response-statuses.enum';

export interface ProcessLoyaltyAttributionAndRedeemBenefitResponse {

  status: ProcessLoyaltyAttributionAndRedeemBenefitResponseStatuses;
  message: string;

  benefitId: number;
  benefitName: string;
  benefitDescription: string;
  balanceBefore: number;
  balanceAfter: number;
  attributionOperationId: number;
  redemptionOperationId: number;
}
