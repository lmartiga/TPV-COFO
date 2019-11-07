import { Injectable } from '@angular/core';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { HttpService } from '../http/http.service';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { PrintResponse } from 'app/shared/signalr-server-responses/printingModuleHub/print-response';
import { UsecasePrintingConfiguration } from 'app/shared/printing/usecase-printing-configuration';
import { LanguageService } from '../language/language.service';
import { FormatHelper } from 'app/helpers/format-helper';
import { Document } from 'app/shared/document/document';
import { LogHelper } from 'app/helpers/log-helper';
import { PrintResponseStatuses } from 'app/shared/signalr-server-responses/printingModuleHub/print-response-statuses.enum';
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
import { SetPrintingTemplatesAndSettingsResponse } from 'app/shared/signalr-server-responses/printingModuleHub/set-printing-templates-and-settings-response';
import { SetPrintingTemplatesAndSettingsResponseStatuses } from 'app/shared/signalr-server-responses/printingModuleHub/set-printing-templates-and-settings-response-statuses.enum';
import { SetPrintingGlobalSettingsResponse } from 'app/shared/signalr-server-responses/printingModuleHub/set-printing-global-settings-response';
import { SetPrintingTemplatesResponse } from 'app/shared/signalr-server-responses/printingModuleHub/set-printing-templates-response';
import { SetPrintingGlobalSettingsResponseStatuses } from 'app/shared/signalr-server-responses/printingModuleHub/set-printing-global-settings-response-statuses.enum';
import { SetPrintingTemplatesResponseStatuses } from 'app/shared/signalr-server-responses/printingModuleHub/set-printing-templates-response-statuses.enum';
import { SetPrintingLiteralsResponseStatuses } from 'app/shared/signalr-server-responses/printingModuleHub/set-printing-literals-response-statuses.enum';
import { SetPrintingLiteralsResponse } from 'app/shared/signalr-server-responses/printingModuleHub/set-printing-literals-response';
import { InformeVentasRecaudacion } from 'app/shared/document/InformeVentasRecaudacion';
import { InformeVentasResumen } from 'app/shared/document/InformeVentasResumen';
import { InformeVentasCategorias } from 'app/shared/document/InformeVentasCategorias';
import { DocumentGroup } from 'app/src/custom/models/DocumentGroup';
import { PaymentDetail } from 'app/shared/payments/payment-detail';
import { Operator } from 'app/shared/operator/operator';
import { CashboxClosureSummary } from 'app/shared/cashbox/cashbox-closure-summary';
import { CashboxRecordType } from 'app/shared/cashbox/cashbox-record-type.enum';
import { CashboxRecordData } from 'app/shared/cashbox/cashbox-record-data';
import { CashboxRecordTypeOffline } from 'app/src/custom/shared/shared-cierre-diferido/cashbox-record-offline-type.enum';
import { CashboxRecordDataOffline } from 'app/src/custom/shared/shared-cierre-diferido/cashbox-record-offline-data';
import { FormatHelperCierre } from 'app/src/custom/helpers/format-helper-cierre';
import { CashboxClosureSummaryOffline } from 'app/src/custom/shared/shared-cierre-diferido/cashbox-closure-offline-summary';
import { FuellingPointTestData } from 'app/shared/fuelling-point/fuelling-point-test-data';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';
import { SendCommandToPrinterResponse } from 'app/shared/signalr-server-responses/printingModuleHub/send-command-to-printer-response';
import { SendCommandToPrinterResponseStatuses } from 'app/shared/signalr-server-responses/printingModuleHub/send-command-to-printer-response-statuses.enum';

@Injectable()
export class PrintingService {

  constructor(private _appDataConfig: AppDataConfiguration,
    private _http: HttpService,
    private _languageService: LanguageService,
    private minimumConfig: MinimumNeededConfiguration,
    private _logHelper: LogHelper) { }

