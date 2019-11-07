import { DynamicActionLaunchDisplayItem } from 'app/shared/dynamic-actions/dynamic-action-launch-display-item';
import { DynamicActionLaunchEvent } from 'app/shared/dynamic-actions/dynamic-action-launch-event';
import { DynamicAction } from 'app/shared/dynamic-actions/dynamic-action';

export interface DynamicActionsConfiguration {
    dynamicActionsList: DynamicAction [];
    dynamicActionsLaunchDisplayItemList: DynamicActionLaunchDisplayItem [];
    dynamicActionsLaunchEvent: DynamicActionLaunchEvent [];
}
