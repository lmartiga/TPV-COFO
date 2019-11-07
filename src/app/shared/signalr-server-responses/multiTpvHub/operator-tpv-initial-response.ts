import { OperatorChangedArgs } from "./operator-changed-args";

export interface OperatorTpvInitialResponse {
    status: number;
    message: string;
    operatorTpvList: Array<OperatorChangedArgs>;
}
