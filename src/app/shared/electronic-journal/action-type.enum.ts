export enum ActionType {
    // system                       (0x)
    appStarted = 1,                 // (01)
    appStopped = 2,                 // (02)
    customMessage = 3,              // (03) Aditional message for customized application purposes. Uses GenericDetail
    maintenance = 4,                // (04)
    localDaemonStarted = 5,         // (05)
    localDaemonStopped = 6,         // (06)
  
    // document opening             (1x)
    operatorSet = 11,
    customerSet = 12,
    selectedDocumentChanged = 13,
    operatorSetFailed = 14,
  
    // document modifications       (2x)
    priceChangeApplied = 21,
    discountApplied = 22,
    documentLineAdded = 23,
    documentLineDeleted = 24,
    quantityChangeApplied = 25,
  
    // Payments                      (3x)
    paymentPanelSelected = 31,
    paymentAdded = 32,
    sellCompleted = 33,
    refundCaptured = 34,
    paymentDeleted = 35,
    paymentUpdated = 36,
  
    // Fuelling Information          (4x)
    fuellingPointServiceModeChanged = 41,
    fuellingPointLimitSelected = 42,
    fuellingPointOpened = 43,
    cancelAuthorizedPrepay = 44,
    cancelPreset = 45,
    fuelTransactionAuthorized = 46,   // Al vender un prepago
    fuelTransactionCaptured = 47,     // Al autorizar un postpago preexistente (automático)
    fuelTransactionSelected = 48,     // Al seleccionar una transacción
    manualFuelTransactionGenerated = 49,
  
    // Product selection             (5x)
    productInPLUSelected = 51,
    productScanned = 52,
    productEntered = 53,
  
    // Other options panel           (6x)
    otherOptionsPanelOpened = 61,
    otherOptionsPanelClosed = 62,
    buttonInOtherOptionsClicked = 63,
  
    // TPV Alerts                    (7x)
    alertShown = 71,
    alertClosed = 72,
  
    // MessagePanel                  (8x)
    messagePanelShown = 81,
    messagePanelClosed = 82,
    messagePanelCancelled = 83,
    messagePanelAcepted = 84,
    messagePanelAceptedByTimeout = 85,
    messagePanelCancelledByTimeout = 86,
  
    // Fuelling Information 2        (9x)
    emergencyStop = 91,
    petrolStationModeChanged = 92,
    showPendingTransactionsPanel = 93,
    pendingTransactionsPanelCancelled = 94,
    fuellingPointSelected = 95,
    fuellingPointPanelCancelled = 96,
    transferAuthorizedPrepay = 97,
  
    // Cashbox related              (10x)
    cashboxOpened = 101,

    // Console.log                  (11x)
    Console_log = 110,
    Console_debug = 111,
    Console_error = 112,

  }