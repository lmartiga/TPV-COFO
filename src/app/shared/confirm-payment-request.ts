import { SeriesType } from 'app/shared/series/series-type';

export interface ConfirmPaymentRequest {
    seriesType: SeriesType;
    documentNumber: string;
    // ncompany + documentNumber
    documentId: string;
    contactId?: string;
    kilometers?: number;
    vehicleLicensePlate?: string;
    ticketFactura?: boolean;
}