    async startInitializationProcess(): Promise<SetPrintingTemplatesAndSettingsResponse> {
      const response: SetPrintingTemplatesAndSettingsResponse = {
        status: SetPrintingTemplatesAndSettingsResponseStatuses.successful,
        message: 'Ok',
      };
      const responseSetGlobalSettings: SetPrintingGlobalSettingsResponse =
        await this._setPrintingGlobalSettings();
      if (responseSetGlobalSettings.status === SetPrintingGlobalSettingsResponseStatuses.successful) {
        const responseSetTemplate: SetPrintingTemplatesResponse =
          await this._setPrintingTemplates();
        if (responseSetTemplate.status != SetPrintingTemplatesResponseStatuses.successful) {
          response.status = SetPrintingTemplatesAndSettingsResponseStatuses.genericError;
          response.message = 'Se produjo un error al solicitar la ejecución del servicio SignalR SetAvailableTemplates' +
            ` con la siguiente respuesta: ${responseSetTemplate.message}`;
        } else {
          const responseSetLiterals = await this._setPrintingLiterals();
          if (responseSetLiterals.status != SetPrintingLiteralsResponseStatuses.successful) {
            response.status = SetPrintingTemplatesAndSettingsResponseStatuses.genericError;
            response.message = 'Se produjo un error al solicitar la ejecución del servicio SignalR SetPrintingLiterals' +
              ` con la siguiente respuesta: ${responseSetLiterals.message}`;
          }
        }
      } else {
        response.status = SetPrintingTemplatesAndSettingsResponseStatuses.genericError;
        response.message = 'Se produjo un error al solicitar la ejecución del servicio SignalR SetPrintingSettings' +
          ` con la siguiente respuesta: ${responseSetGlobalSettings.message}`;
      }
      return response;
    }

