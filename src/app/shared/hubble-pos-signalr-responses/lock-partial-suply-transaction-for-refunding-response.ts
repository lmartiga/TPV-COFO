import {
    LockPartialSuplyTransactionForRefundingStatus
} from 'app/shared/hubble-pos-signalr-responses/lock-partial-suply-transaction-for-refunding-status.enum';
import { SeriesType } from 'app/shared/series/series-type';


export interface LockPartialSuplyTransactionForRefundingResponse {
    status: LockPartialSuplyTransactionForRefundingStatus;
    message: string;
    productId: string;
    productName: string;
    unitaryPricePreDiscount: number;
    correspondingVolume: number;
    discountPercentage: number;
    discountedAmount: number;
    finalAmount: number;
    taxPercentage: number;
    sourceDocumentId: string;
    sourceDocumentNumber: string;
    sourceDocumentLine: number;
    customerId: string;
    serieType: SeriesType;
    typeArticle?: string;
    isConsigna?: boolean;
}
