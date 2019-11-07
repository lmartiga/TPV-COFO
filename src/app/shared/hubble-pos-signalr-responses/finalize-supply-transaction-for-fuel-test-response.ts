import {
    FinalizeSupplyTransactionForFuelTestResponseStatus
} from 'app/shared/hubble-pos-signalr-responses/finalize-supply-transaction-for-fuel-test-response-status.enum';

export interface FinalizeSupplyTransactionForFuelTestResponse {
    status: FinalizeSupplyTransactionForFuelTestResponseStatus;
    message: string;
}
