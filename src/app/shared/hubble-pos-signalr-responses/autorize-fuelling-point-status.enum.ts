export enum AutorizeFuellingPointStatus {
    successful = 1,
    validationError = -1,
    notConnectedError = -2,
    fuellingPointNotExistsError = -3,
    fuellingPointYetAuthorizedError = -4,
    fuellingPointNotValidStateError = -5,
    operationNotAllowedError = -6,
    genericError = -7,
    fuellingPointInCallingStateError = -8,
}
