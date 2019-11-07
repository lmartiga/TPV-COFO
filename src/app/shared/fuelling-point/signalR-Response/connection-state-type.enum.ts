export enum ConnectionStateType {
    // Is not connected to petrol station controller (PSS DOMS)
    Disconnected = 0,

    // Is trying to connect to petrol station controller (PSS DOMS)
    Connecting = 1,

    // Connection attemp failed and waiting to try again
    WaitingToRetryConnection = 2,

    // Is connected to petrol station controller (PSS DOMS) and ready to work
    // (caution: some properties are not immediately available after change to this state
    // and its availability will be notified by event way)
    Connected = 3,

    // Is disconnecting from petrol station controller (PSS DOMS)
    Disconnecting = 4
}
