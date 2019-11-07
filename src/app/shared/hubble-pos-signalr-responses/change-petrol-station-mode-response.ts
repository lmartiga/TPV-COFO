import { ChangePetrolStationModeStatus } from 'app/shared/hubble-pos-signalr-responses/change-petrol-station-mode-status.enum';

export interface ChangePetrolStationModeResponse {
    status: ChangePetrolStationModeStatus;
    message: string;
}
