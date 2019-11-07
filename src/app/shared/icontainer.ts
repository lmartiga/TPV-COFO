import { LayoutAreaItemType } from 'app/shared/layout/layout-area-item-type.enum';
import { IDimensionable } from 'app/shared/idimensionable';
import { IViewContainerReferenceable } from 'app/shared/iview-container-referenceable';

export interface IContainer extends IDimensionable, IViewContainerReferenceable {
  type: LayoutAreaItemType.columnsContainer | LayoutAreaItemType.rowsContainer;
}
