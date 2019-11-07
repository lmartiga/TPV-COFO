import { FuellingPointsService } from 'app/services/fuelling-points/fuelling-points.service';
import { HubbleDocumentLine } from 'app/shared/hubble-document-line';

export interface FuellingPointPrepaidLineData {
    fpSvc: FuellingPointsService;
    lineDetail: HubbleDocumentLine;
    idFuellingPoint: number;
}
