/**
 * TODO Hay que hablar con Antonio para ver si la gestión de la respuesta del servicio
 * (ya que ahora todas las llamadas devuelven un status y un mensaje se tienen que gestionar desde cada
 * uno de los sitios donde se invoca el servicio http o se tienen que gestionar en un punto común. Hablé con él el otro día
 * y quedamos en que deberían gestionarse esas respuestas desde un sitio común (que entienda los statuses del demonio,
 * y abstraer al resto de servicios de esta lógica). Hay que ver de qué manera se programa esto).
 * En general hay que revisar todas las llamadas al demonio por si hay que actualizarlas.
 */
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { HttpService } from 'app/services/http/http.service';
import { LayoutConfiguration } from 'app/shared/layout/layout-configuration';
import { LayoutAreaItemBase } from 'app/shared/layout/layout-area-item-base';
import { BusinessType } from 'app/shared/business-type.enum';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { BusinessComponentsConfiguration } from 'app/shared/business-components-configuration';
import {
  FuellingPointsRootComponent
} from 'app/components/business-specific/fuelling-points-root/fuelling-points-root.component';
import {
  LayoutAreaAuxiliaryPanelsGeneralConfiguration
} from 'app/shared/layout/layout-area-auxiliary-panels-general-configuration';
import {
  GetPosConfigurationResponse
} from 'app/shared/hubble-pos-web-api-responses/get-pos-configuration/get-pos-configuration-response';
import {
  GetPosConfigurationResponseStatuses
} from 'app/shared/hubble-pos-web-api-responses/get-pos-configuration/get-pos-configuration-response-statuses.enum';
import { DynamicActionLaunchDisplayItem } from 'app/shared/dynamic-actions/dynamic-action-launch-display-item';
import { DynamicAction } from 'app/shared/dynamic-actions/dynamic-action';
import {
  GetDynamicActionsConfigurationResponse
} from 'app/shared/hubble-pos-web-api-responses/dynamic-actions/get-dynamic-actions-configuration-response';
import {
  GetDynamicActionsConfigurationResponseStatuses
} from 'app/shared/hubble-pos-web-api-responses/dynamic-actions/get-dynamic-actions-configuration-response-statuses.enum';
import { DynamicActionsConfiguration } from 'app/shared/dynamic-actions/dynamic-actions-configuration';
import { Posinformation } from '../shared/posinformation';
import { GetPosInformationResponse } from '../shared/hubble-pos-web-api-responses/get-pos-information/get-pos-information-response';
import { LogHelper } from '../helpers/log-helper';
import { GetPosInformationStatus } from '../shared/hubble-pos-web-api-responses/get-pos-information/get-pos-information-status.enum';

/***
 ** Application specific configuration (Not changeable by user).
****/
@Injectable()
export class MinimumNeededConfiguration {
  //#region private members
  private _layoutConfiguration: LayoutConfiguration;
  private _businessComponentsConfiguration: BusinessComponentsConfiguration;
  private _userConfiguration: any = {};
  private _dynamicActionConfigurationDAO: DynamicActionsConfiguration;

  private _logoURL: string;

  private _tpvVersion: string;
  private _posInformation: Posinformation;
  //#endregion private members

  //#region constructor
  constructor(
    private _http: HttpService,
    private _appDataConfiguration: AppDataConfiguration,
    private _logHelper : LogHelper,
  ) {
  }
  //#endregion constructor

  //#region fill config
  async fillIdentityAsync(): Promise<boolean> {
    let success = true;

    // Get user configuration
    try {
      this._userConfiguration = await this._http.getJsonPromiseAsync(
        `${environment.httpServerUrl}/tpv.config.json?d=${(new Date().getTime())}`);
      
      if( this._appDataConfiguration.userConfiguration.PosId != undefined)
      {
        this._userConfiguration.PosId = this._appDataConfiguration.userConfiguration.PosId
      }
      
      this._appDataConfiguration.userConfiguration = this._userConfiguration;
      this._logHelper.trace('Retrieved configuration from tpv.config.json:');
      this._logHelper.trace(this._userConfiguration);
    } catch (e) {
      this._logHelper.trace(`ERROR. No ha sido posible recuperar la identidad del TPV -> ${e}`);
      success = false;
    }
    return success;
  }

