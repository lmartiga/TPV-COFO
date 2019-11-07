import {
    FinalizeSupplyTransactionForFuelTestResponseStatus
} from 'app/shared/hubble-pos-signalr-responses/finalize-supply-transaction-for-fuel-test-response-status.enum';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';

export interface GetSupplyTransactionOfFuellingPointResponse {
    supplyTransaction: SuplyTransaction;
    status: FinalizeSupplyTransactionForFuelTestResponseStatus;
    message: string;
}
