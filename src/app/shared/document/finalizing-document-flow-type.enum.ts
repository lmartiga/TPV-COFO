export enum FinalizingDocumentFlowType {
    None = 0,
    EmittingTicket = 1,
    EmittingBill = 2,
    EmittingCreditNoteForTicket = 3,
    EmittingCreditNoteForBill = 4,
    EmittingDevolutionForTicket = 5,
    EmittingDevolutionForBill = 6,
    EmittingDispatchNote = 7,
    EmittingDocumentForConsignment = 8
}
