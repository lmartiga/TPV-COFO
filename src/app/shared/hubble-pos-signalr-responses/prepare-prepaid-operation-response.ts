import { PreparePrepaidOperationStatus } from 'app/shared/hubble-pos-signalr-responses/prepare-prepaid-operation-status.enum';

export interface PreparePrepaidOperationResponse {
    status: PreparePrepaidOperationStatus;
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
