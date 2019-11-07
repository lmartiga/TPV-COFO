import { ChangeServiceModeStatus } from 'app/shared/hubble-pos-signalr-responses/change-service-mode-status.enum';

export interface ChangeSalePrepayOtherFuellingPointResponse {
    status: ChangeServiceModeStatus;
    message: string;
}
