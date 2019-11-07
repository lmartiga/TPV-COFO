export enum SetPrintingTemplatesAndSettingsResponseStatuses {
  successful = 1,                 // viene del resultado Ok
  genericError = -1,              // GenericErrorException
  validationError = -2,           // ValidationException
  parsingError = -3,              // viene del resultado ErrorParsing
}
