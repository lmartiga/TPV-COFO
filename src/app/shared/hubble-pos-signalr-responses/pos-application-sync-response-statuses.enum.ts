export enum POSApplicationSyncResponseStatuses {
  successful = 1,
  validationError = -1,
  invalidIdentityError = -2,
  notReadyToStartAppError = -3,
  genericError = -4
}
