import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { LogHelper } from 'app/helpers/log-helper';
import { AuxiliarActionsManagerService } from 'app/services/auxiliar-actions/auxiliar-actions-manager.service';
import { CashboxClosureService } from 'app/services/cashbox-closure/cashbox-closure.service';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
import { PrepareCashboxClosureResponses } from 'app/shared/cashbox/prepare-cashbox-closure-responses.enum';
// import { SignalRPrintingService } from 'app/services/signalr/signalr-printing.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import {
  SendCommandToPrinterResponse
} from 'app/shared/signalr-server-responses/printingModuleHub/send-command-to-printer-response';
import {
  SendCommandToPrinterResponseStatuses
} from 'app/shared/signalr-server-responses/printingModuleHub/send-command-to-printer-response-statuses.enum';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { LanguageService } from 'app/services/language/language.service';
import { PrintingService } from '../printing/printing.service';

@Injectable()
export class CashboxClosureInternalService {
  // LITERALES
  acceptLiteral: string;
  errorHeaderLiteral: string;
  openDocumentsNotEmptyLiteral: string;
  noPendingToCloseDocumentsLiteral: string;
  pendingToInsertDocumentLiteral: string;
  genericErrorLiteral: string;
  noOperatorLiteral: string;

  constructor(
    private _cashboxClosureService: CashboxClosureService,
    private _auxActionsManager: AuxiliarActionsManagerService,
    private _documentInternalService: DocumentInternalService,
    private _confirmActionService: ConfirmActionService,
    // private _signalRPrintingServ: SignalRPrintingService,
    private _PrintingService: PrintingService,
    private _appDataConfig: AppDataConfiguration,
    private _statusBarService: StatusBarService,
    private _languageService: LanguageService,
    private _logHelper: LogHelper,
    // private _statusBarService: StatusBarService,
  ) {
    this.acceptLiteral = this.getLiteral('cashbox_closure_internal_service', 'acceptLiteral');
    this.errorHeaderLiteral = this.getLiteral('common', 'error');
    this.openDocumentsNotEmptyLiteral = this.getLiteral('cashbox_closure_internal_service', 'openDocumentsNotEmptyLiteral');
    this.noPendingToCloseDocumentsLiteral = this.getLiteral('cashbox_closure_internal_service', 'noPendingToCloseDocumentsLiteral');
    this.pendingToInsertDocumentLiteral = this.getLiteral('cashbox_closure_internal_service', 'pendingToInsertDocumentLiteral');
    this.genericErrorLiteral = this.getLiteral('cashbox_closure_internal_service', 'genericErrorLiteral');
    this.noOperatorLiteral = this.getLiteral('cashbox_closure_internal_service', 'noOperatorLiteral');
  }

