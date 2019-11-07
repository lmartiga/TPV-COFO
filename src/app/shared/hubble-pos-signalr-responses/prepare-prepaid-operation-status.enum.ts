export enum PreparePrepaidOperationStatus {
    Successful = 1,
    ValidationError = -1,
    NotConnectedError = -2,
    GenericError = -3,
    FuellingPointNotExistsError = -4,
    FuellingPointNotInValidStateForOperationError = -5,
    OperationNotAllowedError = -6
}
