export enum CancelAuthorizationFuellingPointStatus {
    Successful = 1,
    ValidationError = -1,
    NotConnectedError = -2,
    FuellingPointNotExistsError = -3,
    FuellingPointNotValidStateError = -4,
    OperationNotAllowedError = -5,
    GenericError = -6
}
