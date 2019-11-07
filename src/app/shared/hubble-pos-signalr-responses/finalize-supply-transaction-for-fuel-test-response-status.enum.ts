export enum FinalizeSupplyTransactionForFuelTestResponseStatus {
    successful = 1,
    validationError = -1,
    notConnectedError = -2,
    fuellingPointNotExistsError = -3,
    supplyTransactionNotExistsError = -4,
    supplyTransactionNotValidStateError = -5,
    operationNotAllowedError = -6,
    genericError = -7,
    supplyTransactionCleanedButFuelTestCreationFailedError = -8,
}
