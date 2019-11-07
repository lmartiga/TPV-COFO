import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';

export interface FuellingPointTransactionCountChangedArgs {
    fuellingPointId: number;
    transactionCount: number;
    listSupplyTransaction?: SuplyTransaction[];
}
