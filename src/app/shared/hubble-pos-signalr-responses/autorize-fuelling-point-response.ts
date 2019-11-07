import { AutorizeFuellingPointStatus } from 'app/shared/hubble-pos-signalr-responses/autorize-fuelling-point-status.enum';
import { IDictionaryStringKey } from '../idictionary';

export interface AutorizeFuellingPointResponse {
    provisionalIdToDefinitivePrepaidTransactionIdMapping: IDictionaryStringKey<string>;
    status: AutorizeFuellingPointStatus;
    message: string;
}
