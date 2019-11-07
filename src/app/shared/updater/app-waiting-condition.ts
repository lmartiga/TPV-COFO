import { AppWaitingConditionType } from 'app/shared/updater/app-waiting-condition-type.enum';

export interface AppWaitingCondition {
    conditionData: string;
    conditionType: AppWaitingConditionType;
}
