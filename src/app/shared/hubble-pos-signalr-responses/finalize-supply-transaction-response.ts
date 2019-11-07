import { FinalizeSupplyTransactionStatus } from 'app/shared/hubble-pos-signalr-responses/finalize-supply-transaction-status.enum';
import { IDictionaryStringKey } from '../idictionary';

export interface FinalizeSupplyTransactionResponse {
    provisionalSupplyIdToDefinitiveSupplyIdMapping: IDictionaryStringKey<string>;
    status: FinalizeSupplyTransactionStatus;
    message: string;
}
