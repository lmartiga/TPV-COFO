export enum EmergencyStopFuellingPointStatus {
    Successful = 1,
    ValidationError = -1,
    NotConnectedError = -2,
    FuellingPointNotExistsError = -3,
    OperationNotAllowedError = -4,
    GenericError = -5
}