  async fillConfigurationAsync(): Promise<boolean> {
    let success = true;

    // Get POS configuration
    try {
      const getPosConfigurationResponse: GetPosConfigurationResponse = await this._getPosConfigurationAsync();
      this._layoutConfiguration = getPosConfigurationResponse.layoutConfiguration;
      const businessType = getPosConfigurationResponse.businessType;
      this._businessComponentsConfiguration = this._getBusinessSpecificComponentsConfiguration(businessType);
      this._appDataConfiguration.defaultCountryId = getPosConfigurationResponse.defaultCountryId;
      this._appDataConfiguration.unknownCustomerId = getPosConfigurationResponse.unknownCustomerId;
      this._appDataConfiguration.configurationParameterList = getPosConfigurationResponse.configurationParameterList;
      this._appDataConfiguration.defaultCustomer = getPosConfigurationResponse.defaultCustomer;
      this._appDataConfiguration.defaultOperator = getPosConfigurationResponse.defaultOperator;
      this._appDataConfiguration.decimalPrecisionConfiguration = getPosConfigurationResponse.decimalPrecisionConfiguration;
    } catch (e) {
      this._logHelper.trace(`ERROR: ${e}`);
      success = false;
    }
    // POS information
    try {
      this._posInformation = await this._getPOSInformation();
    } catch (e) {
      this._logHelper.logError(undefined, `ERROR: ${e}`);
      success = false;
    }

    // get dynamicActionsConfiguration
    try {
      this._dynamicActionConfigurationDAO = await this._getDynamicActionsConfiguration();
    } catch (e) {
      this._logHelper.trace(`ERROR: ${e}`);
      success = false;
    }

    // get logoURL
    try {
      this._logoURL = await this._getLogoURLAsync();
    } catch (e) {
      this._logHelper.trace(`ERROR: ${e}`);
      success = false;
    }

    // get tpvVersion
    try {
      this._tpvVersion = await this._getTpvVersionAsync();
    } catch (e) {
      this._logHelper.trace(`ERROR: ${e}`);
      success = false;
    }
    return success;
  }
  //#endregion fill config

  //#region getters
  get businessComponentsConfiguration(): BusinessComponentsConfiguration {
    return this._businessComponentsConfiguration;
  }

  get layoutConfigurationRootItem(): LayoutAreaItemBase {
    return this._layoutConfiguration != undefined ? this._layoutConfiguration.layoutAreaItem : undefined;
  }

  get auxiliaryPanelsDefaultConfiguration(): LayoutAreaAuxiliaryPanelsGeneralConfiguration {
    return this._layoutConfiguration != undefined ? this._layoutConfiguration.auxiliaryPanelsDefaultConfiguration : undefined;
  }

  get dynamicActionItemList(): DynamicActionLaunchDisplayItem[] {
    return this._dynamicActionConfigurationDAO.dynamicActionsLaunchDisplayItemList;
  }

  get dynamicActionFunctionalityList(): DynamicAction[] {
    return this._dynamicActionConfigurationDAO.dynamicActionsList;
  }

  get logoURL(): string {
    return this._logoURL;
  }
  get POSInformation(): Posinformation {
    return this._posInformation;
  }

  get tpvVersion() {
    return this._tpvVersion;
  }
  //#endregion getters

