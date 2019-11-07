export enum PrintResponseStatuses {
  successful = 1,                 // viene del resultado Ok
  genericError = -1,              // GenericErrorException
  validationError = -2,           // ValidationException
  parsingError = -3,              // viene del resultado ErrorParsing
  printingError = -4,             // viene del resultado ErrorPrinting
  templateNotFound = -5,
}
