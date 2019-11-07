import { DynamicActionType } from 'app/shared/dynamic-actions/dynamic-action-type';

export interface DynamicAction {
    id: string;
    action: string;
    actionType: DynamicActionType;
}
