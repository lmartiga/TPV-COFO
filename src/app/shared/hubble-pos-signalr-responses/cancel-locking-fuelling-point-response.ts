import { CancelLockingFuellingPointStatus } from 'app/shared/hubble-pos-signalr-responses/cancel-locking-fuelling-point-status.enum';

export interface CancelLockingFuellingPointResponse {
    status: CancelLockingFuellingPointStatus;
    message: string;
}
