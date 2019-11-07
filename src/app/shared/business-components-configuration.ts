import { BusinessType } from 'app/shared/business-type.enum';
import { Type } from '@angular/core/public_api';

export interface BusinessComponentsConfiguration {
  /**
   *
   * @description The type of the business
   * @type {BusinessType}
   * @memberof BusinessComponentsConfiguration
   */
  type: BusinessType;
  /**
   *
   * @description The object type of the component to fit in the business specific panel
   * @type {Type<any>}
   * @memberof BusinessComponentsConfiguration
   */
  mainComponentType: Type<any>;
}
