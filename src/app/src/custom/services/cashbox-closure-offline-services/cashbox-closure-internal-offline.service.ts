import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { AuxiliarActionsManagerService } from 'app/services/auxiliar-actions/auxiliar-actions-manager.service';
/* import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service'; */
/* import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { LogHelper } from 'app/helpers/log-helper'; */

/* import { CashboxClosureServiceOffline } from 'app/services/cashbox-closure-offline/cashbox-closure-offline.service';
import { DocumentInternalService } from 'app/services/document/document-internal.service'; */
/* import { PrepareCashboxClosureResponses } from 'app/shared/cashbox/prepare-cashbox-closure-responses.enum'; */

@Injectable()
export class CashboxClosureInternalServiceOffline {
  // LITERALES
  acceptLiteral: string;
  errorHeaderLiteral: string;
  openDocumentsNotEmptyLiteral: string;
  noPendingToCloseDocumentsLiteral: string;
  pendingToInsertDocumentLiteral: string;
  genericErrorLiteral: string;
  noOperatorLiteral: string;

  constructor(
/*     private _cashboxClosureServiceOffline: CashboxClosureServiceOffline, */
    private _auxActionsManager: AuxiliarActionsManagerService,
/*     private _documentInternalService: DocumentInternalService,
    private _confirmActionService: ConfirmActionService, */

    // private _statusBarService: StatusBarService,
  ) {
    this.acceptLiteral = 'Aceptar';
    this.errorHeaderLiteral = 'ERROR';
    this.openDocumentsNotEmptyLiteral = 'Cierre de caja no permitido. Todos documentos abiertos deben estar vacíos';
    this.noPendingToCloseDocumentsLiteral = 'Cierre de caja no permitido. No hay documentos pendientes de aplicar en un cierre de caja.';
    this.pendingToInsertDocumentLiteral = 'Cierre de caja no permitido. Hay documentos pendientes de inserción.';
    this.genericErrorLiteral = 'Cierre de caja no permitido. Se produjo un error en la solicitud.';
    this.noOperatorLiteral = 'Cierre de caja no permitido. No hay operador logado.';
  }

  // Las comprobaciones en la apertura se efectúan aquí.
  // Los mensajes de error se emiten en la validación.
  // El llamante decidirá la navegación en caso de éxito o fracaso, pero es aquí donde se abre el panel solicitado.
  /* showCashboxClosure(): Observable<boolean> {
    return Observable.create((observer: Subscriber<Boolean>) => {
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
          } else {
            observer.next(false);
          }
        });
      });
  } */

  // Las comprobaciones en la apertura se efectúan aquí.
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
             this._auxActionsManager.requestCashboxClosureOffline()
              .first()
              .subscribe(showRequestSucceed => {
                if (showRequestSucceed === true) {
                  observer.next(true);
                } else {
                  observer.next(false);
                }
              });
            });
          }
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
   /* private _validateReadyToShowCashboxClosure(): Observable<boolean> {
    return Observable.create((observer: Subscriber<Boolean>) => {
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
          this._cashboxClosureServiceOffline.prepareCashboxClosureOffline()
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
  } */
}
