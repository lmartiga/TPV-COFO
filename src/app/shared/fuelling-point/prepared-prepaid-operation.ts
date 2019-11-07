export interface PreparedPrepaidOperation {
    gradeId: number;
    fuelingPointId: number;
    productReference: string;
    unitaryPricePreDiscount: number;
    correspondingVolume: number;
    discountPercentage: number;
    discountedAmount: number;
    finalAmount: number;
    taxPercentage: number;
    typeArticle?: string;
    isConsigna?: boolean;
}