  simulatePrintDocument(document: Document, useCase: string, numberOfCopies?: number, commandsList?: string[]): Observable<PrintResponse> {
    return Observable.create((observer: Subscriber<PrintResponse>) => {
      const printingConfigurationFromUseCase: { 'usecasePrintingConfiguration': UsecasePrintingConfiguration, 'response': PrintResponse } =
        this._getPrintingConfigurationFromUseCase(useCase);
      if (printingConfigurationFromUseCase.usecasePrintingConfiguration != undefined) {
        const usecasePrintingConfiguration = printingConfigurationFromUseCase.usecasePrintingConfiguration;
        const ticketsMode = {
          ticketVentaDevolucion: this.getLiteral('format_helper', 'literal_sale_return_ticket'),
          facturaSimplificada: this.getLiteral('format_helper', 'literal_simplified_invoice'),
          ticketTexto: this.getLiteral('format_helper', 'helper_literal_ticket'),
          loyaltyTexto: this.getLiteral('format_helper', 'literal_loyalty'),
          accumulatedinTexto: this.getLiteral('format_helper', 'literal_accumulated_in'),
          redeemedfromTexto: this.getLiteral('format_helper', 'literal_redeemed_from')
        };
        const request = {
          identity: this._appDataConfig.userConfiguration.Identity,
          operatorId: document.operator.id,
          stringifiedDocumentData: JSON.stringify({
            Document: FormatHelper.formatDocumentToPrintingModuleHubExpectedObject(
              document,
              this._appDataConfig.userConfiguration.Identity,
              this._appDataConfig.paymentMethodList,
              this._appDataConfig.currencyList,
              this._appDataConfig.baseCurrency,
              this._appDataConfig.company,
              this._appDataConfig.shop,
              this._appDataConfig.userConfiguration.PosId,
              ticketsMode
            )
          }),
          numberOfCopies: numberOfCopies == undefined ? usecasePrintingConfiguration.defaultNumberOfCopies : numberOfCopies,
          targetPrinterName: this._appDataConfig.defaultPosPrinterName,
          paperWidth: this._appDataConfig.defaultPosPaperWidth,
          templateName: usecasePrintingConfiguration.useCase,
          commandsList: commandsList,
        };

        this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/SimulatePrint`, request).then(
          (response: PrintResponse) => {
            observer.next(response);
          },
          error => {
            const message: string = `Se produjo un error al solicitar la ejecución del servicio Web SimulatePrint: ${error}`;
            this._logHelper.trace(message);
            const response: PrintResponse = {
              status: PrintResponseStatuses.genericError,
              message: message
            };
            observer.next(response);
          });

      } else {
        observer.next(printingConfigurationFromUseCase.response);
      }
    });
  }

  // Se introduce el campo negativeTicket para cuando queramos imprimir tickets negativos
  printDocument(document: Document, useCase: string, numberOfCopies?: number, commandsList?: string[],
    negativeTicket?: boolean): Observable<PrintResponse> {
    return Observable.create((observer: Subscriber<PrintResponse>) => {
      const printingConfigurationFromUseCase: { 'usecasePrintingConfiguration': UsecasePrintingConfiguration, 'response': PrintResponse } =
        this._getPrintingConfigurationFromUseCase(useCase);
      if (printingConfigurationFromUseCase.usecasePrintingConfiguration != undefined) {
        const usecasePrintingConfiguration = printingConfigurationFromUseCase.usecasePrintingConfiguration;
        const ticketsMode = {
          ticketVentaDevolucion: this.getLiteral('format_helper', 'literal_sale_return_ticket'),
          facturaSimplificada: this.getLiteral('format_helper', 'literal_simplified_invoice'),
          ticketTexto: this.getLiteral('format_helper', 'helper_literal_ticket'),
          loyaltyTexto: this.getLiteral('format_helper', 'literal_loyalty'),
          accumulatedinTexto: this.getLiteral('format_helper', 'literal_accumulated_in'),
          redeemedfromTexto: this.getLiteral('format_helper', 'literal_redeemed_from')
        };
        if (negativeTicket == undefined || negativeTicket) {
          document.lines = document.lines.filter(x => x.quantity > 0 && x.isRemoved != false);
        }
        const request = {
          identity: this._appDataConfig.userConfiguration.Identity,
          stringifiedDocumentData: JSON.stringify({
            Document: FormatHelper.formatDocumentToPrintingModuleHubExpectedObject(
              document,
              this._appDataConfig.userConfiguration.Identity,
              this._appDataConfig.paymentMethodList,
              this._appDataConfig.currencyList,
              this._appDataConfig.baseCurrency,
              this._appDataConfig.company,
              this._appDataConfig.shop,
              this._appDataConfig.userConfiguration.PosId,
              ticketsMode
            )
          }),
          numberOfCopies: numberOfCopies == undefined ? usecasePrintingConfiguration.defaultNumberOfCopies : numberOfCopies,
          targetPrinterName: this._appDataConfig.defaultPosPrinterName,
          paperWidth: this._appDataConfig.defaultPosPaperWidth,
          templateName: usecasePrintingConfiguration.useCase,
          commandsList: commandsList,
        };
        this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/Print`, request).then(
          (response: PrintResponse) => {
            observer.next(response);
          },
          error => {
            const message: string = `Se produjo un error al solicitar la ejecución del servicio WEb Print: ${error}`;
            this._logHelper.trace(message);
            const response: PrintResponse = {
              status: PrintResponseStatuses.genericError,
              message: message
            };
            observer.next(response);
          });
      } else {
        observer.next(printingConfigurationFromUseCase.response);
      }
    });
  }

    // Imprimir informe de ventas
    printDocumentInformeVentas(documentListRecaudacion: InformeVentasRecaudacion[], documentListVentas: InformeVentasResumen[],
      listaAPintarCategorias: InformeVentasCategorias[] , useCase: string, numberOfCopies?: number, commandsList?: string[],
      negativeTicket?: boolean): Boolean  {
      return Observable.create((observer: Subscriber<boolean>) => {
        const printingConfigurationFromUseCase: { 'usecasePrintingConfiguration': UsecasePrintingConfiguration, 'response': PrintResponse } =
          this._getPrintingConfigurationFromUseCase(useCase);
        if (printingConfigurationFromUseCase.usecasePrintingConfiguration != undefined) {
          const usecasePrintingConfiguration = printingConfigurationFromUseCase.usecasePrintingConfiguration;
          const request = {
            identity: this._appDataConfig.userConfiguration.Identity,
            stringifiedDocumentData: JSON.stringify({
              documentListRecaudacion: documentListRecaudacion,
              documentListVentas: documentListVentas,
              listaAPintarCategorias: listaAPintarCategorias
            }),
            numberOfCopies: numberOfCopies == undefined ? usecasePrintingConfiguration.defaultNumberOfCopies : numberOfCopies,
            targetPrinterName: this._appDataConfig.defaultPosPrinterName,
            paperWidth: this._appDataConfig.defaultPosPaperWidth,
            templateName: usecasePrintingConfiguration.useCase,
            commandsList: commandsList,
          };

        this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/Print`, request).then(
          (response: PrintResponse) => {
            observer.next(true);
          },
          error => {
            const message: string = `Se produjo un error al solicitar la ejecución del servicio WEb Print: ${error}`;
            this._logHelper.trace(message);
            observer.next(false);
          });

        } else {
          observer.next(false);
        }
      });
    }
    
    // método para imprimir el justificante de pago de varias deudas
printDocumentDeudasMasiva(documentGroup: DocumentGroup, useCase: string, paymentDetailList: PaymentDetail[],
  numberOfCopies?: number, commandsList?: string[]): Observable<PrintResponse> {
  return Observable.create((observer: Subscriber<PrintResponse>) => {
    const printingConfigurationFromUseCase: { 'usecasePrintingConfiguration': UsecasePrintingConfiguration, 'response': PrintResponse } =
      this._getPrintingConfigurationFromUseCase(useCase);
    const usecasePrintingConfiguration = printingConfigurationFromUseCase.usecasePrintingConfiguration;
      const request = {
        identity: this._appDataConfig.userConfiguration.Identity,
        stringifiedDocumentData: JSON.stringify({
          Document: FormatHelper.formatDocumentDeudasMasivaToPrintingModuleHubExpectedObject(
            documentGroup,
            this._appDataConfig.userConfiguration.Identity,
            this._appDataConfig.paymentMethodList,
            this._appDataConfig.currencyList,
            this._appDataConfig.baseCurrency,
            this._appDataConfig.company,
            this._appDataConfig.shop,
            this._appDataConfig.userConfiguration.PosId,
            paymentDetailList
          )
        }),
        numberOfCopies: numberOfCopies == undefined ? usecasePrintingConfiguration.defaultNumberOfCopies : numberOfCopies,
        targetPrinterName: this._appDataConfig.defaultPosPrinterName,
        paperWidth: this._appDataConfig.defaultPosPaperWidth,
        templateName: useCase,
        commandsList: commandsList
      };

      this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/Print`, request).then(
        (response: PrintResponse) => {
          observer.next(response);
        },
        error => {
          const message: string = `Se produjo un error al solicitar la ejecución del servicio WEb Print: ${error}`;
          this._logHelper.trace(message);
          const response: PrintResponse = {
            status: PrintResponseStatuses.genericError,
            message: message
          };
          observer.next(response);
        });
  });
}

