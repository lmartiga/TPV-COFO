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
import { Company } from 'app/shared/company';
import { PrintingTemplate } from 'app/shared/printing/printing-template';
import { Series } from 'app/shared/series/series';
import { SeriesType } from 'app/shared/series/series-type';
import { Shop } from 'app/shared/shop';
import { PaymentMethodType } from 'app/shared/payments/payment-method-type.enum';
import { FuncionalityMode } from 'app/shared/funcionality-mode.enum';
import { Currency } from 'app/shared/currency/currency';
import { PaymentMethod } from 'app/shared/payments/payment-method';
import { CurrencyPriorityType } from 'app/shared/currency/currency-priority-type.enum';
import { Volume } from 'app/shared/volume';
import { HttpService } from 'app/services/http/http.service';
import { GetCompanyResponse } from 'app/shared/web-api-responses/get-company-response';
import { GetShopResponse } from 'app/shared/web-api-responses/get-shop-response';
import { GetCompanyResponseStatuses } from 'app/shared/web-api-responses/get-company-response-statuses.enum';
import { GetShopResponseStatuses } from 'app/shared/web-api-responses/get-shop-response-statuses.enum';
import { GetPaymentMethodsResponse } from 'app/shared/hubble-pos-web-api-responses/get-payment-methods/get-payment-methods-response';
import { GetCurrenciesResponse } from 'app/shared/hubble-pos-web-api-responses/get-currencies/get-currencies-response';
import { GetSeriesResponse } from 'app/shared/hubble-pos-web-api-responses/get-series/get-series-response';
import {
  GetPaymentMethodsResponseStatuses
} from 'app/shared/hubble-pos-web-api-responses/get-payment-methods/get-payment-methods-response-statuses.enum';
import { GetSeriesResponseStatuses } from 'app/shared/hubble-pos-web-api-responses/get-series/get-series-response-statuses.enum';
import {
  GetCurrenciesResponseStatuses
} from 'app/shared/hubble-pos-web-api-responses/get-currencies/get-currencies-response-statuses.enum';
import { ConfigurationParameter } from 'app/shared/configuration-parameter';
import { ConfigurationParameterType } from 'app/shared/configuration-parameter-type.enum';
import { IDictionaryStringKey } from 'app/shared/idictionary';
import { GetPrintingConfigurationResponse } from 'app/shared/web-api-responses/get-printing-configuration-response';
import {
  GetPrintingConfigurationResponseStatuses
} from 'app/shared/web-api-responses/get-printing-configuration-response-statuses.enum';
import { UsecasePrintingConfiguration } from 'app/shared/printing/usecase-printing-configuration';
import { FormatHelper } from '../helpers/format-helper';
import { DecimalPrecisionConfiguration } from 'app/shared/decimal-precision-configuration';
import { PosCommands } from 'app/shared/printing/pos-commands';
import { BusinessComponentsConfiguration } from 'app/shared/business-components-configuration';
import { BusinessType } from 'app/shared/business-type.enum';
// import { FuellingPointsRootComponent } from 'app/components/business-specific/fuelling-points-root/fuelling-points-root.component';
import { GetLiteralsResponse } from 'app/shared/language/get-literals-response';
import { GetLiteralsResponseStatuses } from 'app/shared/language/get-literals-response-statuses.enum';
import { Literal } from 'app/shared/language/literal';
import { LiteralConfig } from 'app/shared/language/literal-config';
import { LogHelper } from 'app/helpers/log-helper';

/***
 ** Application specific configuration (Not changeable by user).
****/
@Injectable()
export class AppDataConfiguration {
  readonly numberOfTickets = 4;
  readonly httpServerUrl = environment.httpServerUrl;
  readonly apiUrl = environment.apiUrl;
  readonly apiUrlCofo = environment.apiUrlCofo;
  readonly signalRUrl = environment.signalRUrl;
  readonly numberOfDocuments = 4;
  readonly defaultPrinterName =
    // IMPRESORA NULA PARA PRUEBAS SIN IMPRESORA FÍSICA:
    // 'IgnorePrintForTesting';
    // IMPRESORA INSTALADA EN POS PARA DEMO:
    //  'NCR Printer';
    // AUTODETECCIÓN DE IMPRESORA PREDETERMINADA:
    //    EL SERVICIO DEBERÁ EJECUTARSE CON LA CUENTA DEL USUARIO DEL PC,
    //   Y SI LA IMPRESORA REQUIERE INTERACCIÓN, LA IMPRESIÓN NO TERMINARÁ
    'Send To OneNote 2013';
  readonly defaultPrinterPaperWidth = 80;
  readonly defaultLogoPrintingFileName = ''; // ruta por defecto del logo a imprimir
  readonly defaultMillisecToWaitBetweenKeypressForSearchProduct = 400;

  readonly defaultElectronicJournalLocalStorageKey: string = 'hubblePOS_RecentElectronicJournal';
  readonly defaultElectronicJournalUploadJournalThreshold: number = 100;
  readonly defaultElectronicJournalMaximumMillisecondsBetweenUploads: number = 60000; // 60000=60s;  36s=36000 ; [3600000 - 1h]

