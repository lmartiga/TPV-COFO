import {
  GetFuellingTanksResponseStatuses
} from 'app/shared/web-api-responses/get-fuelling-tanks-statuses.enum';
import { FuellingTank } from 'app/shared/fuelling-point/fuelling-tank';

export interface GetFuellingTanksResponse {
  status: GetFuellingTanksResponseStatuses;
  message: string;

  availableFuellingTanks: FuellingTank[];
}