  //#region private methods
  /**
   * Gets the business specific components configuration depending of busines type
   * @private
   * @param {BusinessType} businessType
   * @returns {BusinessComponentsConfiguration}
   * @memberof Configuration
   */
  private _getBusinessSpecificComponentsConfiguration(businessType: BusinessType): BusinessComponentsConfiguration {
    switch (businessType) {
      case BusinessType.gasStation:
        return {
          type: businessType,
          mainComponentType: FuellingPointsRootComponent
        };
      case BusinessType.hostelry:
        return {
          type: businessType,
          mainComponentType: undefined
        };
      case BusinessType.retail:
        return {
          type: businessType,
          mainComponentType: undefined
        };
      default:
        this._logHelper.trace('ERROR: Se recibió un tipo de negocio (BusinessType) no contemplado. El objeto devuelto será undefined.');
        return undefined;
    }
  }

  /**
   *
   *
   * @private
   * @returns {Promise<GetPosConfigurationResponse>}
   * @memberof Configuration
   * @throws {Error}
   */
  private async _getPosConfigurationAsync(): Promise<GetPosConfigurationResponse> {
    const getPosConfigurationResponse: GetPosConfigurationResponse = await this._http.postJsonPromiseAsync(
      `${environment.apiUrl}/GetPOSConfiguration`, { Identity: this._userConfiguration.Identity });
    if (getPosConfigurationResponse != undefined) {
      if (getPosConfigurationResponse.status == GetPosConfigurationResponseStatuses.successful) {
        this._logHelper.trace('Retrieved posConfiguration from service:');
        return getPosConfigurationResponse;
      } else {
        throw new Error(`Cannot retrive POS configuration from service. Service response: ${getPosConfigurationResponse.message}`);
      }
    } else {
      throw new Error(`Cannot retrive POS configuration from service.`);
    }
  }

  private async _getDynamicActionsConfiguration(): Promise<DynamicActionsConfiguration> {
    const getDynamicActionsConfigurationResponse: GetDynamicActionsConfigurationResponse =
      await this._http.postJsonPromiseAsync(
        `${environment.apiUrl}/GetDynamicActionsConfiguration`,
        { Identity: this._userConfiguration.Identity,
          LanguageCode: this._appDataConfiguration.defaultPosLanguage});

    if (getDynamicActionsConfigurationResponse != undefined) {
      if (getDynamicActionsConfigurationResponse.status == GetDynamicActionsConfigurationResponseStatuses.successful) {
        this._logHelper.trace('Retrieved action functionality list (Dynamic Options) from service:');
        this._logHelper.trace(getDynamicActionsConfigurationResponse);
        return getDynamicActionsConfigurationResponse.dynamicActionsConfigurationDAO;
      } else {
        throw new Error(`Cannot retrive action item list (Dynamic Options) from service. Service response:
                          ${getDynamicActionsConfigurationResponse.message}`);
      }
    } else {
      throw new Error(`Cannot retrive action functionality (Dynamic Options) list from service.`);
    }
  }

  private async _getPOSInformation(): Promise<Posinformation> {
    const getPosInformationResponse: GetPosInformationResponse =
      await this._http.postJsonPromiseAsync(`${environment.apiUrl}/GetPOSInformation`, { Identity: this._userConfiguration.Identity });
    if (getPosInformationResponse == undefined) {
      throw new Error(`No se pudo recuperar informacion de POS.`);
    }
    if (getPosInformationResponse.status != GetPosInformationStatus.successful) {
      this._logHelper.logError(getPosInformationResponse.status, getPosInformationResponse.message);
      throw new Error(getPosInformationResponse.message);
    }
    return getPosInformationResponse.posInformation;

  }

  private async _getLogoURLAsync(): Promise<string> {
    return 'assets/images/img_logo.png';
  }

  private async _getTpvVersionAsync(): Promise<string> {

    let  appVersion : string  = this._appDataConfiguration.userConfiguration.Version;
    appVersion = appVersion ? appVersion : require('../../../package.json').version;
    return appVersion ?  appVersion.toString() : '24.0.0.10';
    
  }
  //#endregion private methods
}
