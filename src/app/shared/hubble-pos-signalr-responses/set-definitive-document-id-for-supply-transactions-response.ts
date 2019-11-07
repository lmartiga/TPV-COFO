import {
    SetDefinitiveDocumentIdForSupplyTransactionsStatus
} from 'app/shared/hubble-pos-signalr-responses/set-definitive-document-id-for-supply-transactions-status.enum';

export interface SetDefinitiveDocumentIdForSupplyTransactionsResponse {
    message: string;
    status: SetDefinitiveDocumentIdForSupplyTransactionsStatus;
}
