import {
    FinalizeSupplyTransactionPartialPrepaidStatus
} from 'app/shared/hubble-pos-signalr-responses/finalize-supply-transaction-partial-prepaid-status.enum';

export interface FinalizeSupplyTransactionPartialPrepaidResponse {
    status: FinalizeSupplyTransactionPartialPrepaidStatus;
    message: string;
}
