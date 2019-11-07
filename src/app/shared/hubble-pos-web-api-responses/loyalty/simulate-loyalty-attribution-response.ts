import {
  LoyaltyAttributionSimulationDetails
} from 'app/shared/loyalty/loyalty-attribution-simulation-details';
import {
  SimulateLoyaltyAttributionResponseStatuses
} from './simulate-loyalty-attribution-response-statuses.enum' ;

export interface SimulateLoyaltyAttributionResponse {
  status: SimulateLoyaltyAttributionResponseStatuses;
  message: string;
  loyaltyAttributionDetailsList: LoyaltyAttributionSimulationDetails[];
}
