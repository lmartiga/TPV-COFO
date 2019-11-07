export interface DocumentLinePromotion {
    promotionId: string;
    description: string;
    discountAmountWithTax: number;    // descuento total por la promoción (en positivo)
    numberOfTimesApplied: number;
    referredLineNumber: number;
    timesApplied?: Array<any>;
    amountPerUnitInTheInPromo?:  Array<any>;      // descuento unitario para cada linea de ticket (en positivo)
    timesAppliedWithDiscount?: Array<any>;    // Nuevas promos: cantidad promocionada con descuento, por cada linea del ticket
}
