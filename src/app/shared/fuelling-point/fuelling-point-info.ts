import { ServiceModeType } from 'app/shared/fuelling-point/service-mode-type.enum';
import { FuellingPointMainStates } from 'app/shared/fuelling-point/fuelling-point-main-states.enum';
import { FuellingLimitType } from 'app/shared/fuelling-point/fuelling-limit-type.enum';
import { Grade } from 'app/shared/fuelling-point/grade';

export interface FuellingPointInfo {
    ///// model from hubblePOSService
    readonly id: number;
    positionNumber: number;
    serviceModeType: ServiceModeType;
    operationModeId?: number;
    mainState: FuellingPointMainStates;
    isOnline: boolean;
    isInErrorState: boolean;
    isStopped: boolean;
    fuellingDataMonetary?: number;
    fuellingDataVolume?: number;
    currentProductReference: string;
    currentProductUnitaryPrice?: number;
    hasFreeBuffer: boolean;
    hasSupplyLimit: boolean;
    limitValue?: number;
    limitType?: FuellingLimitType;
    limitProductReference: string;
    limitProductUnitaryPrice?: number;
    lockingPOSId?: number;
    availableGradeList: Array<Grade>;
    currentGradeId?: number;
    limitGradeId?: number;
    supplyTransactionId?: number;
    mountSupplyTransaction?: number;
    //// added properties
    // waiting transactions info
    hasTransactions: boolean;
    isAttend: boolean;
    isPreAuthorized: boolean;
    hasPostPaidTransaction?: boolean;
    idfpTransferOrigen?: number;
    posIDTPV?: number;
    hasPrePaidTransaction?: boolean;
    oldServiceModeType?: ServiceModeType;
    oldHasPostPaidTransaction?: boolean;
    oldHasPrePaidTransaction?: boolean;
}
