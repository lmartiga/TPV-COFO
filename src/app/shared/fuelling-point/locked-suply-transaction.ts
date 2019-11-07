import { SeriesType } from 'app/shared/series/series-type';

export interface LockedSuplyTransaction {
    productId: string;
    productName: string;
    unitaryPricePreDiscount: number;
    correspondingVolume: number;
    discountPercentage: number;
    discountedAmount: number;
    finalAmount: number;
    taxPercentage: number;
    customerId?: string;
    serieType?: SeriesType;
    sourceDocumentId?: string;
    typeArticle?: string;
    sourceDocumentNumber?: string;
    isConsigna?: boolean;
}
