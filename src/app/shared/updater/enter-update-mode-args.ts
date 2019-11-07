import { AppWaitingCondition } from 'app/shared/updater/app-waiting-condition';

export interface EnterUpdateModeArgs {
    waitingConditionList: Array<AppWaitingCondition>;
}
