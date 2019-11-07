import { LayoutAreaItemBase } from 'app/shared/layout/layout-area-item-base';

export interface LayoutAreaItemStackContainer extends LayoutAreaItemBase {
  itemList: Array<LayoutAreaItemBase>;
}
