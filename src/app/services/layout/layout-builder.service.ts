import { Injectable, ViewContainerRef, ComponentRef, ComponentFactory, Type, ComponentFactoryResolver } from '@angular/core';

import { LayoutAreaItemType } from 'app/shared/layout/layout-area-item-type.enum';
import { IContainer } from 'app/shared/icontainer';
import { IDimensionable } from 'app/shared/idimensionable';
import { LayoutAreaItemPanel } from 'app/shared/layout/layout-area-item-panel';
import { LayoutAreaPanelType } from 'app/shared/layout/layout-area-panel-type.enum';
import { DocumentComponent } from 'app/components/document/document.component';
import { LayoutStackContainerComponent } from 'app/components/layout-stack-container/layout-stack-container.component';
import { ActionsComponent } from 'app/components/actions/actions.component';
import { LayoutAreaItemStackContainer } from 'app/shared/layout/layout-area-item-stack-container';
import { LayoutAreaItemBase } from 'app/shared/layout/layout-area-item-base';
import { BusinessType } from 'app/shared/business-type.enum';
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
import { SlideOverService } from 'app/services/slide-over/slide-over.service';
import { IViewContainerReferenceable } from 'app/shared/iview-container-referenceable';
import { SlideOverOpeningDirection } from 'app/shared/slide-over/slide-over-opening-direction.enum';
import { LayoutAreaPanelOpeningDirection } from 'app/shared/layout/layout-area-panel-opening-direction.enum';
import { LogHelper } from 'app/helpers/log-helper';

@Injectable()
export class LayoutBuilderService {
  private _businessSpecificComponentFactory: ComponentFactory<Type<any>>;

  constructor(
    private _componentFactoryResolver: ComponentFactoryResolver,
    private _config: MinimumNeededConfiguration,
    private _slideOverService: SlideOverService,
    private  _logHelper: LogHelper
  ) {
    // Assign factories of components which types are unknown, depending of business type
    if (_config.businessComponentsConfiguration != undefined) {
      if (_config.businessComponentsConfiguration.type != BusinessType.none) {
        this._businessSpecificComponentFactory =
          _componentFactoryResolver.resolveComponentFactory(_config.businessComponentsConfiguration.mainComponentType);
      }
    } else {
      this._logHelper.trace('ERROR: Falta la configuración de BusinessComponents!!!');
    }

    this._logHelper.trace('LayoutBuilderService created');
  }

  parseLayoutConfigurationAndBuildComponentTree(
    viewContainerRef: ViewContainerRef,
    item: LayoutAreaItemBase = this._config.layoutConfigurationRootItem): void {
    if (item.type === LayoutAreaItemType.rowsContainer || item.type === LayoutAreaItemType.columnsContainer) {
      const currentItem = item as LayoutAreaItemStackContainer;
      // Create the component (container), fill its configuration and insert it into the view tree
      const layoutContainerFactory = this._componentFactoryResolver.resolveComponentFactory(LayoutStackContainerComponent);
      const componentRef = viewContainerRef.createComponent(layoutContainerFactory);
      const instance: IContainer = componentRef.instance;
      instance.widthPercentage = item.widthPercentage;
      instance.heightPercentage = item.heightPercentage;
      instance.overflowY = 'hidden';
      instance.type = item.type;
      this._logHelper.trace(instance);

      // This panel has childs
      if (currentItem.itemList.length > 0) {
        currentItem.itemList.forEach(element => {
          this.parseLayoutConfigurationAndBuildComponentTree(instance.viewContainerRef, element);
        });
      }

    } else if (item.type === LayoutAreaItemType.mainPanel) {
      const currentItem = item as LayoutAreaItemPanel;
      let componentRef: ComponentRef<any>;
      let instance: IDimensionable;

      switch (currentItem.panelType) {
        case LayoutAreaPanelType.primary:
          // Create Document component and insert it into the view tree
          const documentComponentFactory = this._componentFactoryResolver.resolveComponentFactory(DocumentComponent);
          componentRef = viewContainerRef.createComponent(documentComponentFactory);
          instance = componentRef.instance;
          instance.widthPercentage = currentItem.widthPercentage;
          instance.heightPercentage = currentItem.heightPercentage;
          // No se debe asignar overflow-y al panel del documento.
          break;
        case LayoutAreaPanelType.secondary:
          // Create Actions component and insert it into the view tree
          const actionsComponentFactory = this._componentFactoryResolver.resolveComponentFactory(ActionsComponent);
          componentRef = viewContainerRef.createComponent(actionsComponentFactory);
          instance = componentRef.instance;
          instance.widthPercentage = currentItem.widthPercentage;
          instance.heightPercentage = currentItem.heightPercentage;
          instance.overflowY = 'auto';
          break;
        case LayoutAreaPanelType.business:
          // Create custom Business specific component and insert it into the view tree
          componentRef = viewContainerRef.createComponent(this._businessSpecificComponentFactory);
          instance = componentRef.instance;
          instance.widthPercentage = currentItem.widthPercentage;
          instance.heightPercentage = currentItem.heightPercentage;
          instance.overflowY = 'auto';
          break;
        default:
      }

      if (this._config.auxiliaryPanelsDefaultConfiguration.referencePanel === currentItem.panelType) {
        this._slideOverService.referencePanel = (<IViewContainerReferenceable>componentRef.instance).viewContainerRef;
        if (this._config.auxiliaryPanelsDefaultConfiguration.openingDirection == LayoutAreaPanelOpeningDirection.LeftToRight) {
          this._slideOverService.openingDirection = SlideOverOpeningDirection.leftToRight;
        } else {
          this._slideOverService.openingDirection = SlideOverOpeningDirection.rightToLeft;
        }
      }
    }
  }
}
