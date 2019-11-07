import { LayoutConfiguration } from 'app/shared/layout/layout-configuration';
import { BusinessType } from 'app/shared/business-type.enum';
import {
  GetPosConfigurationResponseStatuses
} from 'app/shared/hubble-pos-web-api-responses/get-pos-configuration/get-pos-configuration-response-statuses.enum';
import { ConfigurationParameter } from 'app/shared/configuration-parameter';
import { DecimalPrecisionConfiguration } from 'app/shared/decimal-precision-configuration';

export interface GetPosConfigurationResponse {
  status: GetPosConfigurationResponseStatuses;
  message: string;
  layoutConfiguration: LayoutConfiguration;
  decimalPrecisionConfiguration: DecimalPrecisionConfiguration;
  configurationParameterList: ConfigurationParameter[];
  businessType: BusinessType;
  defaultCountryId: number; /*Nota:
  * En el servicio, este campo está definido como entero nullable.
  * 1) En Javascript (Typescript) cualquier variable puede ser undefined o null
  *    independientemente de su "tipo". Sin embargo los campos de las interfaces
  *    se pueden poner como opcionales (en este caso "defaultCountryId?: number")
  * 2) Si no se pone como opcional, al ser un campo que pertenece a una interfaz,
  *    en el momento de crear un objeto (manualmente) de este tipo nos obligaría a asignarle un valor (aunque ese valor sea undefined)
  * 3) El serializador resuelve correctamente el problema inflando el objeto con el resto de campos y 'undefined' para este último si el
       servicio devuelve nulo.
  */
 unknownCustomerId: string;
 defaultCustomer: string;
 defaultOperator: string;
}
