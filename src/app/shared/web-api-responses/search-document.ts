export interface SearchDocument {
    id: string;
    documentNumber: string;
    operatorName: string;
    emissionLocalDateTime: Date;
    emissionUTCDateTime?: Date;
    customerTIN: string;
    customerBusinessName: string;
    totalAmountWithTax: number;
    pendingAmountWithTax: number;
}
