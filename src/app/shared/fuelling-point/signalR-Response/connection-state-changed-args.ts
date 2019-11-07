import { ConnectionStateType } from 'app/shared/fuelling-point/signalR-Response/connection-state-type.enum';

export interface ConnectionStateChangedArgs {
    priorState: ConnectionStateType;
    actualState: ConnectionStateType;
}