  private _userConfiguration: any = {}; // TODO: Revisar nombre, esta es la configuración recuperada del archivo tpv.config.json
  private _currencyList: Array<Currency> = [];
  private _paymentMethodList: Array<PaymentMethod> = [];
  private _seriesList: Array<Series> = [];
  private _configurationParameterList: Array<ConfigurationParameter> = [];
  private _defaultCountryId: number;
  private _defaultBankCardId: string;
  private _unknownCustomerId: string;
  private _defaultOperator: string;
  private _defaultCustomer: string;
  private _templateList: Array<PrintingTemplate> = [];
  private _printingGlobalSettings: IDictionaryStringKey<string> = {};
  private _company: Company;
  private _shop: Shop;
  private _clockRefreshFrecuency: number;
  private _networkConnectionRefreshFrecuency: number;
  private _mustRequestCustomerPlate: boolean;
  private _maxAmountForTicketWithoutInvoice: number;
  private _maxAmountForUnkownCustomer: number;
  private _decimalPrecisionConfiguration: DecimalPrecisionConfiguration;
  private _pluViewConfiguration: string;
  private _printerPosCommands: PosCommands;
  private _businessComponentsConfiguration: BusinessComponentsConfiguration;

  readonly _defaultPoslanguage: string = 'es-ES';
  private _literals: LiteralConfig[];

  constructor(
    private _http: HttpService,
    private  _logHelper: LogHelper
  ) {
    // TODO: Todos estos valores habrá que recuperarlos del servicio
    this._unknownCustomerId = ''; // '0276300000'; // cliente contado
    this._defaultOperator = ''; // '02763eab'; // TODO: operador por defecto
    this._defaultCustomer = ''; // '02763T0059'; // TODO: cliente por defecto
    this._clockRefreshFrecuency = 45000; // TODO seguramente vendrá de configuración, de momento 45seg REVISABLE
    // TODO seguramente vendrá de configuración, de momento 5seg REVISABLE
    this._networkConnectionRefreshFrecuency = 45000;
  }

  get PaymentMethodList(): Array<PaymentMethod> {
    return this._paymentMethodList;
  }

  //#region fill configuration

