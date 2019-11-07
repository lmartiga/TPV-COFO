import { FuellingPointInfo } from 'app/shared/fuelling-point/fuelling-point-info';
import { GradeConfiguration } from 'app/shared/fuelling-point/grade-configuration';
import { IDictionaryNumberKey } from 'app/shared/idictionary';
import {
    GetPSSInitialConfigurationResponseStatuses
} from 'app/shared/hubble-pos-signalr-responses/get-pss-initial-configuration-status.enum';

export interface GetPSSInitialConfigurationResponse {
    status: GetPSSInitialConfigurationResponseStatuses;
    message: string;
    fuellingPointList: Array<FuellingPointInfo>;
    gradeConfigurationList: Array<GradeConfiguration>;
    fuellingPointIdAndTransactionCountDictionary: IDictionaryNumberKey<number>;
    forecourtControllerIdAndPOSCodeDictionary: IDictionaryNumberKey<string>;
    ownForecourtPOSId: number;
}
