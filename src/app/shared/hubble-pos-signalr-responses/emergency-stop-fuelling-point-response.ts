import { EmergencyStopFuellingPointStatus } from 'app/shared/hubble-pos-signalr-responses/emergency-stop-fuelling-point-status.enum';

export interface EmergencyStopFuellingPointResponse {
    status: EmergencyStopFuellingPointStatus;
    message: string;
}