  async fillIdentityAsync(): Promise<boolean> {
    let success = true;

    // Get user configuration
    try {
      let posID = 0;
      if (this._userConfiguration.PosId != undefined) {
        posID = this._userConfiguration.PosId;
      }
      this._userConfiguration = await this._http.getJsonPromiseAsync(
        `${this.httpServerUrl}/tpv.config.json?d=${(new Date().getTime())}`);

      if (posID != 0) {
        this._userConfiguration.PosId = posID;
      }
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

    // Get Company information
    try {
      const getCompanyResponse: GetCompanyResponse = await this._getCompanyInformationAsync();
      this.company = getCompanyResponse.company;
    } catch (e) {
      this._logHelper.trace(`ERROR: ${e}`);
      success = false;
    }

    // Get Shop information
    try {
      const getShopResponse: GetShopResponse = await this._getShopInformationAsync();
      this._shop = getShopResponse.shop;
    } catch (e) {
      this._logHelper.trace(`ERROR: ${e}`);
      success = false;
    }

    // Get payment methods
    try {
      const getPaymentMethodsResponse: GetPaymentMethodsResponse = await this._getPaymentMethodsAsync();
      this._paymentMethodList = getPaymentMethodsResponse.paymentMethodList;
      this._defaultBankCardId = getPaymentMethodsResponse.defaultBankCardId;
    } catch (e) {
      this._logHelper.trace(`ERROR: ${e}`);
      success = false;
    }

    // Get currencies
    try {
      const getCurrenciesResponse: GetCurrenciesResponse = await this._getCurrenciesAsync();
      this._currencyList = getCurrenciesResponse.currencyList;
    } catch (e) {
      this._logHelper.trace(`ERROR: ${e}`);
      success = false;
    }

    // Get series
    try {
      const getSeriesResponse: GetSeriesResponse = await this._getSeriesListAsync();
      this._seriesList = getSeriesResponse.seriesList;
    } catch (e) {
      this._logHelper.trace(`ERROR: ${e}`);
      success = false;
    }

    // Get template list and printing global settings
    try {
      const getPrintingConfigurationResponse: GetPrintingConfigurationResponse = await this._getPrintingCofigurationAsync();
      this._templateList = getPrintingConfigurationResponse.templates;
      this._printingGlobalSettings = getPrintingConfigurationResponse.globalSettings;
      this._printerPosCommands = getPrintingConfigurationResponse.posCommands;
    } catch (e) {
      this._logHelper.trace(`ERROR: ${e}`);
      success = false;
    }

        // get literals
        try {
          this._literals = await this.fillLiterals(this.defaultPosLanguage);
        } catch (e) {
          this._logHelper.trace(`ERROR: ${e}`);
          success = false;
        }

    // se comunica con assets/js/process-keyup.js
    this.initializeKeyEventsParameters();
    return success;
  }

  initializeKeyEventsParameters() {
    const checkEANFormatConfigurationParameter: ConfigurationParameter =
      this.getConfigurationParameterByType(ConfigurationParameterType.CheckEANFormat);
    const timeBetweenKeyEventsConfigurationParameter: ConfigurationParameter =
      this.getConfigurationParameterByType(ConfigurationParameterType.TimeBetweenKeyEvents);
    if (checkEANFormatConfigurationParameter != undefined &&
        checkEANFormatConfigurationParameter.meaningfulStringValue != undefined &&
        timeBetweenKeyEventsConfigurationParameter != undefined &&
        timeBetweenKeyEventsConfigurationParameter.meaningfulStringValue != undefined) {
      window.parent.postMessage([checkEANFormatConfigurationParameter.meaningfulStringValue,
                                timeBetweenKeyEventsConfigurationParameter.meaningfulStringValue], '*');
    }
  }

  // pringing global settings
  addOrUpdateGlobalSettings(key: string, value: string) {
    this._printingGlobalSettings[key] = value;
  }

  //#endregion fill configuration

  //#region Getters
  get literals(): Literal[] {
    return this._formatLiteral(this._literals);
  }

  get virtualTerminalSerialNumber(): string {
    return this.getConfigurationParameterByName('VIRTUAL_TERMINAL_SERIAL_NUMBER', 'FLEET').meaningfulStringValue;
  }

  get mustRequestFleet(): boolean {
    if (this._mustRequestCustomerPlate == undefined) {
      const mustRequesCustomerPlateParam = this.getConfigurationParameterByName('VIRTUAL_TERMINAL_SERIAL_NUMBER', 'FLEET');
      if (mustRequesCustomerPlateParam == undefined) {
        this._mustRequestCustomerPlate = false;
      } else {
        this._mustRequestCustomerPlate = true;
      }
    }
    return this._mustRequestCustomerPlate;
  }

  get mustRequestCustomerPlate(): boolean {
    if (this._mustRequestCustomerPlate == undefined) {
      const mustRequesCustomerPlateParam = this.getConfigurationParameterByName('CUSTOMER_PLATE_MUST_BE_REQUESTED', 'FLEET');
      if (mustRequesCustomerPlateParam == undefined) {
        this._mustRequestCustomerPlate = false;
      } else {
        this._mustRequestCustomerPlate =
          (mustRequesCustomerPlateParam.meaningfulStringValue == '1' || mustRequesCustomerPlateParam.meaningfulStringValue == 'true');
      }
    }
    return this._mustRequestCustomerPlate;
  }

  get maxAmountForTicketWithoutInvoice(): number {
    if (this._maxAmountForTicketWithoutInvoice == undefined) {
      const maxAmountForTicketWithoutInvoiceParam = this.getConfigurationParameterByName('MAX_SIMPLE_INVOICE_AMOUNT', 'GENERAL');
      if (maxAmountForTicketWithoutInvoiceParam == undefined) {
        this._maxAmountForTicketWithoutInvoice = 3000;
      } else {
        this._maxAmountForTicketWithoutInvoice = + (maxAmountForTicketWithoutInvoiceParam.meaningfulStringValue);
      }
    }
    return this._maxAmountForTicketWithoutInvoice;
  }

  get maxAmountForUnkownCustomer(): number {
    if (this._maxAmountForUnkownCustomer == undefined) {
      const maxAmountForUnkownCustomerParam = this.getConfigurationParameterByName('MAX_UNKNOWN_CUSTOMER_SALE', 'GENERAL');
      if (maxAmountForUnkownCustomerParam == undefined) {
        this._maxAmountForUnkownCustomer = 100;
      } else {
        this._maxAmountForUnkownCustomer = + (maxAmountForUnkownCustomerParam.meaningfulStringValue);
      }
    }
    return this._maxAmountForUnkownCustomer;
  }

  get pluViewConfiguration(): string {
    if (this._pluViewConfiguration == undefined) {
      const pluViewConfiguration = this.getConfigurationParameterByName('PLU_VIEW_CONFIGURATION', 'GENERAL');
      this._pluViewConfiguration = pluViewConfiguration.meaningfulStringValue;
      if (pluViewConfiguration == undefined) {
        this._pluViewConfiguration = 'CATEGORIES';
      }
    }
    return this._pluViewConfiguration;
  }

  get defaultBankCardId(): string {
    return this._defaultBankCardId;
  }

  get defaultCountryId(): number {
    return this._defaultCountryId;
  }

  get defaultOperator(): string {
    return this._defaultOperator;
  }

  get defaultCustomer(): string {
    return this._defaultCustomer;
  }

  get userConfiguration(): any {
    return this._userConfiguration;
  }

  get paymentMethodList(): PaymentMethod[] {
    return this._paymentMethodList;
  }

  get unknownCustomerId(): string {
    return this._unknownCustomerId;
  }

  get defaultPosPrinterName(): string {
    const defaultPosPrinterNameParameter = this.getConfigurationParameterByType(ConfigurationParameterType.DefaultPosPrinterName);
    if (defaultPosPrinterNameParameter != undefined && defaultPosPrinterNameParameter.meaningfulStringValue != undefined) {
      return defaultPosPrinterNameParameter.meaningfulStringValue;
    } else {
      return this.defaultPrinterName;
    }
  }

  get defaultPosPaperWidth(): number {
    const defaultPosPaperWidthParameter = this.getConfigurationParameterByType(ConfigurationParameterType.DefaultPosPaperWidth);
    if (defaultPosPaperWidthParameter != undefined && defaultPosPaperWidthParameter.meaningfulStringValue != undefined) {
      const paperWidth = parseInt(defaultPosPaperWidthParameter.meaningfulStringValue, 10);
      if (!isNaN(paperWidth)) {
        return paperWidth;
      }
    }
    return this.defaultPrinterPaperWidth;
  }

  get logoPrintingFilename(): string {
    const logoPrintingFilenameParameter = this.getConfigurationParameterByType(ConfigurationParameterType.LogoPrintingFilename);
    if (logoPrintingFilenameParameter != undefined && logoPrintingFilenameParameter.meaningfulStringValue != undefined) {
      return logoPrintingFilenameParameter.meaningfulStringValue;
    } else {
      return this.defaultLogoPrintingFileName;
    }
  }

  get usecasesPrintingConfigurationList(): UsecasePrintingConfiguration[] {
    const usecasesPrintingConfigurationListParameter = this.getConfigurationParameterByType(ConfigurationParameterType.UsecasesPrintingConfiguration);
    const usecasesPrintingConfigurationListParameterCOFO = this.GetPrintingTemplatesCOFO();

    let listaPlatillasTotal: UsecasePrintingConfiguration[] = [];
    let listaPlatillas: UsecasePrintingConfiguration[] = [];
    let listaPlatillasCOFO: UsecasePrintingConfiguration[] = [];

    listaPlatillasTotal = listaPlatillas.concat(listaPlatillasCOFO);

    if (usecasesPrintingConfigurationListParameter != undefined) {
      listaPlatillas = FormatHelper.formatUsecasesPrintingConfigurationListFromObject(
        JSON.parse(usecasesPrintingConfigurationListParameter.meaningfulStringValue));
    }

    if (usecasesPrintingConfigurationListParameterCOFO != undefined) {
      listaPlatillasCOFO = FormatHelper.formatUsecasesPrintingConfigurationListFromObject(
        JSON.parse(usecasesPrintingConfigurationListParameterCOFO.meaningfulStringValue));
    }

    listaPlatillasTotal = listaPlatillas.concat(listaPlatillasCOFO);

    return listaPlatillasTotal;
  }

  get templateList(): PrintingTemplate[] {
    return this._templateList;
  }

  get printingGlobalSettings(): IDictionaryStringKey<string> {
    return this._printingGlobalSettings;
  }

  get clockRefreshFrecuency(): number {
    return this._clockRefreshFrecuency;
  }

  get networkConnectionRefreshFrecuency(): number {
    return this._networkConnectionRefreshFrecuency;
  }

  get configurationParameterList(): ConfigurationParameter[] {
    return this._configurationParameterList;
  }

  get allowPendingPayment(): boolean {
    const allowPendingPaymentParameter: ConfigurationParameter =
      this.getConfigurationParameterByType(ConfigurationParameterType.AllowPendingPaymentForKnownCustomer);
    if (allowPendingPaymentParameter != undefined) {
      if (allowPendingPaymentParameter.meaningfulStringValue == '1' ||
          allowPendingPaymentParameter.meaningfulStringValue.toLowerCase() == 'true' ) {
        return true;
      }
    }
    return false;
  }

  get isDevolutionAsCreditNote(): boolean {
    const isDevolutionAsCreditNoteParameter: ConfigurationParameter =
      this.getConfigurationParameterByType(ConfigurationParameterType.IsDevolutionAsCreditNote);
    if (isDevolutionAsCreditNoteParameter != undefined) {
      if (isDevolutionAsCreditNoteParameter.meaningfulStringValue == '1' ||
          isDevolutionAsCreditNoteParameter.meaningfulStringValue.toLowerCase() == 'true') {
            return true;
      }
    }
    return false;
  }

  get rectifyingSeriesForStandardSaleFunctionalityMode(): FuncionalityMode {
    const rectifyingSeriesForStandardSaleFunctionalityModeParameter: ConfigurationParameter =
      this.getConfigurationParameterByType(ConfigurationParameterType.RectifyingSeriesForStandardSaleFunctionalityMode);
    if (rectifyingSeriesForStandardSaleFunctionalityModeParameter != undefined) {
      if (rectifyingSeriesForStandardSaleFunctionalityModeParameter.meaningfulStringValue == '1' ||
        rectifyingSeriesForStandardSaleFunctionalityModeParameter.meaningfulStringValue.toLowerCase() == 'needed') {
          return FuncionalityMode.ON;
      }
      if (rectifyingSeriesForStandardSaleFunctionalityModeParameter.meaningfulStringValue == '2' ||
        rectifyingSeriesForStandardSaleFunctionalityModeParameter.meaningfulStringValue.toLowerCase() == 'optional') {
          return FuncionalityMode.OPTIONAL;
        }
    }
    return FuncionalityMode.OFF;
  }

  get rectifyingSeriesForInvoiceSaleFunctionalityMode(): FuncionalityMode {
    const rectifyingSeriesForInvoiceSaleFunctionalityModeParameter: ConfigurationParameter =
      this.getConfigurationParameterByType(ConfigurationParameterType.RectifyingSeriesForInvoiceFunctionalityMode);
    if (rectifyingSeriesForInvoiceSaleFunctionalityModeParameter != undefined) {
      if (rectifyingSeriesForInvoiceSaleFunctionalityModeParameter.meaningfulStringValue == '1' ||
        rectifyingSeriesForInvoiceSaleFunctionalityModeParameter.meaningfulStringValue.toLowerCase() == 'needed') {
          return FuncionalityMode.ON;
      }
      if (rectifyingSeriesForInvoiceSaleFunctionalityModeParameter.meaningfulStringValue == '2' ||
        rectifyingSeriesForInvoiceSaleFunctionalityModeParameter.meaningfulStringValue.toLowerCase() == 'optional') {
          return FuncionalityMode.OPTIONAL;
        }
    }
    return FuncionalityMode.OFF;
  }

  get rectifyingSeriesForCreditNoteFunctionalityMode(): FuncionalityMode {
    const rectifyingSeriesForCreditNoteFunctionalityModeParameter: ConfigurationParameter =
      this.getConfigurationParameterByType(ConfigurationParameterType.RectifyingSeriesForCreditNoteunctionalityMode);
    if (rectifyingSeriesForCreditNoteFunctionalityModeParameter != undefined) {
      if (rectifyingSeriesForCreditNoteFunctionalityModeParameter.meaningfulStringValue == '1' ||
        rectifyingSeriesForCreditNoteFunctionalityModeParameter.meaningfulStringValue.toLowerCase() == 'needed') {
          return FuncionalityMode.ON;
      }
      if (rectifyingSeriesForCreditNoteFunctionalityModeParameter.meaningfulStringValue == '2' ||
        rectifyingSeriesForCreditNoteFunctionalityModeParameter.meaningfulStringValue.toLowerCase() == 'optional') {
          return FuncionalityMode.OPTIONAL;
        }
    }
    return FuncionalityMode.OFF;
  }

  get millisecToWaitBetweenKeypressForSearchProduct(): number {
    const millisecToWaitBetweenKeypressForSearchProduct =
      this.getConfigurationParameterByType(ConfigurationParameterType.MillisecToWaitBetweenKeypressForSearchProduct);
    if (millisecToWaitBetweenKeypressForSearchProduct != undefined
      && millisecToWaitBetweenKeypressForSearchProduct.meaningfulStringValue != undefined) {
      const timeToWait = parseInt(millisecToWaitBetweenKeypressForSearchProduct.meaningfulStringValue, 10);
      if (!isNaN(timeToWait)) {
        return timeToWait;
      }
    }
    return this.defaultMillisecToWaitBetweenKeypressForSearchProduct;
  }

  get currencyList(): Array<Currency> {
    return this._currencyList;
  }

  get seriesList(): Array<Series> {
    return this._seriesList;
  }

  get baseCurrency(): Currency {
    if (this._currencyList != undefined) {
      return this._currencyList.find(c => c.priorityType == CurrencyPriorityType.base);
    } else {
      return undefined;
    }
  }

  get secondaryCurrency(): Currency {
    if (this._currencyList != undefined) {
      return this._currencyList.find(c => c.priorityType == CurrencyPriorityType.secondary);
    } else {
      return undefined;
    }
  }

  get maxDaysSpanForCopyDocumentSearch(): number {
    const ret = this.userConfiguration.maxDaysSpanForCopyDocumentSearch;
    return ret == undefined ? 8 : ret;
  }

  get maxDaysSpanForCollectPendingDocumentSearch(): number {
    const ret = this.userConfiguration.maxDaysSpanForCollectPendingDocumentSearch;
    return ret == undefined ? 32 : ret;
  }

  get maxDaysSpanForRunawayDocumentSearch(): number {
    const ret = this.userConfiguration.maxDaysSpanForRunawayDocumentSearch;
    return ret == undefined ? 32 : ret;
  }

  get company(): Company {
    return this._company;
  }

  get shop(): Shop {
    return this._shop;
  }

  // todo leer de configuracion
  get volume(): Volume {
    return {
      symbol: 'l',
      description: 'Litros'
    };
  }

  // TODO: Hardcoded para demo
  get loyaltyProductId(): string {
    return this.company.id + 'LYTY';
  }

  get decimalPrecisionConfiguration(): DecimalPrecisionConfiguration {
    return this._decimalPrecisionConfiguration;
  }

  get printerPosCommands(): PosCommands {
    return this._printerPosCommands;
  }

  getCurrencyByType(currencyType: CurrencyPriorityType): Currency {
    return this.currencyList.find(c => c.priorityType == currencyType);
  }

  getPaymentMethodByType(paymentMethodType: PaymentMethodType): PaymentMethod {
    return this.paymentMethodList.find(pm => pm.type == paymentMethodType);
  }

  getSeriesByType(seriesType: SeriesType): Series {
    return this.seriesList.find(s => s.type == seriesType);
  }
  getSeriesById(idSerie: string): Series {
    return this._seriesList.find(x => x.id == idSerie);
  }

  // Obtiene un parámetro de configuración a partir de un ConfigurationParameterType dado
  getConfigurationParameterByType(configurationParameterType: ConfigurationParameterType): ConfigurationParameter {
    return this._configurationParameterList.find(cp => cp.type == configurationParameterType);
  }

  // Obtiene las plantillas COFO de impresión.
  GetPrintingTemplatesCOFO(): ConfigurationParameter {
    return this._configurationParameterList.find(cp => cp.name == 'PRINTING_TEMPLATES_COFO');
  }

  getConfigurationParameterByName(nparam: string, ngroup: string): ConfigurationParameter {
    return this._configurationParameterList.find(cp => cp.name == nparam && cp.groupName == ngroup);
  }
 /**
  // minimum needed
  get businessComponentsConfiguration(): BusinessComponentsConfiguration {
    return this._businessComponentsConfiguration;
  }
   * Recupera las posiciones decimales para precios unitarios.
   * + Si el tipo de negocio es GasStation, devolverá el que tenga mayor cantidad de decimales entre
   *   las posiciones decimales para precios unitarios de productos de tienda y las posicines decimales
   *   para precios unitarios de productos de pista.
   * + Si el tipo de negocio NO es GasStation, devolverá las posiciones decimales para precios unitarios
   *   de productos de tienda
   * + Si todavía no tiene disponibles los datos necesarios para su decisión, devolverá undefined
   *
   * @readonly
   * @type {(number | undefined)}
   * @memberof MinimumNeededConfiguration
   */
  get decimalPositionsForUnitPricesDependingOfBusinessType(): number | undefined {
    let output: number;
    if (this._businessComponentsConfiguration != undefined) {
      /* Si el tipo de negocio es gasStation,
        * la configuración de decimales para precios unitarios será la mayor
        * entre la de productos de pista y productos de tienda
        */
      if (this._businessComponentsConfiguration.type === BusinessType.gasStation) {
        if (this.decimalPrecisionConfiguration != undefined) {
          if (this.decimalPrecisionConfiguration.decimalPositionsForUnitPricesWithTaxForTrackProduct >
            this.decimalPrecisionConfiguration.decimalPositionsForUnitPricesWithTaxForShopProduct) {
            output = this.decimalPrecisionConfiguration.decimalPositionsForUnitPricesWithTaxForTrackProduct;
          } else {
            output = this.decimalPrecisionConfiguration.decimalPositionsForUnitPricesWithTaxForShopProduct;
          }
        } else {
          this._logHelper.trace('Warning: decimalPositionsForUnitPrices -> Aún no existe this.decimalPrecisionConfiguration.');
          output = undefined;
        }
      } else {
        output = this.decimalPrecisionConfiguration.decimalPositionsForUnitPricesWithTaxForShopProduct;
      }
    } else {
      this._logHelper.trace('Warning: decimalPositionsForUnitPrices -> Aún no existe businessComponentsConfiguration.');

      // Aún no están disponibles los decimales
      if (this.decimalPrecisionConfiguration == undefined) {
        this._logHelper.trace('Warning: decimalPositionsForUnitPrices -> Aún no existe this.decimalPrecisionConfiguration.');
        output = undefined;
      } else {
        output = this.decimalPrecisionConfiguration.decimalPositionsForUnitPricesWithTaxForShopProduct;
      }
    }

    return output;
  }

  get defaultPosLanguage(): string {
    const defaultPosLanguageParameter = this.getConfigurationParameterByType(ConfigurationParameterType.DefaultPosLanguage);
    if (defaultPosLanguageParameter != undefined && defaultPosLanguageParameter.meaningfulStringValue != undefined) {
      return defaultPosLanguageParameter.meaningfulStringValue;
    }
    return this._defaultPoslanguage;
  }

  get isServerMultipleTPV(): boolean {
      const param = this.getConfigurationParameterByName('IS_SERVER_MULTITPV', 'TPV');
      if (param != undefined && param.meaningfulStringValue != undefined) {
        return (param.meaningfulStringValue == '1' || param.meaningfulStringValue == 'true');
      } else {
        return false;
      }
  }

  //#endregion Getters

  //#region Setters

  set defaultBankCardId(defaultBankCardId: string) {
    this._defaultBankCardId = defaultBankCardId;
  }

  set defaultOperator(defaultOperator: string) {
    this._defaultOperator = defaultOperator;
  }

  set defaultCustomer(defaultCustomer: string) {
    this._defaultCustomer = defaultCustomer;
  }

  set defaultCountryId(defaultCountryId: number) {
    this._defaultCountryId = defaultCountryId;
  }

  set userConfiguration(userConfiguration: any) {
    this._userConfiguration = userConfiguration;
  }

  set configurationParameterList(configurationParameterList: ConfigurationParameter[]) {
    this._configurationParameterList = configurationParameterList;
  }

  set paymentMethodList(paymentMethodList: PaymentMethod[]) {
    this._paymentMethodList = paymentMethodList;
  }

  set currencyList(currencyList: Array<Currency>) {
    this._currencyList = currencyList;
  }

  set seriesList(seriesList: Array<Series>) {
    this._seriesList = seriesList;
  }

  set unknownCustomerId(unknownCustomerId: string) {
    this._unknownCustomerId = unknownCustomerId;
  }

  set templateList(templateList: Array<PrintingTemplate>) {
    this._templateList = templateList;
  }

  set printingGlobalSettings(printingGlobalSettings: IDictionaryStringKey<string>) {
    this._printingGlobalSettings = printingGlobalSettings;
  }

  set company(company: Company) {
    this._company = company;
  }

  set shop(shop: Shop) {
    this._shop = shop;
  }

  set clockRefreshFrecuency(time: number) {
    this._clockRefreshFrecuency = time;
  }

  set networkConnectionRefreshFrecuency(time: number) {
    this._networkConnectionRefreshFrecuency = time;
  }

  set decimalPrecisionConfiguration(decimalPrecisionConfiguration: DecimalPrecisionConfiguration) {
    this._decimalPrecisionConfiguration = decimalPrecisionConfiguration;
  }

  set printerPosCommands(printerPosCommands: PosCommands) {
    this._printerPosCommands = printerPosCommands;
  }

  //#endregion Setters

  //#region Aux methods
  private _formatLiteral(configLiterals: LiteralConfig[]): Literal[] {
    if (configLiterals != undefined) {
      return configLiterals.map(x => {
        const literal: Literal  = {
          key: x.key,
          group: x.group,
          value: x.value
        };
        return literal;
      });
    } else {
      return undefined;
    }
  }

  /**
   *
   * @private
   * @returns {Promise<GetCompanyResponse>}
   * @memberof AppDataConfiguration
   * @throws {Error}
   */
  private async _getCompanyInformationAsync(): Promise<GetCompanyResponse> {
    const getCompanyResponse: GetCompanyResponse = await this._http.postJsonPromiseAsync(
      `${this.apiUrl}/GetCompany`, { Identity: this._userConfiguration.Identity });

    if (getCompanyResponse != undefined) {
      if (getCompanyResponse.status == GetCompanyResponseStatuses.successful) {
        this._logHelper.trace('Retrieved company information from service:');
        this._logHelper.trace(getCompanyResponse);
        return getCompanyResponse;
      } else {
        throw new Error(
          `Cannot retrieve company information from service. Service response: ${getCompanyResponse.message}`
        );
      }
    } else {
      throw new Error(`Cannot retrieve company information from service.`);
    }
  }

  /**
   *
   * @private
   * @returns {Promise<GetShopResponse>}
   * @memberof AppDataConfiguration
   * @throws {Error}
   */
  private async _getShopInformationAsync(): Promise<GetShopResponse> {
    const getShopResponse: GetShopResponse = await this._http.postJsonPromiseAsync(
      `${this.apiUrl}/GetShop`, { Identity: this._userConfiguration.Identity });

    if (getShopResponse != undefined) {
      if (getShopResponse.status == GetShopResponseStatuses.successful) {
        this._logHelper.trace('Retrieved shop information from service:');
        this._logHelper.trace(getShopResponse);
        return getShopResponse;
      } else {
        throw new Error(
          `Cannot retrieve shop information from service. Service response: ${getShopResponse.message}`
        );
      }
    } else {
      throw new Error(`Cannot retrieve shop information from service.`);
    }
  }

  /**
   *
   * @private
   * @returns {Promise<GetPaymentMethodsResponse>}
   * @memberof AppDataConfiguration
   * @throws {Error}
   */
  private async _getPaymentMethodsAsync(): Promise<GetPaymentMethodsResponse> {
    const getPaymentMethodsResponse: GetPaymentMethodsResponse = await this._http.postJsonPromiseAsync(
      `${this.apiUrl}/GetPaymentMethods`, { Identity: this._userConfiguration.Identity });

    if (getPaymentMethodsResponse != undefined) {
      if (getPaymentMethodsResponse.status == GetPaymentMethodsResponseStatuses.successful) {
        this._logHelper.trace('Retrieved paymentMethods from service:');
        this._logHelper.trace(getPaymentMethodsResponse);
        return getPaymentMethodsResponse;
      } else {
        throw new Error(`Cannot retrive payment methods from service. Service response: ${getPaymentMethodsResponse.message}`);
      }
    } else {
      throw new Error(`Cannot retrive payment methods from service.`);
    }
  }

  /**
   *
   *
   * @private
   * @returns {Promise<GetCurrenciesResponse>}
   * @memberof AppDataConfiguration
   * @throws {Error}
   */
  private async _getCurrenciesAsync(): Promise<GetCurrenciesResponse> {
    const getCurrenciesResponse: GetCurrenciesResponse = await this._http.postJsonPromiseAsync(
      `${this.apiUrl}/GetCurrencies`, { identity: this._userConfiguration.Identity });

    if (getCurrenciesResponse != undefined) {
      if (getCurrenciesResponse.status == GetCurrenciesResponseStatuses.successful) {
        this._logHelper.trace('Retrieved currencies from service:');
        this._logHelper.trace(getCurrenciesResponse);
        return getCurrenciesResponse;
      } else {
        throw new Error(`Cannot retrive currencies from service. Service response: ${getCurrenciesResponse.message}`);
      }
    } else {
      throw new Error(`Cannot retrive currencies from service.`);
    }
  }

  /**
   *
   *
   * @private
   * @returns {Promise<GetSeriesResponse>}
   * @memberof AppDataConfiguration
   * @throws {Error}
   */
  private async _getSeriesListAsync(): Promise<GetSeriesResponse> {
    const getSeriesResponse: GetSeriesResponse = await this._http.postJsonPromiseAsync(
      `${this.apiUrl}/GetSeries`, { Identity: this._userConfiguration.Identity });

    if (getSeriesResponse != undefined) {
      if (getSeriesResponse.status == GetSeriesResponseStatuses.successful) {
        this._logHelper.trace('Retrieved posConfiguration from service:');
        this._logHelper.trace(getSeriesResponse);
        return getSeriesResponse;
      } else {
        throw new Error(`Cannot retrive series from service. Service response: ${getSeriesResponse.message}`);
      }
    } else {
      throw new Error(`Cannot retrive series from service.`);
    }
  }

  /**
   *
   *
   * @private
   * @returns {Promise<GetPrintingConfigurationResponse>}
   * @memberof AppDataConfiguration
   * @throws {Error}
   */
  private async _getPrintingCofigurationAsync(): Promise<GetPrintingConfigurationResponse> {
    const getPrintingConfigurationResponse: GetPrintingConfigurationResponse = await this._http.postJsonPromiseAsync(
      `${environment.apiUrl}/GetPrintingConfiguration`, {
        Identity: this._userConfiguration.Identity,
        UsecasesPrintingConfigurationList: this.usecasesPrintingConfigurationList
      }
    );

    if (getPrintingConfigurationResponse != undefined) {
      if (getPrintingConfigurationResponse.status == GetPrintingConfigurationResponseStatuses.successful) {
        this._logHelper.trace('Retrieved printing configuration from service:');
        this._logHelper.trace(getPrintingConfigurationResponse);
        return getPrintingConfigurationResponse;
      } else {
        throw new Error(`Cannot retrive printing configuration from service. Service response: ${getPrintingConfigurationResponse.message}`);
      }
    } else {
      throw new Error('Cannot retrive printing configuration from service.');
    }
  }

  /**
 * Recupera la lista de literales del servicio web api
 *
 * @param {string} language
 * @returns {Promise<boolean>}
 * @memberof LanguageService
 * @throws {Error}
 *  + La lista de literales recibida del servicio es nula
 *  + El servicio ha devuelto un status != successful
 *  + La respuesta obtenida del servicio es nula
 */
async fillLiterals(language: string): Promise<Literal[]> {
  const request = { identity: this.userConfiguration.Identity, language: language };
  const getLiteralsResponse: GetLiteralsResponse = await this._http.postJsonPromiseAsync(
    `${environment.apiUrl}/GetLiterals`, request);

  if (getLiteralsResponse != undefined) {
    if (getLiteralsResponse.status == GetLiteralsResponseStatuses.successful) {
      if (getLiteralsResponse.literalsList != undefined) {
        this._logHelper.trace('Retrieved literals from service:');
        return getLiteralsResponse.literalsList;
      } else {
        throw new Error(`Retrive literals are undefined from service. Service response: ${getLiteralsResponse.message}`);
      }
    } else {
      throw new Error(`Cannot retrive literals from service. Service response: ${getLiteralsResponse.message}`);
    }
  } else {
    throw new Error(`Cannot retrive literals from service.`);
  }
}

  get electronicJournalLocalStorageKey(): string {
    const electronicJournalLocalStorageKey =
      this.getConfigurationParameterByName('LOCAL_STORAGE_KEY', 'ELECTRONIC_JOURNAL');
    if (electronicJournalLocalStorageKey != undefined &&
      electronicJournalLocalStorageKey.meaningfulStringValue != undefined &&
      electronicJournalLocalStorageKey.meaningfulStringValue.trim() != '') {
      return electronicJournalLocalStorageKey.meaningfulStringValue;
    } else {
      return this.defaultElectronicJournalLocalStorageKey;
    }
  }

  get electronicJournalUploadJournalThreshold(): number {
    const electronicJournalUploadJournalThreshold =
      this.getConfigurationParameterByName('UPLOAD_JOURNAL_THRESHOLD', 'ELECTRONIC_JOURNAL');
    if (electronicJournalUploadJournalThreshold != undefined
      && electronicJournalUploadJournalThreshold.meaningfulStringValue != undefined) {
      const parsedValue = parseInt(electronicJournalUploadJournalThreshold.meaningfulStringValue, 10);
      if (!isNaN(parsedValue) && parsedValue >= 0) {
        return parsedValue;
      } else {
        return this.defaultElectronicJournalUploadJournalThreshold;
      }
    } else {
      return this.defaultElectronicJournalUploadJournalThreshold;
    }
  }

  get electronicJournalMaximumMillisecondsBetweenUploads(): number {
    const electronicJournalMaximumMillisecondsBetweenUploads =
      this.getConfigurationParameterByName('MAXIMUM_MILLISECONDS_BETWEEN_UPLOADS', 'ELECTRONIC_JOURNAL');
    if (electronicJournalMaximumMillisecondsBetweenUploads != undefined
      && electronicJournalMaximumMillisecondsBetweenUploads.meaningfulStringValue != undefined) {
      const parsedValue = parseInt(electronicJournalMaximumMillisecondsBetweenUploads.meaningfulStringValue, 10);
      if (!isNaN(parsedValue) && parsedValue >= 0) {
        return parsedValue;
      } else {
        return this.defaultElectronicJournalMaximumMillisecondsBetweenUploads;
      }
    } else {
      return this.defaultElectronicJournalMaximumMillisecondsBetweenUploads;
    }
  }

  //#endregion Aux methods
  /** minimum needed
   * Gets the business specific components configuration depending of busines type
   * @private
   * @param {BusinessType} businessType
   * @returns {BusinessComponentsConfiguration}
   * @memberof Configuration
   */
  /** private _getBusinessSpecificComponentsConfiguration(businessType: BusinessType): BusinessComponentsConfiguration {
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
  }*/
}
