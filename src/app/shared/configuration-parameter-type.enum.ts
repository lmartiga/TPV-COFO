export enum ConfigurationParameterType {

  // Tipo desconocido de parámetro de configuración
  Unknown = 0,

  // Identificador de la divisa secundaria
  SecondaryCurrencyId = 1,

  // Configuración del layout del TPV
  LayoutConfiguration = 2,

  // Tipo de negocio (comercio, estaciones servicio,...)
  BusinessType = 3,

  // Identificador del medio de pago fuga
  RunawayPaymentMethodId = 4,

  // Identificador del medio de pago vale
  RefundPaymentMethodId = 5,

  // Identificador del medio de pago tarjeta por defecto
  DefaultBankCardId = 6,

  // Identificador del país por defecto (con propósito general)
  DefaultCountryId = 7,

  // Estructura del número de documento
  DocumentNumberStructureType = 8,

  // Id de TPV que se usará para identificarse en el controlador de estación de servicio
  PosIdToConnectToForecourtController = 9,

  // IP que se usará para identificarse en el controlador de estación de servicio
  IpToConnectToForecourtController = 10,

  // Password que se usará para identificarse en el controlador de estación de servicio
  PasswordToConnectToForecourtController = 11,

  // Identificador de aplicación que se usará para identificarse con el controlador de estación de servicio
  ApplicationIdToConnectToForecourtController = 12,

  // Identificador usado para el modo de operación con significado "prepago" en el controlador de estación de servicio.
  PSSPrepaidOperationModeId = 13,

  // Identificador usado para el modo de operación con significado "postpago" en el controlador de estación de servicio.
  PSSPostPaidOperationModeId = 14,

  // Identificador usado para el modo de operación con significado "wayletpago" en el controlador de estación de servicio.
  PSSWayletPaidOperationModeId = 42,

  // Identificador del proceso de sincronización que es susceptible de cambiar la configuración para la sincronización de base de datos (ej: REPLICA)
  ChangingDatabaseSynchronizationConfigurationProcessId = 15,

  // Configuración para los trabajos periódicos de sincronización de base de datos en modo standard
  // (ej: este modo es cuando la app angular está arrancada)
  DBSynchronizationJobsConfigurationInStandardMode = 16,

  // Configuración para los trabajos periódicos de sincronización de documentos de tipo documento de venta en modo standard
  // (ej: este modo es cuando la app angular está arrancada)
  DocumentsSynchronizationJobConfigurationForDocumentsTypeInStandardMode = 17,

  // Indica si está disponible la funcionalidad de hacer facturas en el flujo de venta
  IsInvoiceFunctionalityAvailable = 18,

  // Indica si está disponible la opción de facturas en la funcionalidad de notas de crédito
  IsInvoiceOptionInCreditNotePanelAvailable = 19,

  // Indica si está disponible la funcionalidad de hacer notas de crédito
  IsCreditNoteFunctionalityAvailable = 20,

  // Indica si está disponible la funcionalidad de hacer notas de despacho
  IsDispatchNoteFunctionalityAvailable = 21,

  // Indica el uso de serie rectificativa para el flujo de venta estándar (ticket)
  RectifyingSeriesForStandardSaleFunctionalityMode = 22,

  // Indica el uso de serie rectificativa para el flujo de venta de factura
  RectifyingSeriesForInvoiceFunctionalityMode = 23,

  // Indica el uso de serie rectificativa para las notas de crédito
  RectifyingSeriesForCreditNoteunctionalityMode = 24,

  // Identificador de cliente destinado a ser utilizado como cliente de contado (ej: 0276300000)
  UnknownCustomerId = 25,

  // Nombre de la impresora primaria o predeterminada para la impresión de documentos desde el TPV
  PrimaryPrinterName = 26,

  // Nombre de fichero del logo que mostrará el TPV por defecto en los documentos impresos que lo requieran
  LogoPrintingFilename = 27,

  // Configuración para los trabajos periódicos de sincronización de documentos de tipo suministro de combustible en modo standard
  // (modo standard: cuando la app angular está arrancada)
  DocumentsSynchronizationJobConfigurationForSuppliesTypeInStandardMode = 28,

  // Número de días desde la última compactación de base de datos que deben vencerse para poder hacer una nueva compactación
  ThresholdDaysToCompactDatabase = 29,

  // Mapping de las plantillas de impresion por su caso de uso
  PrintingTemplatesMapping = 30,

  // Parámetro que habilita el uso de terminal de pago
  IsPaymentTerminalAutomaticPaymentEnabled = 31,

  // Número del terminal virtual para flotas
  VirtualTerminalSerialNumber = 32,

 // La url para conseguir la información de la tarjeta
  CustomerCardWebServiceURL = 33,

  // Indica si un cliente puede hacer un pago con saldo pediente
  AllowPendingPaymentForKnownCustomer = 34,

  // Indica si una devolucion es una nota de credito
  IsDevolutionAsCreditNote = 35,

  // Indica que tipo de PLU se quiere mostrar
  PluViewConfiguration = 36,

  // Indica la zona horaria del TPV
  MicrosoftTimeZoneId = 37,

  // Nombre de la impresora predeterminada para la impresión de documentos desde el TPV
  DefaultPosPrinterName = 38,

  // Tamaño de papel predeterminado para la impresión de documentos. Especificada en milímetros.
  DefaultPosPaperWidth = 39,

  // Mapping de la configuración de impresion por su caso de uso
  UsecasesPrintingConfiguration = 40,

  /**
  * Indica el lenguaje en el que opera el TPV (Código ISO 639-1 [idioma-pais] Ej: es_ES, en_GB, fr_FR)
  */
 DefaultPosLanguage = 70,

  /**
   * Establece el tiempo que espera en milisegundos el sistema para realizar la búsqueda de un producto después de haber pulsado una tecla
   */
  MillisecToWaitBetweenKeypressForSearchProduct = 80,
/**
   * Se abilita o se desabilita el checkeo del formato EAN para introducir un codigo de barras
   */
  CheckEANFormat = 88,

  /**
   * Tiempo máximo en milisegundos entre pulsaciones de teclado para aceptarlas como una lectura del escaner
   */
  TimeBetweenKeyEvents = 89,
}
