import { UnlockSupplyTransactionStatus } from 'app/shared/hubble-pos-signalr-responses/unlock-supply-transaction-status.enum';

export interface UnlockSupplyTransactionResponse {
    status: UnlockSupplyTransactionStatus;
    message: string;
}
