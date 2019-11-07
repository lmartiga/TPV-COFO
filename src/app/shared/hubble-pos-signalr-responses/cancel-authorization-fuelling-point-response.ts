import { CancelAuthorizationFuellingPointStatus } from './cancel-authorization-fuelling-point-status.enum';

export interface CancelAuthorizationFuellingPointResponse {
    status: CancelAuthorizationFuellingPointStatus;
    message: string;
}
