export enum UnlockSupplyTransactionStatus {
    Successful = 1,
        ValidationError = -2,
        NotConnectedError = -3,
        SupplyTransactionNotExistsError = -4,
        FuellingPointNotExistsError = -5,
        SupplyTransactionNotInValidStateError = -6,
        OperationNotAllowedError = -7,
        GenericError = -8
}
