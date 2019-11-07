import { CancelEmergencyStopStatus } from 'app/shared/hubble-pos-signalr-responses/cancel-emergency-stop-status.enum';

export interface CancelEmergencyStopResponse {
    status: CancelEmergencyStopStatus;
    message: string;
}
