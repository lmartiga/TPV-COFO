import { LockSupplyTransactionStatus } from 'app/shared/hubble-pos-signalr-responses/lock-supply-transaction-status.enum';

export interface LockSupplyTransactionResponse {
    status: LockSupplyTransactionStatus;
    message: string;
    productReference: string;
    productName: string;
    unitaryPricePreDiscount: number;
    correspondingVolume: number;
    discountPercentage: number;
    discountedAmount: number;
    finalAmount: number;
    taxPercentage: number;
    typeArticle?: string;
    isConsigna?: boolean;

}
