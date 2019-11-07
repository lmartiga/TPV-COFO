import { FuellingPointAvailableActionType } from 'app/shared/fuelling-point/signalR-Response/fuelling-point-available-action-type';
import { AvailableActionsStatuses } from 'app/shared/hubble-pos-signalr-responses/available-actions-statuses.enum';

export interface AvailableActionsResponse {
    status: AvailableActionsStatuses;
    message: string;
    fuellingPointAvailableActionsList: Array<FuellingPointAvailableActionType>;
}