printCashboxClosure(operator: Operator, document: CashboxClosureSummary): Observable<PrintResponse> {
  return Observable.create((observer: Subscriber<PrintResponse>) => {
    const printingTemplateMapFromUseCase: { 'usecasePrintingConfiguration': UsecasePrintingConfiguration, 'response': PrintResponse } =
      this._getPrintingConfigurationFromUseCase('CLOSURE');
    if (printingTemplateMapFromUseCase.usecasePrintingConfiguration != undefined) {
      const usecasePrintingConfiguration = printingTemplateMapFromUseCase.usecasePrintingConfiguration;
      const request = {
        identity: this._appDataConfig.userConfiguration.Identity,
        operatorId: operator.id,
        // stringifiedDocumentData: JSON.stringify({ Document: document }),
        cashboxClosureDocument: document,
        company: this._appDataConfig.company,
        shop: this._appDataConfig.shop,
        numberOfCopies: usecasePrintingConfiguration.defaultNumberOfCopies,
        targetPrinterName: this._appDataConfig.defaultPosPrinterName,
        paperWidth: this._appDataConfig.defaultPosPaperWidth,
        templateName: usecasePrintingConfiguration.useCase,
      };
        this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/PrintCashboxClosure`, request).then(
          (response: PrintResponse) => {
            observer.next(response);
          },
          error => {
            const message: string = `Se produjo un error al solicitar la ejecución del servicio WEb PrintCashboxClosure: ${error}`;
            this._logHelper.trace(message);
            const response: PrintResponse = {
              status: PrintResponseStatuses.genericError,
              message: message
            };
            observer.next(response);
          });
    } else {
      observer.next(printingTemplateMapFromUseCase.response);
    }
  });
}

printCashboxRecord(
  operator: Operator,
  recordType: CashboxRecordType,
  cashboxRecordData: CashboxRecordData,
  currentDateTime: Date
): Observable<PrintResponse> {
  return Observable.create((observer: Subscriber<PrintResponse>) => {
    const printingTemplateMapFromUseCase: { 'usecasePrintingConfiguration': UsecasePrintingConfiguration, 'response': PrintResponse } =
      this._getPrintingConfigurationFromUseCase('CASHBOX_RECORD');
    if (printingTemplateMapFromUseCase.usecasePrintingConfiguration != undefined) {
      const usecasePrintingConfiguration = printingTemplateMapFromUseCase.usecasePrintingConfiguration;
      const ticketsEntryExit = {entrada: this.getLiteral('options_components', 'options_entry'),
                           salida: this.getLiteral('options_components', 'options_exit')
                          };
      const request = {
        identity: this._appDataConfig.userConfiguration.Identity,
        operatorId: operator.id,
        stringifiedDocumentData: JSON.stringify({
          Document: FormatHelper.formatCashboxRecordToPrintingModuleHubExpectedObject(
            operator,
            recordType,
            cashboxRecordData,
            this._appDataConfig.company,
            this._appDataConfig.shop,
            currentDateTime,
            this._appDataConfig.userConfiguration.PosId,
            ticketsEntryExit
          )
        }),
        numberOfCopies: usecasePrintingConfiguration.defaultNumberOfCopies,
        targetPrinterName: this._appDataConfig.defaultPosPrinterName,
        paperWidth: this._appDataConfig.defaultPosPaperWidth,
        templateName: usecasePrintingConfiguration.useCase,
      };
      this._logHelper.trace(`json para la impresión de '${request.templateName}': ${request.stringifiedDocumentData}`);
        this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/Print`, request).then(
          (response: PrintResponse) => {
            observer.next(response);
          },
          error => {
            const message: string = `Se produjo un error al solicitar la ejecución del servicio WEb Print: ${error}`;
            this._logHelper.trace(message);
            const response: PrintResponse = {
              status: PrintResponseStatuses.genericError,
              message: message
            };
            observer.next(response);
          });

    } else {
      observer.next(printingTemplateMapFromUseCase.response);
    }
  });
}

