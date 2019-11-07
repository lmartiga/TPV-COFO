export enum LockPartialSuplyTransactionForRefundingStatus {
    successful = 1,
    validationError = -1,
    genericError = -2,
    notConnectedError = -3,
    fuellingPointNotExistsError = -4,
    supplyTransactionNotExistsError = -5,
    supplyTransactionNotInValidStateError = -6,
    operationNotAllowedError = -7
}
