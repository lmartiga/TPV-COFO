import { FuellingPointModeOperationChangedArgs } from "./fuelling-point-mode-operation-changed-args";

export interface FuellingPointOperationModeInitialResponse {
    status: number;
    message: string;
    fpList: Array<FuellingPointModeOperationChangedArgs>;
}