printCashboxOfflineRecord(
  operator: Operator,
  tanotacion: CashboxRecordTypeOffline,
  cashboxRecordData: CashboxRecordDataOffline,
  currentDateTime: Date,
): Observable<PrintResponse> {
  return Observable.create((observer: Subscriber<PrintResponse>) => {
    const printingTemplateMapFromUseCase: { 'usecasePrintingConfiguration': UsecasePrintingConfiguration, 'response': PrintResponse } =
    this._getPrintingConfigurationFromUseCase('CASHBOX_RECORD_OFF');

    if (printingTemplateMapFromUseCase.usecasePrintingConfiguration != undefined) {
      const printingTemplateMap = printingTemplateMapFromUseCase.usecasePrintingConfiguration;
      const ticketsEntryExit = {entrada: this.getLiteral('options_components', 'options_entry'),
                           salida: this.getLiteral('options_components', 'options_exit')
                          };
      const request = {
        identity: this._appDataConfig.userConfiguration.Identity,
        operatorId: operator.id,
        operatorname: operator.name,
        stringifiedDocumentData: JSON.stringify({
          Document: FormatHelperCierre.formatCashboxRecordOfflineToPrintingModuleHubExpectedObject(
            operator,
            this.minimumConfig.POSInformation,
            tanotacion,
            cashboxRecordData,
            this._appDataConfig.company,
            this._appDataConfig.shop,
            currentDateTime,
            this._appDataConfig.userConfiguration.PosId,
            ticketsEntryExit
          )
        }),
        numberOfCopies: printingTemplateMap.defaultNumberOfCopies,
        targetPrinterName: this._appDataConfig.defaultPosPrinterName,
        templateName: printingTemplateMap.useCase,
        paperWidth: this._appDataConfig.defaultPosPaperWidth,
      };
      this._logHelper.trace(`json para la impresión de '${request.templateName}': ${request.stringifiedDocumentData}`);

      this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/Print`, request).then(
        (response: PrintResponse) => {
          observer.next(response);
        },
        error => {
          const message: string = `Se produjo un error al solicitar la ejecución del servicio WEb Print: ${error}`;
          this._logHelper.trace(message);
          const response: PrintResponse = {
            status: PrintResponseStatuses.genericError,
            message: message
          };
          observer.next(response);
        });

    } else {
      observer.next(printingTemplateMapFromUseCase.response);
    }
  });
}

printCashboxOfflineClosure(
  operador: Operator,
  document: CashboxClosureSummaryOffline
  ): Observable<PrintResponse> {
  return Observable.create((observer: Subscriber<PrintResponse>) => {
    const printingTemplateMapFromUseCase: { 'usecasePrintingConfiguration': UsecasePrintingConfiguration, 'response': PrintResponse } =
      this._getPrintingConfigurationFromUseCase('CLOSURE_OFF'); /* CLOSURE_OFF CASHBOX_RECORD_OFF */
    if (printingTemplateMapFromUseCase.usecasePrintingConfiguration != undefined) {
      const usecasePrintingConfiguration = printingTemplateMapFromUseCase.usecasePrintingConfiguration;
      const request = {
        identity: this._appDataConfig.userConfiguration.Identity,
        operador: operador.id,
        stringifiedDocumentData: JSON.stringify({
        Document: FormatHelperCierre.formatClosureOfflineToPrintingModuleHubExpectedObject(
          operador,
          document,
          this._appDataConfig.userConfiguration.PosId
        )
      }),
        numberOfCopies: usecasePrintingConfiguration.defaultNumberOfCopies,
        targetPrinterName: this._appDataConfig.defaultPosPrinterName,
        paperWidth: this._appDataConfig.defaultPosPaperWidth,
        templateName: usecasePrintingConfiguration.useCase,
      };
      this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/Print`, request).then(
        (response: PrintResponse) => {
          observer.next(response);
        },
        error => {
          const message: string = `Se produjo un error al solicitar la ejecución del servicio WEb Print: ${error}`;
          this._logHelper.trace(message);
          const response: PrintResponse = {
            status: PrintResponseStatuses.genericError,
            message: message
          };
          observer.next(response);
        });
    } else {
      observer.next(printingTemplateMapFromUseCase.response);
    }
  });
}

