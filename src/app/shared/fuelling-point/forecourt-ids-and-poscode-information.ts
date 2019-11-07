import { IDictionaryNumberKey } from 'app/shared/idictionary';

export interface ForecourtIdsAndPoscodeInformation {
    forecourIdToPosCode: IDictionaryNumberKey<string>;
    ownForecourtPOSId: number;
}
