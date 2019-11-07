import { LayoutAreaItemType } from 'app/shared/layout/layout-area-item-type.enum';

export interface LayoutAreaItemBase {
  type: LayoutAreaItemType;
  widthPercentage: number;
  heightPercentage: number;
}
