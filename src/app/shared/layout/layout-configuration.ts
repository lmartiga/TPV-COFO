import { LayoutAreaItemBase } from 'app/shared/layout/layout-area-item-base';
import { LayoutAreaAuxiliaryPanelsGeneralConfiguration } from 'app/shared/layout/layout-area-auxiliary-panels-general-configuration';

export interface LayoutConfiguration {
  layoutAreaItem: LayoutAreaItemBase;
  auxiliaryPanelsDefaultConfiguration: LayoutAreaAuxiliaryPanelsGeneralConfiguration;
}
