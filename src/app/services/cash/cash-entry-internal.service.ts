import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { LogHelper } from 'app/helpers/log-helper';
import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { AuxiliarActionsManagerService } from 'app/services/auxiliar-actions/auxiliar-actions-manager.service';
import { DocumentInternalService } from 'app/services/document/document-internal.service';
// import { SignalRPrintingService } from 'app/services/signalr/signalr-printing.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import {
  SendCommandToPrinterResponse
} from 'app/shared/signalr-server-responses/printingModuleHub/send-command-to-printer-response';
import {
  SendCommandToPrinterResponseStatuses
} from 'app/shared/signalr-server-responses/printingModuleHub/send-command-to-printer-response-statuses.enum';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { LanguageService } from 'app/services/language/language.service';
import { PrintingService } from '../printing/printing.service';

@Injectable()
export class CashEntryInternalService {

  // LITERALES
  errorHeaderLiteral: string;

  noOperatorLiteral: string;
  acceptLiteral: string;

  constructor(
    // private _cashEntryService: CashEntryService,
    private _auxActionsManager: AuxiliarActionsManagerService,
    private _documentInternalService: DocumentInternalService,
    private _confirmActionService: ConfirmActionService,
    // private _signalRPrintingServ: SignalRPrintingService,
    private _PrintingService: PrintingService,
    private _appDataConfig: AppDataConfiguration,
    private _languageService: LanguageService,
    private _statusBarService: StatusBarService,
    private _logHelper: LogHelper,
  ) {
    // LITERALES
    this.errorHeaderLiteral = this.getLiteral('cash_entry_internal_service', 'header_CashOut_NoOperator');

    this.noOperatorLiteral = this.getLiteral('cash_entry_internal_service', 'error_CashEntry_NoOperator');
    this.acceptLiteral = this.getLiteral('cash_entry_internal_service', 'button_CashOut_NoOperator');
  }

  // Las comprobaciones en la apertura se efectúan aquí.
  // Los mensajes de error se emiten en la validación.
  // El llamante decidirá la navegación en caso de éxito o fracaso, pero es aquí donde se abre el panel solicitado.
  showCashEntry(): Observable<boolean> {
    const validationSucceed: boolean = this._validateReadyToShowCashEntry();
      this._logHelper.trace(
        `CashEntryInternalService-> Resultado de validación del estado: ${validationSucceed}`
      );
      return Observable.create((observer: Subscriber<boolean>) => {
        if (validationSucceed === true) {
          this._auxActionsManager.requestCashEntry()
          .first().subscribe(showRequestSucceed => {
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
              this._logHelper.trace('Open cash drawer command undefined: ' + this._appDataConfig.printerPosCommands.openDrawer);
            }
          } else {
            this._logHelper.trace('Printer pos command undefined: ' + this._appDataConfig.printerPosCommands);
          }
      } else {
        observer.next(false);
      }
    });
  }
  // Deberá comprobar los siguientes matices:
  //  - Hay operador logado (aunque en teoría está capada la apertura del panel si no lo hubiera)
  private _validateReadyToShowCashEntry(): boolean {
    if (this._documentInternalService != undefined &&
        this._documentInternalService.currentDocument != undefined &&
        this._documentInternalService.currentDocument.operator != undefined) {
      return true;
    } else {
      this._confirmActionService.promptActionConfirm(this.noOperatorLiteral,
                                                    this.acceptLiteral,
                                                    undefined,
                                                    this.errorHeaderLiteral,
                                                    ConfirmActionType.Error);
      return false;
    }
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