  // Las comprobaciones en la apertura se efectúan aquí.
  // Los mensajes de error se emiten en la validación.
  // El llamante decidirá la navegación en caso de éxito o fracaso, pero es aquí donde se abre el panel solicitado.
  showCashboxClosure(): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      this._validateReadyToShowCashboxClosure()
        .first()
        .subscribe(validationSucceed => {
          this._logHelper.trace(
            `CashboxClosureInternalService-> Resultado de validación del estado: ${validationSucceed}`
          );
          if (validationSucceed === true) {
            this._auxActionsManager.requestCashboxClosure()
              .first()
              .subscribe(showRequestSucceed => {
                if (showRequestSucceed === true) {
                  observer.next(true);
                } else {
                  observer.next(false);
                }
              });
              if (this._appDataConfig.printerPosCommands != undefined) {
                if (this._appDataConfig.printerPosCommands.openDrawer != undefined) {
                  this._PrintingService.sendCommandToPrinter(
                    this._appDataConfig.printerPosCommands.openDrawer, this._appDataConfig.defaultPosPrinterName)
                  .first()
                  .subscribe(
                    (sendCommandToPrinterResponse: SendCommandToPrinterResponse) => {
                      if (sendCommandToPrinterResponse.status == SendCommandToPrinterResponseStatuses.successful) {
                        this._statusBarService.publishMessage(this.getLiteral('common', 'drawerOpened'));
                      } else {
                        this._statusBarService.publishMessage(this.getLiteral('common', 'errorOpeningDrawer'));
                      }
                  });
                } else {
                  this._logHelper.trace('Open cash drawer commad undefined: ' + this._appDataConfig.printerPosCommands.openDrawer);
                }
              } else {
                this._logHelper.trace('Printer pos command undefined: ' + this._appDataConfig.printerPosCommands);
              }
          } else {
            observer.next(false);
          }
        });
      });
  }

  /* // Las comprobaciones en la apertura se efectúan aquí.
  // Los mensajes de error se emiten en la validación.
  // El llamante decidirá la navegación en caso de éxito o fracaso, pero es aquí donde se abre el panel solicitado.
  showCashboxClosureOffline(): Observable<boolean> {
    return Observable.create((observer: Subscriber<Boolean>) => {
      /* this._validateReadyToShowCashboxClosure()
        .first()
        .subscribe(validationSucceed => {
          this._logHelper.trace(
            `CashboxClosureInternalService-> Resultado de validación del estado: ${validationSucceed}`
          );
          if (validationSucceed === true) { */
           /*  this._auxActionsManager.requestCashboxClosureOffline()
              .first()
              .subscribe(showRequestSucceed => {
                if (showRequestSucceed === true) {
                  observer.next(true);
                } else {
                  observer.next(false);
                }
              });
            });
          } */
        /* else {
            observer.next(false);
          }
        });
      });
  } */

  // Deberá comprobar los siguientes matices:
  //  - Hay operador logado (aunque en teoría está capada la apertura del panel si no lo hubiera)
  //  - No hay líneas en NINGÚN documento (tickets)
  //  - Todos los documentos generados por este POS están sincronizados con plataforma.
  //  - Hay documentos pendientes de aplicar en un cierre de caja.
  //  [OPCIONAL] Si no los hubiera, se preguntaría si se quiere imprimir el último cierre generado.
  private _validateReadyToShowCashboxClosure(): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      if (this._documentInternalService != undefined &&
        this._documentInternalService.currentDocument != undefined &&
        this._documentInternalService.currentDocument.operator != undefined) {
        if (this._documentInternalService.isAnyActiveDocumentWithLines() == true) {
          this._confirmActionService.promptActionConfirm(this.openDocumentsNotEmptyLiteral,
                                                        this.acceptLiteral,
                                                        undefined,
                                                        this.errorHeaderLiteral,
                                                        ConfirmActionType.Error);
          observer.next(false);
        } else {
          this._cashboxClosureService.prepareCashboxClosure()
            .first()
            .subscribe(response => {
              if (response == PrepareCashboxClosureResponses.Ready) {
                observer.next(true);
              } else {
                if (response == PrepareCashboxClosureResponses.NoPendingToCloseDocuments) {
                  this._confirmActionService.promptActionConfirm(this.noPendingToCloseDocumentsLiteral,
                                                        this.acceptLiteral,
                                                        undefined,
                                                        this.errorHeaderLiteral,
                                                        ConfirmActionType.Error);
                } else if (response == PrepareCashboxClosureResponses.NotReadyDueToPendingToInsertDocuments) {
                  this._confirmActionService.promptActionConfirm(this.pendingToInsertDocumentLiteral,
                                                        this.acceptLiteral,
                                                        undefined,
                                                        this.errorHeaderLiteral,
                                                        ConfirmActionType.Error);
                } else {
                  this._confirmActionService.promptActionConfirm(this.genericErrorLiteral,
                                                        this.acceptLiteral,
                                                        undefined,
                                                        this.errorHeaderLiteral,
                                                        ConfirmActionType.Error);
                }
                observer.next(false);
              }
            });
        }
      } else {
        this._confirmActionService.promptActionConfirm(this.noOperatorLiteral,
                                                        this.acceptLiteral,
                                                        undefined,
                                                        this.errorHeaderLiteral,
                                                        ConfirmActionType.Error);
        observer.next(false);
      }
    });
  }
  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
