import { SeriesType } from 'app/shared/series/series-type';

export interface TransactionExtraData {

    // Gets or sets the pending sypply identifier.
    pendingSupplyId: number;

    // Gets or sets the fuelling point identifier.
    // The fuelling point who owns this fuel transaction data
    fuellingPointId: number;

    // Gets or sets the transaction token.
    // A token to identify this fuel transaction data
    transactionToken: string;

    // Gets or sets the product reference.
    productReference: string;

    // Gets or sets the customer unitary price.
    // This is the unitary price for the customer when the preset was done, without discounts applied.
    customerUnitaryPrice: number;

    // Gets or sets the tax percentage.
    taxPercentage: number;

    // Gets or sets the monetary amount. This is the final monetary amount calculated when the preset was done.
    monetaryAmount: number;

    // Gets or sets the corresponding volume. This is the final corresponding volume set in the original preset.
    correspondingVolume: number;

    // Gets or sets the discount applied. This is the discount applied when the preset was done.
    discountApplied: number;

    // Gets or sets the line number in ticket.
    lineNumberInTicket?: number;

    // Gets or sets the ticket code.
    // Null if no ticket is generated yet.
    ticketCode?: string;

    // Related NCliente without company, if any.
    // Null otherwise.
    customerCode?: string;

    // Card number of related customer (if any), if was identified by card (contacto cli).
    // Null otherwise.
    nContactoCli: string;

    // Gets or sets the kilometers.
    kilometers?: number;

    // Gets or sets the type of the document series.
    documentSeriesType: SeriesType;

    // Gets or sets the discounted amount applied
    discountedAmount?: number;

    // Gets or sets the applied tax amount
    taxAmount?: number;

    // Gets or sets the associated vehicle license plate if any
    vehicleLicensePlate?: string;

}
