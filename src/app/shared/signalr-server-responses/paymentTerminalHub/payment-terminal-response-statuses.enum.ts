export enum PaymentTerminalResponseStatuses {
  successful = 1,                // viene del resultado Ok
  genericError = -1,              // GenericErrorException
  validationError = -2,           // ValidationException
  saleRejected = -3,              // resultado Error de operación o datos internos
}
