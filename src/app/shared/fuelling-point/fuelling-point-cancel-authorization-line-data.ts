import { FuellingPointsService } from 'app/services/fuelling-points/fuelling-points.service';

export interface FuellingPointCancelAuthorizationLineData {
    fpSvc: FuellingPointsService;
    idFuellingPoint: number;
}