printFuellingPointTest(operator: Operator,
  fuellingTestEntryData: FuellingPointTestData,
  defaultFuellingTankCaption: string,
  tankCaption: string,
  supplyTransaction: SuplyTransaction,
  currentDateTime: Date
): Observable<PrintResponse> {
  return Observable.create((observer: Subscriber<PrintResponse>) => {
    const printingTemplateMapFromUseCase: { 'usecasePrintingConfiguration': UsecasePrintingConfiguration, 'response': PrintResponse } =
      this._getPrintingConfigurationFromUseCase('FUELLINGPOINT_TEST');
    if (printingTemplateMapFromUseCase.usecasePrintingConfiguration != undefined) {
      const usecasePrintingConfiguration = printingTemplateMapFromUseCase.usecasePrintingConfiguration;
      const request = {
        identity: this._appDataConfig.userConfiguration.Identity,
        operatorId: operator.id,
        stringifiedDocumentData: JSON.stringify({
          Document: FormatHelper.formatFuellingPointTestToPrintingModuleHubExpectedObject(
            operator,
            fuellingTestEntryData,
            supplyTransaction,
            tankCaption,
            defaultFuellingTankCaption,
            this._appDataConfig.userConfiguration.PosId,
            currentDateTime
          )
        }),
        numberOfCopies: usecasePrintingConfiguration.defaultNumberOfCopies,
        targetPrinterName: this._appDataConfig.defaultPosPrinterName,
        paperWidth: this._appDataConfig.defaultPosPaperWidth,
        templateName: usecasePrintingConfiguration.useCase,
      };
      this._logHelper.trace(`json para la impresión de '${request.templateName}': ${request.stringifiedDocumentData}`);

      this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/Print`, request).then(
        (response: PrintResponse) => {
          observer.next(response);
        },
        error => {
          const message: string = `Se produjo un error al solicitar la ejecución del servicio WEb Print: ${error}`;
          this._logHelper.trace(message);
          const response: PrintResponse = {
            status: PrintResponseStatuses.genericError,
            message: message
          };
          observer.next(response);
        });

    } else {
      observer.next(printingTemplateMapFromUseCase.response);
    }
  });
}

sendCommandToPrinter(command: string, printerName: string): Observable<SendCommandToPrinterResponse> {
  return Observable.create((observer: Subscriber<SendCommandToPrinterResponse>) => {

    const request = {
      identity: this._appDataConfig.userConfiguration.Identity,
      command: command,
      printerName: printerName,
    };

    this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/SendCommandToPrinter`, request).then(
      (response: SendCommandToPrinterResponse) => {
        observer.next(response);
      },
      error => {
        const message: string = `Se produjo un error al solicitar la ejecución del servicio WEb SendCommandToPrinter: ${error}`;
        this._logHelper.trace(message);
        const response: SendCommandToPrinterResponse = {
          status: SendCommandToPrinterResponseStatuses.genericError,
          message: message
        };
        observer.next(response);
      });

  });
}

