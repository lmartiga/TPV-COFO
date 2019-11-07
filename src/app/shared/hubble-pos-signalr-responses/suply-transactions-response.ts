import { SuplyTransactionsStatuses } from 'app/shared/hubble-pos-signalr-responses/suply-transactions-statuses.enum';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';

export interface SuplyTransactionsResponse {
    status: SuplyTransactionsStatuses;
    message: string;
    supplyTransactionList: Array<SuplyTransaction>;
}
