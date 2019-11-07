import {
    PrepareFuellingPointForPostpaidOperationStatus
} from 'app/shared/hubble-pos-signalr-responses/prepare-fuelling-point-for-postpaid-operation-status.enum';

export interface PrepareFuellingPointForPostpaidOperationResponse {
    status: PrepareFuellingPointForPostpaidOperationStatus;
    message: string;
}
