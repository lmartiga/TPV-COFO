export enum LockSupplyTransactionStatus {
    Successful = 1,
    ValidationError = -1,
    NotConnectedError = -2,
    FuellingPointNotExistsError = -3,
    SupplyTransactionNotExistError = -4,
    SupplyTransactionNotValidStateError = -5,
    SupplyTransactionNotExistsError = -6,
    SupplyTransactionNotInValidStateError = -7,
    OperationNotAllowedError = -8,
    GenericError = -9,
}
