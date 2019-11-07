import {
  GetFuellingTankByFuellingPointIdAndGradeReferenceStatuses
} from 'app/shared/web-api-responses/get-fuelling-tank-by-fuelling-point-id-and-grade-reference-statuses.enum';
import { FuellingTank } from 'app/shared/fuelling-point/fuelling-tank';

export interface GetFuellingTankByFuellingPointIdAndGradeReferenceResponse {
  status: GetFuellingTankByFuellingPointIdAndGradeReferenceStatuses;
  message: string;

  fuellingTank: FuellingTank;
}
