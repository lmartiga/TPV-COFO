import {
    SetDefinitiveDocumentIdForPrepaidOperationsStatus
} from 'app/shared/hubble-pos-signalr-responses/set-definitive-document-id-for-prepaid-operations-status.enum';

export interface SetDefinitiveDocumentIdForPrepaidOperationsResponse {
    message: string;
    status: SetDefinitiveDocumentIdForPrepaidOperationsStatus;
}
