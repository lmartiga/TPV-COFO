export enum TestConnectivityResponseStatuses {
  successful = 1,
  genericError = -1,
  validationError = -2,
  invalidIdentity = -3,
  serverNoLongerAvailableError = -4,
  serverNotExistsError = -5,
  serverError = -6
}
