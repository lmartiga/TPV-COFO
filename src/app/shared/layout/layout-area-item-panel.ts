import { LayoutAreaPanelType } from 'app/shared/layout/layout-area-panel-type.enum';
import { LayoutAreaItemBase } from 'app/shared/layout/layout-area-item-base';

export interface LayoutAreaItemPanel extends LayoutAreaItemBase {
  panelType: LayoutAreaPanelType;
}
