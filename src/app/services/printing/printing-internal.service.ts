import { Injectable } from '@angular/core';
import { PrintingService } from './printing.service';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { LanguageService } from 'app/services/language/language.service';
import { PrintResponseStatuses } from 'app/shared/signalr-server-responses/printingModuleHub/print-response-statuses.enum';
import { LogHelper } from 'app/helpers/log-helper';
import { Document } from 'app/shared/document/document';

@Injectable()
export class PrintingInternalService {

  constructor(
    private _PrintingService: PrintingService,
    private _statusBarService: StatusBarService,
    private _languageService: LanguageService,
    private _logHelper : LogHelper,
    ) { }

  async printDocument(document: Document, useCase: string, numberOfCopies?: number, commandsList?: string[],
    negativeTicket?: boolean) {
      try {
        this._statusBarService.publishProgress(75);
        this._statusBarService.publishMessage(this._languageService.getLiteral('document_service', 'message_StatusBar_Printing'));
        this._PrintingService.printDocument(
          document,
          useCase,
          numberOfCopies, // numero de copias si hay importe pendiente
          commandsList,
          negativeTicket)
          .first().subscribe(respuesta => {
            // TODO: Diferenciar problemas de impresora de problemas en el módulo o el controlador
            //      -cuidado con los problemas que puedan afectar a la SUNAT-
            if (respuesta.status === PrintResponseStatuses.successful) {
              this._statusBarService.publishProgress(100);
              this._statusBarService.publishMessage(this._languageService.getLiteral('document_service', 'message_StatusBar_PritingFinished'));
            } else {
              this._logHelper.logError(undefined, respuesta.message);
              this._statusBarService.publishMessage(
                this._languageService.getLiteral('document_service', 'error_StatusBar_PrintingErrorButDocumentGeneratedCopy'));
            }
          });
      } catch (error) {
        this._statusBarService.publishMessage(
          this._languageService.getLiteral('document_service', 'error_StatusBar_PrintingErrorButDocumentGeneratedCopy'));
          this._logHelper.logError(undefined, error);
          throw error;
      }
  }

  async simulatePrintDocument(document: Document, useCase: string, numberOfCopies?: number, commandsList?: string[]) {

  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

}
