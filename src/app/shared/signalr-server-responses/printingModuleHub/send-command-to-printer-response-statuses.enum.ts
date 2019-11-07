export enum SendCommandToPrinterResponseStatuses {
  successful = 1,                 // viene del resultado Ok
  genericError = -1,              // GenericErrorException
  validationError = -2,           // ValidationException
}
