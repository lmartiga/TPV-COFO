export interface FuellingPointModeOperationChangedArgs {
    tpv:  string;
    fuellingPointId: number;
    doms: string;
    isAttend: boolean;
    isPreAuthorized: boolean;
    modeType: number;
    hasPostPaidTransaction: boolean;
    hasPrePaidTransaction: boolean;
    modeTypeOld: number;
    hasPostPaidTransactionOld: boolean;
    hasPrePaidTransactionOld: boolean;
}
