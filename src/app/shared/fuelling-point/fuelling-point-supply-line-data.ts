import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';
import { FuellingPointsService } from 'app/services/fuelling-points/fuelling-points.service';

export interface FuellingPointSupplyLineData {
    supplyTransaction: SuplyTransaction;
    fpSvc: FuellingPointsService;
    lineNumberInDocument: number;
    contactId?: string;
    vehicleLicensePlate?: string;
    odometerMeasurement?: number;
}
