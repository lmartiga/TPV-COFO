export enum FuellingPointMainStates {
    // cerrado
    Closed = 0,
    // abierto y en reposo
    Idle = 1,
    // abierto y manguera levantada, pero no autorizado
    Calling = 2,
    // abierto, manguera colgada y autorizado
    Authorized = 3,
    // abierto,manguera levantada y autorizado, pero no suministrando
    Starting = 4,
    // abierto y suministrando
    Fuelling = 5,
    // no disponible debido a alguna causa
    Unavailable = 6,
    // no se reconoce el estado. (no configurado, cualquier estado que no pueda ser interpretado correctamente)
    Unkown = 7
}
