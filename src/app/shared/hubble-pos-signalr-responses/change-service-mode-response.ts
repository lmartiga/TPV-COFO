import { ChangeServiceModeStatus } from 'app/shared/hubble-pos-signalr-responses/change-service-mode-status.enum';

export interface ChangeServiceModeResponse {
    status: ChangeServiceModeStatus;
    message: string;
    specificMessage: string;
}
