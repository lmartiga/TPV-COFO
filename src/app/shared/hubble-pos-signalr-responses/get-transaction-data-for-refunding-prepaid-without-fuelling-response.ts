import { SeriesType } from 'app/shared/series/series-type';
import {
    GetTransactionDataForRefundingPrepaidWithoutFuellingStatus
} from 'app/shared/hubble-pos-signalr-responses/get-transaction-data-for-refunding-prepaid-without-fuelling-status.enum';


export interface GetTransactionDataForRefundingPrepaidWithoutFuellingResponse {
    status: GetTransactionDataForRefundingPrepaidWithoutFuellingStatus;
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
    isConsigna: boolean;
    typeArticle: string;
}
