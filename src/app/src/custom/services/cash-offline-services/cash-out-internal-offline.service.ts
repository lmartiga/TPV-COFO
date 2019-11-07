import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { AuxiliarActionsManagerService } from 'app/services/auxiliar-actions/auxiliar-actions-manager.service';


/* import { ConfirmActionService } from 'app/services/confirm-action/confirm-action.service';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { LogHelper } from 'app/helpers/log-helper'; */

/* import { DocumentInternalService } from 'app/services/document/document-internal.service'; */

@Injectable()
export class CashOutInternalServiceOffline {
  // LITERALES
  errorHeaderLiteral: string;

  noOperatorLiteral: string;
  acceptLiteral: string;

  constructor(
    private _auxActionsManager: AuxiliarActionsManagerService,
/*     private _documentInternalService: DocumentInternalService,
    private _confirmActionService: ConfirmActionService, */
  ) {
    // LITERALES
    this.errorHeaderLiteral = 'ERROR';
    this.noOperatorLiteral = 'No hay operador logado.';
    this.acceptLiteral = 'Aceptar';
  }



  // Las comprobaciones en la apertura se efectúan aquí.
  // Los mensajes de error se emiten en la validación.
  // El llamante decidirá la navegación en caso de éxito o fracaso, pero es aquí donde se abre el panel solicitado.
  showCashOutOffline(type: string): Observable<boolean> {
    /* const validationSucceed: boolean = this._validateReadyToShowCashOutOffline();
      this._logHelper.trace(
        `CashOutInternalService-> Resultado de validación del estado: ${validationSucceed}`
      ); */
      return Observable.create((observer: Subscriber<Boolean>) => {
        /* if (validationSucceed === true) { */
          this._auxActionsManager.requestCashOutOffline(type)
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
}


