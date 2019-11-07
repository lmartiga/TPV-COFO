import { LayoutAreaPanelType } from 'app/shared/layout/layout-area-panel-type.enum';
import { LayoutAreaPanelOpeningDirection } from 'app/shared/layout/layout-area-panel-opening-direction.enum';

export interface LayoutAreaAuxiliaryPanelsGeneralConfiguration {
  widthPercentage: number;
  extendedtWidthPercentage: number;

  referencePanel: LayoutAreaPanelType;
  openingDirection: LayoutAreaPanelOpeningDirection;
}
