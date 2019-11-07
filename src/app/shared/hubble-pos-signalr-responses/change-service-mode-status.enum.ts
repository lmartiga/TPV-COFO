export enum ChangeServiceModeStatus {
    Successful = 1,
    ValidationError = -1,
    NotConnectedError = -2,
    FuellingPointNotInValidStateForOperationError = -3,
    FuellingPointNotExistsError = -4,
    OperationNotAllowedError = -5,
    GradeNotAvailableError = -6,
    GenericError = -7
}