printDirectHub(stringifiedDocumentData: string, useCase: string, numberOfCopies?: number, commandsList?: string[]): Observable<PrintResponse> {
  return Observable.create((observer: Subscriber<PrintResponse>) => {
    const printingConfigurationFromUseCase: { 'usecasePrintingConfiguration': UsecasePrintingConfiguration, 'response': PrintResponse } =
      this._getPrintingConfigurationFromUseCase(useCase);
    if (printingConfigurationFromUseCase.usecasePrintingConfiguration != undefined) {
      const usecasePrintingConfiguration = printingConfigurationFromUseCase.usecasePrintingConfiguration;
      const request = {
        identity: this._appDataConfig.userConfiguration.Identity,
        stringifiedDocumentData: stringifiedDocumentData,
        numberOfCopies: numberOfCopies == undefined ? usecasePrintingConfiguration.defaultNumberOfCopies : numberOfCopies,
        targetPrinterName: this._appDataConfig.defaultPosPrinterName,
        paperWidth: this._appDataConfig.defaultPosPaperWidth,
        templateName: usecasePrintingConfiguration.useCase,
        commandsList: commandsList,
      };
     
        this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/Print`, request).then(
          (response: PrintResponse) => {
            observer.next(response);
          },
          error => {
            const message: string = `Se produjo un error al solicitar la ejecución del servicio WEb Print: ${error}`;
            this._logHelper.trace(message);
            const response: PrintResponse = {
              status: PrintResponseStatuses.genericError,
              message: message
            };
            observer.next(response);
          });

    } else {
      observer.next(printingConfigurationFromUseCase.response);
    }
  });
}

  private _getPrintingConfigurationFromUseCase(useCase: string): { 'usecasePrintingConfiguration': UsecasePrintingConfiguration, 'response': PrintResponse } {
    let response: PrintResponse;
    let usecasePrintingConfiguration: UsecasePrintingConfiguration;
    const usecasesPrintingConfigurationList: UsecasePrintingConfiguration[] = this._appDataConfig.usecasesPrintingConfigurationList;
    if (usecasesPrintingConfigurationList != undefined) {
      usecasePrintingConfiguration = usecasesPrintingConfigurationList.find(p => p.useCase == useCase);
      if (usecasePrintingConfiguration != undefined) {
        response = {
          status: PrintResponseStatuses.successful,
          message: '',
        };
      } else {
        response = {
          status: PrintResponseStatuses.genericError,
          message: `Se produjo un error al solicitar el mapeo de los printing templates para el` +
            ` caso de uso: ${useCase} con el mapeo ${usecasePrintingConfiguration}`,
        };
        this._logHelper.trace(response.message);
      }
    } else {
      response = {
        status: PrintResponseStatuses.genericError,
        message:
          `Se produjo un error al solicitar el mapeo de los printing templates desde parametro de configuracion ${usecasePrintingConfiguration}`,
      };
      this._logHelper.trace(response.message);
    }
    return { usecasePrintingConfiguration, response };
  }

  private async _setPrintingTemplates(): Promise<SetPrintingTemplatesResponse> {
    const request = {
      templates: this._appDataConfig.templateList
    };
    return this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/SetAvailableTemplates`, request);
 }

  private async _setPrintingGlobalSettings(): Promise<SetPrintingGlobalSettingsResponse> {
    const request = {
      printingSettings: this._appDataConfig.printingGlobalSettings
    };
    return this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/SetPrintingSettings`, request);
  }

  private async _setPrintingLiterals(): Promise<SetPrintingLiteralsResponse> {
    const request = {
      printingLiterals: this._languageService.getPrintingLiterals()
    };
    return this._http.postJsonPromiseAsync(`${this._appDataConfig.apiUrl}/SetPrintingLiterals`, request);
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
